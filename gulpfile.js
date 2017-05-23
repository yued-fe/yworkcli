/**
 * Gulp tasks entry
 * Author:luolei
 */

var gulp = require('gulp');
var requireDir = require('require-dir');
var pkg = require('./package.json'); // 获得配置文件中相关信息
var taskListing = require('gulp-task-listing');

requireDir('./gulp');

/**
 * 自定义的gulp任务,可以单独执行 gulp {task}来执行相关任务
 */
gulp.task('help', taskListing);

