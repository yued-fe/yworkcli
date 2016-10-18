/**
 * Author:luolei
 */

var gulpSlash = require('gulp-slash'); //处理windows和unix文件夹斜杠
var LOCAL_FOLDER = process.env.PWD;
LOCAL_FOLDER = LOCAL_FOLDER.replace(/ /g, '\\ ');

var path = require('path');
var SHELL_PATH = process.env.PWD
var YWORKFLOW_PATH = path.resolve(__dirname, '..');
// var PROJECT_CONFIG = require(SHELL_PATH + '/.yconfig'); //载入项目基础配置

//引入 gulp
var gulp = require('gulp');
var requireDir = require('require-dir');

var pkg = require('./package.json'); // 获得配置文件中相关信息
var plumber = require("gulp-plumber"); // 错误处理
var chalk = require('chalk'); // 美化日志
var taskListing = require('gulp-task-listing');
var gutil = require('gulp-util');

requireDir('./gulp');

// 设置相关路径
var paths = {
    css: ['/src/static/**/*.scss', '/src/**/*.css'],
    js: ['/src/static/**/*.js'], // js文件相关目录
    sass: '/src/static/**/*.scss',
    img: ['/src/static/**/*.{jpg,JPG,jpeg,JPEG,png,PNG,gif,GIF}'] // 图片相关
};


/**
 * 开发的过程中,监听src/目录下的sass、js等静态资源,进行编译处理
 */

var watching = false;

function gulpWatch(_progressPash) {
        gulp.watch(_progressPash +paths.js, ['scripts']);
        gulp.watch(_progressPash + paths.css, ['sass']);
        gulp.watch(_progressPash + paths.img, ['images-copy']);
}




/**
 * 自定义的gulp任务,可以单独执行 gulp {task}来执行相关任务
 */


gulp.task('help', taskListing);
// gulp
gulp.task('default', ['watch', 'scripts']);
//进行编译
gulp.task('build', ['sass', 'scripts','sfile']);
//创建带版本号的静态资源
gulp.task('build-static', ['clean', 'rev','rev-fix-url']);
//创建替换所有静态资源
gulp.task('build-views', ['rev-views', 'rev-fix-url', 'copy']);

gulp.task('auto-sprite', ['get-sprites-folder', 'retina-sprites-build','standard-sprites-build']);
