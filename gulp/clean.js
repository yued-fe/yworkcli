/**
 * 清理临时文件
 * Author: Luolei
 */

var gulpSlash = require('gulp-slash'); //处理windows和unix文件夹斜杠
var gulp = require('gulp');
var chalk = require('chalk'); // 美化日志
var plumber = require("gulp-plumber");
var rename = require('gulp-rename');
var concat = require('gulp-concat');
var del = require('del');
var gutil = require('gulp-util');



gulp.task('clean', function(cb) {
    var _progressPash = gutil.env.path ? gutil.env.path : '';
    _progressPash = _progressPash.replace(/ /g, '\\ ');
    console.log(chalk.red('[清理]删除上一次编译文件'));
    console.log(_progressPash + '/build/');
    del.sync(['/build/'], { force: true, dryRun: true })
    cb()
});

gulp.task('clean-ana', function(cb) {
    console.log(chalk.red('[清理]删除依赖分析过程中生成的临时文件'));
    del(['hash-tag-map/deps.json', 'hash-tag-map/js-list.json', 'hash-tag-map/rev-HashMap-last.json', 'hash-tag-map/reverse-js.json'])
    cb()
});
