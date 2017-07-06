/**
 * 离线包打包
 * Created by liuwentao on 17/7/6.
 */
var fs = require('fs');
var gulp = require('gulp');
var del = require('del');
var zip = require('gulp-zip');
var jeditor = require("gulp-json-editor");
var size = require('gulp-size');
var notify = require('gulp-notify');
var path = require('path');
var optimist = require('optimist');
var extend = require('extend');

// 获取命令中参数
var argv = optimist.argv;
var configJson = {};
var projectPath = '';
var offlineVersion = 1;
// 默认参数
var DEFAULT_CONFIG = {
    "src": {
        "static": ".cache/static",
        "views": ".cache/views",
        "config": "src/offlineFile/config.json",
        "offlineConfig": "src/offlineFile/offline_config.json"
    },
    "build": {
        "static": "dist/static",
        "views": "dist/views"
    },
    "offline": {
        "static": "dist/offline/1/app.webnovel.com/static",
        "views": "dist/offline/1/app.webnovel.com/views",
        "config": "dist/offline/1",
        "offlineConfig": "dist/offline"
    },
    "zipPath": "dist/offline",
    "zipName": "1",
    "buildPath": "dist"
};

// 参数初始化
function dataInit(argv) {
    try {
        var configData = fs.readFileSync(argv.configFile);
        projectConfigJson = JSON.parse(configData);
        configJson = extend({}, DEFAULT_CONFIG, projectConfigJson);
    } catch (error) {
        configJson = DEFAULT_CONFIG ;
    }
    console.log('=======================================');
    console.log('yworkoffline.config.json 配置是 : ') ;
    console.log(configJson);
    console.log('=======================================');
    projectPath = argv.path;

}


gulp.task('offline:remove', function () {
    // 参数初始化
    dataInit(argv);
    var delPath = projectPath + '/' + configJson.buildPath;
    return del(delPath, {dot: true, force: true});
});


gulp.task('offline:static', ['offline:remove'], function () {

    return gulp.src(projectPath + '/' + configJson.src.static + '/**/*')
        .pipe(gulp.dest(projectPath + '/' + configJson.build.static))
        .pipe(gulp.dest(projectPath + '/' + configJson.offline.static));

});

gulp.task('offline:views', ['offline:static'], function () {

    return gulp.src(projectPath + '/' + configJson.src.views + '/**/*')
        .pipe(gulp.dest(projectPath + '/' + configJson.build.views))
        .pipe(gulp.dest(projectPath + '/' + configJson.offline.views));

});

gulp.task('offline:config', ['offline:views'], function () {

    console.log('产出 offline.json 文件 到目录: ');
    console.log(projectPath + '/' + configJson.offline.config);

    return gulp.src(projectPath + '/' + configJson.src.config)
        .pipe(jeditor(function (json) {
            json.version = parseInt(json.version) + 1;
            offlineVersion = json.version;
            return json;
        }))
        .pipe(gulp.dest(projectPath + '/' + configJson.offline.config));

});

gulp.task('offline:offlineConfig', ['offline:config'], function () {

    console.log('产出 offline_config.json 文件 到目录:');
    console.log(projectPath + '/' + configJson.offline.offlineConfig );

    return gulp.src(projectPath + '/' + configJson.src.offlineConfig)
        .pipe(jeditor(function (json) {
            json.version = parseInt(offlineVersion);
            json.pkgList[0].pkgVersion = parseInt(offlineVersion);
            return json;
        }))
        .pipe(gulp.dest(projectPath + '/' + configJson.offline.offlineConfig));

});

gulp.task('offline', ['offline:offlineConfig'], function () {

    var offlineZipPath = projectPath + '/' + configJson.zipPath + '/';
    console.log(offlineZipPath);
    const s = size();

    return gulp.src(offlineZipPath + configJson.zipName + '/**/*', {base: offlineZipPath})
        .pipe(zip(configJson.zipName + '.zip'))
        .pipe(gulp.dest(offlineZipPath))
        .pipe(s)
        .pipe(notify({
            onLast: true,
            message: function () {
                console.log('This Build:Total size : ' + s.prettySize);
            }
        }));

});

