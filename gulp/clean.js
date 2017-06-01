/**
 * 清理临时文件
 * Author: Luolei
 */

var gulp = require('gulp');
var chalk = require('chalk'); // 美化日志
var del = require('del');
var gutil = require('gulp-util');
var cleanCSS = require('gulp-clean-css');
var _ = require('lodash');

gulp.task('clean', function(cb) {
	var progressPash = gutil.env.path ? gutil.env.path : '';
	progressPash = progressPash.replace(/ /g, '\\ ');
	console.log(chalk.red('[清理]删除上一次编译文件'));
	console.log(progressPash + '/build/');
	del.sync(['/build/'], {
		force: true,
		dryRun: true
	})
	cb()
});

gulp.task('clean-ana', function(cb) {
	console.log(chalk.red('[清理]删除依赖分析过程中生成的临时文件'));
	del(['hash-tag-map/deps.json', 'hash-tag-map/js-list.json', 'hash-tag-map/rev-HashMap-last.json', 'hash-tag-map/reverse-js.json'])
	cb()
});


gulp.task('clean-css-sourcemap', function(cb) {
	console.log(chalk.red('[清理]删除css和js中的sourcemap'));
	var _progressPash = gutil.env.path ? gutil.env.path : '';
	/**
	 * 设置默认项目配置
	 * @type {Object}
	 */
	var PROJECT_CONFIG = {
		"static": {
			"path": "build",
			"gtimgName": ""
		},
		"views": {
			"path": ""
		}
	}

	try {
		var custome_project_config = require(_progressPash + '/ywork.config.json');
		PROJECT_CONFIG = _.assign(PROJECT_CONFIG, custome_project_config);
		console.log(PROJECT_CONFIG);
	} catch (e) {
		console.log(e);
		console.log('未制定配置文件,使用默认配置');
	}
	gulp.src([
			_progressPash + '/' + PROJECT_CONFIG.static.path + '/' + PROJECT_CONFIG.static.gtimgName + '/**/*.css'
		])
		.pipe(cleanCSS({
			format: 'beautify' // formats output in a really nice way
		}))
		.pipe(gulp.dest(_progressPash + '/' + PROJECT_CONFIG.static.path + '/' + PROJECT_CONFIG.static.gtimgName))
})