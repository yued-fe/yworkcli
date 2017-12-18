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
var grep = require('../../utils/grep').grep;

/**
 * @module StaticReference
 * @param baseDir { String } 基础的url root
 * @param uri { String } 基于baseDir 的uri
 * @param contents 内容 utf-8
 * @param store reference to Store
 * @param exclude 在计算deps的时候,排除掉的文件名
 * @param ignoreReplace 在计算hash的时候,排除替换的文件名
 * @constructor
 */
function StaticReference(baseDir, uri, contents, store, exclude, ignoreReplace, replaceSelf) {
    this.baseDir = baseDir;
    this.exclude = exclude;
    this.ignoreReplace = ignoreReplace;
    this.replaceSelf = replaceSelf;
    this.uri = uri;
    this.waitings = [];
    this.deps = [];
    this.remains = 0;
    this.store = store;
    this.contents = contents;
    this.hashContents = contents;
    this.file = '';
    this.hash = '';
    this.isBinaryFile = false;
}

StaticReference.prototype.init = function (waitings) {
    
    var file = this.store.files[this.uri];
    this.file = file;
    this.isBinaryFile = is_binary_file(file);
    this.isBinaryFile ? (this.contents = file.contents) : (this.contents = String(file.contents));
    
    if(waitings) {
        this.addWaitings(waitings);
    }
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
        var isBinaryFile = this.isBinaryFile;
        var replaceSelf = this.replaceSelf;
        
        for(var i = 0, len = deps.length; i < len; i++) {
            var depHash = store.getHash(deps[i].uri);
            if(depHash && !isBinaryFile) {
                if(!globMatch(deps[i].uri, ignoreReplace)) {
                    var rs = replaceHashExtname(deps[i].uri, depHash);
                    hashContents = hashContents.replace(new RegExp(escapeRegExp(deps[i].uri), 'g'), rs);
                }
            }
        }
        // 保存replace之后的hashContents
        this.hashContents = hashContents;

        // 计算hash
        var md5ed = calcMd5(hashContents);
        
        store.setHash(uri, md5ed);
        this.hash = md5ed;

        if(!isBinaryFile && replaceSelf) {
            hashContents = hashContents.replace(new RegExp(escapeRegExp(uri), 'g'), replaceHashExtname(uri, this.hash));
            this.hashContents = hashContents;
        }

        if(this.file) {
            this.file.contents = new Buffer(this.hashContents);
            this.file.path = replaceHashExtname(this.file.path, this.hash);
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
var RefStore = function(baseDir, exclude, ignoreReplace, replaceSelf) {
    this.baseDir = baseDir;
    this.exclude = exclude;
    this.ignoreReplace = ignoreReplace;
    this.replaceSelf = replaceSelf || false;
    this.store = {};
    this.waitings = {};
    this.hash = {};
    this.files = {};
    this.prefetchWaitings = [];
};

RefStore.prototype.addPrefetchWaiting = function (uri) {
    this.prefetchWaitings.push(uri);
};

RefStore.prototype.doPrefetchWaitings = function () {
    var prefetchWaitings = this.prefetchWaitings;
    var result = [];
    var that = this;
    
    return new Promise(function (resolve, reject) {

        var MAX_CONCURRENCY = 100;
        var recycleTimes = Math.ceil(prefetchWaitings.length / 100);

        function prefetch(i) {
            console.log('第' + i + '次prefetch');
            var self = arguments.callee;
            if(i === recycleTimes) {
                console.log('prefetch 结束');
                for(var i = 0, len = prefetchWaitings.length; i < len; i++) {
                    that.waitings[prefetchWaitings[i]] = result[i];
                }
                console.log(that.waitings);
                resolve();
                return;
            }

            var arr = [];
            for(var j = i * MAX_CONCURRENCY; j < (i + 1) * MAX_CONCURRENCY && j < prefetchWaitings.length; j++) {
                arr.push(grep(that.baseDir, prefetchWaitings[j], that.exclude));
            }

            Promise.all(arr)
                .then(function (rs) {
                    result = result.concat(rs);
                    self(++i);
                });
        }

        prefetch(0);
    });
};

RefStore.prototype.setStreamFile = function (uri, file) {
    
    this.files[uri] = file;
    
}

RefStore.prototype.initRef = function (uri) {
    if(this.store[uri]) {
        return this.store[uri];
    }

    var ref = this.store[uri] = new StaticReference(this.baseDir, uri, '', this, this.exclude, this.ignoreReplace, this.replaceSelf);
    return ref;
};

RefStore.prototype.getByUri = function (uri) {
    if(this.store[uri]) {
        return this.store[uri];
    }
    
    var ref = this.store[uri] = new StaticReference(this.baseDir, uri, '', this, this.exclude, this.ignoreReplace, this.replaceSelf);
    ref.init(this.waitings[uri]);
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

function replaceHashExtname (filePath, hash) {
    var extname = path.extname(filePath);
    return filePath.slice(0, filePath.lastIndexOf(extname)) + '.' + hash + extname;
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

var is_binary_file = function (file) {

  var length = (file.contents.length > 50) ? 50 : file.contents.length;
  for (var i = 0; i < length; i++) {
    if (file.contents[i] === 0) {
      return true;
    }
  }
  return false;

};

/**
 * @param options { baseDir, exclude, manifest }
 * @type {module.exports}
 */
exports = module.exports = function (options) {
    
    var refStore = new RefStore(options.baseDir, options.exclude, options.ignoreReplace, options.replaceSelf);

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
        refStore.addPrefetchWaiting(relUri);
        cb();
        
    }, function (cb) {
       
        var that = this;
        var st = new Date();
        console.log('do before prefetch ' + st);
        refStore.doPrefetchWaitings()
            .then(function (value) {
                var end = new Date();
                console.log('do after prefetch ' + end);
                console.log('consume time is ' + (end - st));
                var waitings = refStore.waitings;
                var uris = Object.keys(waitings);
                // new ref 
                for(var i = 0, len = uris.length; i < len; i++) {
                    var ref = refStore.initRef(uris[i]);
                }
                // init ref
                for(var i = 0, len = uris.length; i < len; i++) {
                    var ref = refStore.getByUri(uris[i]);
                    ref.init(waitings[uris[i]]);
                }

                var stores = refStore.getAllStore();
                uris = Object.keys(stores);
                // 初始化
                for(var i = 0, len = uris.length; i < len; i++) {
                    stores[uris[i]].notify();
                }

                // 输出 this.hash
                var hashes = refStore.getAllHash();
                var sortedHashes = {};
                var hashesKeys = Object.keys(hashes).sort();
                hashesKeys.forEach(function (singleHash) {
                    // js/book/a.js => js/book/a.129df.js
                    sortedHashes[singleHash] = replaceHashExtname(singleHash, hashes[singleHash]);
                });

                for(var i = 0, len = hashesKeys.length; i < len; i++) {
                    that.push(stores[hashesKeys[i]].file);
                }

                // 将sortedHashes进行倒序排
                var sortedKeys = Object.keys(sortedHashes).sort().reverse();
                var newSortedHashes = {};
                sortedKeys.forEach(function (value, key) {
                    newSortedHashes[value] = sortedHashes[value];
                });
                
                that.push(new gutil.File({
                    cwd: '',
                    base: '',
                    path: options.manifest,
                    contents: new Buffer(JSON.stringify(newSortedHashes, null, 4))
                }));
                cb();
            })
            .catch(function (e) {
                console.log(e);
            });
    });
};

