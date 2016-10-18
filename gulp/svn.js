/**
 * 处理资源入库
 */


var gulpSlash = require('gulp-slash'); //处理windows和unix文件夹斜杠
var gulp = require('gulp');
var path = require('path');
var chalk = require('chalk'); //美化日志
var plumber = require("gulp-plumber");
var gutil = require('gulp-util');
var exec = require('exec');

gulp.task('svn', function() {
    console.log(chalk.green('[SVN] 测试发布页面文件'));
    console.log(gutil.env.path);
    var _progressPash = gutil.env.path ? gutil.env.path : '';
    _progressPash = _progressPash.replace(/ /g, '\\ ');
    // console.log('cd ' + _progressPash + '  && svn add _prelease/**/*' );
    exec('cd ' + _progressPash + '  && svn status' , function(err, stdout, stderr) {
		if (err) {
			console.log('Something went wrong...');
			console.dir(err);
			return;
		}
    	console.log(stdout);
    });

    exec('cd ' + _progressPash + '  && svn add _previews/** ' , function(err, stdout, stderr) {
		if (err) {
			console.log('静态入库时出现错误');
			console.dir(err);
			return;
		}
    	console.log(stdout);
    });


    // exec('cd ' + _progressPash + '  && svn add _prelease/**/*' + , function(err, stdout, stderr) {
    //     console.log(chalk.green('[SVN] HTMl文件已经复制到SVN路径:') + chalk.red(mainSvnPath));
    // });

    // exec('cp -rf ./_release/ ' + staticSvnPath + '&& cd ' + staticSvnPath + ' && rm *.html', function(err, stdout, stderr) {
    //     console.log(chalk.green('[SVN] 资源文件已经复制到SVN路径:') + chalk.red(mainSvnPath));
    //     gulp.src('*').pipe(prompt.prompt({
    //         type: 'input',
    //         name: 'type',
    //         message: '是否选择自动SVN上传HTML文件?[Y/n]'
    //             // default: 'n'
    //     }, function(res) {
    //         console.log(res.type);
    //         if (res.type == 'Y') {
    //             //首先增加页面SVN文件
    //             exec('cd ' + staticSvnPath + ' && cd ../ && svn add ' + projectConfigFile.uniqueID, function(err, stdout, stderr) {
    //                 if (err) {
    //                     throw (err);
    //                     console.log(stdout);
    //                 }
    //                 exec('cd ' + staticSvnPath + ' && cd ../ && svn commit -m "项目:' + projectConfigFile.uniqueID + '静态资源 提交"', function(err, stdout, stderr) {
    //                     if (err) {
    //                         throw (err);
    //                         console.log(stdout);
    //                     }
    //                 })

    //                 console.log(chalk.green('[SVN] 增加SVN文件:'));
    //             });
    //         } else {
    //             return false;
    //         }
    //     }))


    // });

});