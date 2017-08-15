/**
 * Created by patrickliu on 2017/6/26.
 */

var gulp = require('gulp');
var gutil = require('gulp-util');
var execSync = require('child_process').execSync;
var path = require('path');
var fs = require('fs');
var utilDeps = require('../utils/deps');
var through = require('through2');


function generateDeps(envPath, gtimgName) {
    var exportPath = path.resolve(envPath, 'hash-tag-map/deps.json');
    var deps = utilDeps(envPath, gtimgName);
    fs.writeFileSync(exportPath, JSON.stringify(deps, null, 4));
    return deps;
}

function generateAlias(envPath, gtimgName) {
    var revManifest = path.resolve(envPath, 'hash-tag-map/rev-manifest.json');
    var revObject = JSON.parse(fs.readFileSync(revManifest));
    var exportPath = path.resolve(envPath, 'hash-tag-map/alias.json');
    var alias = {};
    for(var i in revObject) {
        if(path.extname(revObject[i]) === '.js') {
            alias[gtimgName + '/' + i] = gtimgName + '/' + revObject[i];
        }
    }
    fs.writeFileSync(exportPath, JSON.stringify(alias, null, 4));
    return alias;
}


gulp.task('deps', function () {
// passed by command line argv
    var envPath = gutil.env.path || './';
    var gtimgName = gutil.env.gtimgName || '';
    var viewsOutput = gutil.env.viewsOutput || '';
    var globalDeps = generateDeps(envPath, gtimgName);
    var globalAlias = generateAlias(envPath, gtimgName);

    // 将cache中的html,获取依赖并注入
    return gulp.src(envPath + '/' + viewsOutput + '/**/*.html', { base: envPath + '/' + viewsOutput })
        .pipe(replaceDepsAndAlias(globalDeps, globalAlias))
        .pipe(gulp.dest(envPath + '/' + viewsOutput));
});

function replaceDepsAndAlias(globalDeps, globalAlias) {
    return through.obj(function(file, encoding, callback) {

        // is null doesn't supported
        if (file.isNull()) {

            // 传给下一个through对象
            this.push(file);
            return callback();
        }

        // stream doesn't supported
        if (file.isStream()) {

            return callback(new Error('Streaming not supported'));
        }
        
        // 将file文件中的LBF.use(['a.js', 'b.js'])中的a.js, b.js提取出来
        var regexp = /LBF\.use[^\(]*\([^\[]*\[([^\]]*)\]/g;
        var html = String(file.contents);
        var reliesModule = [];
        html.replace(regexp, function ($0, $1) {
            if($1) {
                var moduleArr = $1.split(',');
                moduleArr = moduleArr.map(function (str) {
                    // 从引号当中获取值
                    var regQt = /[^'"]*['"]([^'"]*)['"]/;
                    var mc = str.match(regQt);
                    if(mc && mc.length > 1) {
                        return mc[1];
                    }
                    return '';
                });
                moduleArr.forEach(function (str) {
                    if(reliesModule.indexOf(str) === -1) {
                        reliesModule.push(str);
                    }
                });
            }
        });
        
        // 根据reliesModule获取全量的reliesModule
        for(var i = 0; i < reliesModule.length; i++) {
            var subModule = reliesModule[i];
            var subModuleDeps = globalDeps[subModule];
            if(subModuleDeps) {
                subModuleDeps.forEach(function (subDeps) {
                    if(reliesModule.indexOf(subDeps) === -1) {
                        reliesModule.push(subDeps);
                    }
                });
            }
        }

        // 我们开始计算deps && alias
        var alias = {};
        var deps = {};
        reliesModule.forEach(function (subModule) {
            if(globalAlias[subModule]) {
                alias[subModule] = globalAlias[subModule];
            }
            if(globalDeps[subModule]) {
                deps[subModule] = globalDeps[subModule];
            }
        });
        
        // 用alias和deps替换掉代码里面的<%= lbf.alias %>和<%= lbf.deps %>
        html = html.replace('<%= lbf.alias %>', JSON.stringify(alias || {}));
        html = html.replace('<%= lbf.deps %>', JSON.stringify(deps || {}));
        
        // 设置到file.contents给后面的task使用
        file.contents = new Buffer(html);
        this.push(file);
        callback();
    });
}



