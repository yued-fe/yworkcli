/**
 * Created by patrickliu on 2017/7/5.
 */

/**
 * 思路: 获取src下的静态文件,然后在src中grep自己,看出现在哪一些文件到中.
 * 出现在对应的文件当中,表示自己被别人引用.
 * 可能会有循环引用, 即查看waitings和deps里面是不是存在的相互引用
 * function StaticReference() {
 *     // 即a.js出现了b.js当中, 将b.js, push进this.waitings
 *     this.waitings = [];
 *     // b.js出现在a.js的代码当中,则将b.js, push进this.deps
 *     this.deps = [];
 *     // 还有多少个deps没有计算出md5码
 *     this.remains = 0;
 *  }
 */
var path = require('path');
var fs = require('fs');
var crypto = require('crypto');
var through = require('through2');
var gutil = require('gulp-util');
var globMatch = require('../../utils/globmatch');
var grep = require('../../utils/grep');

function StaticReference(baseDir, uri, contents, store, exclude, ignoreReplace) {
    this.baseDir = baseDir;
    this.exclude = exclude;
    this.ignoreReplace = ignoreReplace;
    this.uri = uri;
    this.waitings = [];
    this.deps = [];
    this.remains = 0;
    this.store = store;
    this.contents = contents;
    this.hashContents = contents;
    this.file = '';
    this.hash = '';
}

StaticReference.prototype.init = function () {

    var waitings = grep(this.baseDir, this.uri, this.exclude);
    if(waitings.length === 0 || waitings === '') {
        return;
    }
    this.addWaitings(waitings);
};
StaticReference.prototype.addWaitings = function (waitings) {
    var added = [];
    var store = this.store;
    if(typeof waitings !== 'object') {
        waitings = [waitings];
    }
    for(var i = 0, len = waitings.length; i < len; i++) {
        var waitingObj = store.getByUri(waitings[i]);
        if(this.waitings.indexOf(waitingObj) === -1) {
            this.waitings.push(waitingObj);
            added.push(waitings[i]);
            waitingObj.addDeps(this.uri);
        }
    }
    return added;
};
StaticReference.prototype.addDeps = function (deps) {
    var added = [];
    var store = this.store;
    if(typeof deps !== 'object') {
        deps = [deps];
    }
    for(var i = 0, len = deps.length; i < len; i++) {
        var depObject = store.getByUri(deps[i]);
        // 不存在deps当中
        if(this.deps.indexOf(depObject) === -1) {
            this.deps.push(depObject);
            if(!store.getHash(deps[i])) {
                // 并且不在store当中
                added.push(deps[i]);

                // 将自己添加到对方的waitings当中
                var waiting = store.getByUri(deps[i]);
                waiting.addWaitings(this.uri);
            }
        }
    }
    this.remains += added.length;
    return added;
};
// 如果自己的依赖都ok了, 则通知自己的waitings自己也ok了
StaticReference.prototype.notify = function () {
    if(this.remains === 0) {
        
        this.remains = -1;
        // set hash to store
        var store = this.store;
        var deps = this.deps;
        var uri = this.uri;
        var ignoreReplace = this.ignoreReplace || [];
        var hashContents = this.contents;
        var waitings = this.waitings;
        for(var i = 0, len = deps.length; i < len; i++) {
            var depHash = store.getHash(deps[i].uri);
            if(depHash) {
                if(!globMatch(deps[i].uri, ignoreReplace)) {
                    var extname = path.extname(deps[i].uri);
                    var rs = deps[i].uri.slice(0, deps[i].uri.lastIndexOf(extname)) + '.' + depHash + extname;
                    hashContents = hashContents.replace(new RegExp(escapeRegExp(deps[i].uri), 'g'), rs);
                }
            }
        }
        // 保存replace之后的hashContents
        this.hashContents = hashContents;
        
        var md5ed = calcMd5(hashContents);
        // 计算hash
        store.setHash(uri, md5ed);
        this.hash = md5ed;
        
        if(this.file) {
            var extname = path.extname(this.file.path);
            this.file.contents = new Buffer(this.hashContents);
            this.file.path = '' + this.file.path.slice(0, this.file.path.lastIndexOf(extname)) + '.' + this.hash + extname;
        }

        for(var i = 0, len = waitings.length; i < len; i++) {
            waitings[i].beInformedBy(this.uri);
        }
        
        function escapeRegExp(str) {
          return str.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
        };
    }
};
// 被inform之后,将remains--
StaticReference.prototype.beInformedBy = function (uri) {
    var deps = this.deps;
    var selfUri = this.uri;
    var store = this.store;

    // 说明自身已经有hash了, 被inform直接return
    if(store.getHash(selfUri)) {
        return;
    }
    
    if(deps.indexOf(store.getByUri(uri)) !== -1) {
        this.remains--;
    }
    if(this.remains === 0) {
        this.notify();
    }
};

// store hash and StaticReference Object
var RefStore = function(baseDir, exclude, ignoreReplace) {
    this.baseDir = baseDir;
    this.exclude = exclude;
    this.ignoreReplace = ignoreReplace;
    this.store = {};
    this.hash = {};
};

RefStore.prototype.setStreamFile = function (uri, file) {
    var ref = this.getByUri(uri);
    ref.file = file;
    return ref;
}

RefStore.prototype.getByUri = function (uri) {
    if(this.store[uri]) {
        return this.store[uri];
    }
    
    var filePath = path.resolve(this.baseDir, uri);
    var contents = '';
    // 判断file的类型,非text file不读内容
    contents = fs.readFileSync(filePath, 'utf-8');
    
    var ref = this.store[uri] = new StaticReference(this.baseDir, uri, contents, this, this.exclude, this.ignoreReplace);
    ref.init();
    return ref;
    
};
RefStore.prototype.getAllStore = function () {
    return this.store;
};
RefStore.prototype.setHash = function (key, value) {
    this.hash[key] = value;
    return this.hash;
};
RefStore.prototype.getHash = function (key) {
    return this.hash[key];
};
RefStore.prototype.getAllHash = function () {
    return this.hash;
};

function calcMd5(file){
    var md5 = crypto.createHash('md5');
    md5.update(file, 'utf8');
    return  md5.digest('hex').slice(0, 5);
}

function stringStream(filename, string) {
    var src = require('stream').Readable({ objectMode: true });
    src._read = function () {
        this.push(new gutil.File({
            cwd: '',
            base: '',
            path: filename,
            contents: new Buffer(string)
        }))
    };
    return src;
}

/**
 * @param options { baseDir, exclude, manifest }
 * @type {module.exports}
 */
exports = module.exports = function (options) {
    
    var refStore = new RefStore(options.baseDir, options.exclude, options.ignoreReplace);

    return through.obj(function(file, enc, cb) {

        if (file.isStream()) {
            this.emit('error', new gutil.PluginError('gulp-debug', 'Streaming not supported'));
            return cb();
        }

        if(!file.contents){
            return cb();
        }
        
        // 获取uri
        var base = options.baseDir;
        var relUri = path.relative(base, file.path);
        refStore.setStreamFile(relUri, file);
        cb();
    }, function (cb) {
        
        var stores = refStore.getAllStore();
        var uris = Object.keys(stores);
        for(var i = 0, len = uris.length; i < len; i++) {
            stores[uris[i]].notify();
        }
        // 输出 this.hash
        var hashes = refStore.getAllHash();
        var sortedHashes = {};
        var hashesKeys = Object.keys(hashes).sort();
        hashesKeys.forEach(function (singleHash) {
            // js/book/a.js => .js
            var ext = path.extname(singleHash);
            // => js/book/a.129df.js
            var rs = singleHash.slice(0, singleHash.lastIndexOf(ext)) + '.' + hashes[singleHash] + ext;
            sortedHashes[singleHash] = rs;
        });
        
        for(var i = 0, len = hashesKeys.length; i < len; i++) {
            this.push(stores[hashesKeys[i]].file);
        }
        
        this.push(new gutil.File({
            cwd: '',
            base: '',
            path: options.manifest,
            contents: new Buffer(JSON.stringify(sortedHashes, null, 4))
        }));
        cb();
    });
};

