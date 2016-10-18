/**
 * Author: Luolei
 *
 * 自动将HTML中的文件转成combo路径

    <link rel="stylesheet" href="<%= staticConf.staticPath %>/css/reset.0.1.css">
    <link rel="stylesheet" href="<%= staticConf.staticPath %>/css/global.0.1.css">
    <link rel="stylesheet" href="<%= staticConf.staticPath %>/css/font.0.1.css">

 * 执行 gulp combo 后转换成
 *

 <link rel="stylesheet" data-ignore="true" href="//<%= staticConf.staticDomain %>/c/=/qd/css/reset.0.1.css,/qd/css/global.0.1.css,/qd/css/font.0.1.css?v=201605101449" />

 *
 * 若需要忽略某js和css,只需要在html标签中增加 data-ignore="true" 即可
 *
 */

var gulpSlash = require('gulp-slash'); //处理windows和unix文件夹斜杠
var LOCAL_FOLDER = gulpSlash(__dirname).split('Yworkflow/')[0];
process.chdir(LOCAL_FOLDER)

var path = require('path');
var SHELL_PATH = process.env.PWD
var YWORKFLOW_PATH = path.resolve(__dirname, '..');
// var PROJECT_CONFIG = require(SHELL_PATH + '/.yconfig'); //载入项目基础配置
var gulp = require('gulp');
var del = require('del');
var combo = require('gulp-qidian-combo');
var argv = require('yargs').argv;
var _ = require('lodash');

// var envType = "local";
// var staticConf = serverConf[envType]['static'];
var dateFormat = require('dateformat');
var gutil = require('gulp-util');


/**
 * 执行combo,将预览版的html中的css和js url地址进行combo拼接
 */

gulp.task('preview-combo', function() {
    var _useLogic = gutil.env.useLogic ? true : false;
    var _progressPash = gutil.env.path ? gutil.env.path : '';
    var _gtimgNameArgs = gutil.env.gtimg ? gutil.env.gtimg : 'qdm';

    /**
     * 设置默认项目配置
     * @type {Object}
     */
    var PROJECT_CONFIG = {
        "static": {
            "path": "build",
            "gtimgName": _gtimgNameArgs
        },
        "views": {
            "path": ""
        },
        "configs": {
            "path": "src/server/config"
        }
    }
    console.log(_progressPash + '/ywork.config.json');
    try {
        var custome_project_config = require(_progressPash + '/ywork.config.json');
        PROJECT_CONFIG = _.assign(PROJECT_CONFIG, custome_project_config);
    } catch (e) {
        console.log(e);
        console.log('未制定配置文件,使用默认配置');
    }



    var _updateTime = dateFormat((new Date()).getTime(), 'yyyymmddHHMM');
    var baseUri = '<%= staticConf.staticDomain %>/c/='; //这里设置combo的url地址
    console.log(_progressPash + '/' + PROJECT_CONFIG.views.output + '/**/*.html');
    gulp.src(_progressPash + '/' +  PROJECT_CONFIG.views.output + '/**/*.html')
        .pipe(gulpSlash())
        .pipe(combo(baseUri, {
            splitter: ',',
            async: false,
            ignorePathVar: '<%= staticConf.staticPath %>',
            assignPathTag: PROJECT_CONFIG.static.gtimgName, //这里需要配置combo后的相关文件路径
            serverLogicToggle: _useLogic,
            serverLogicCondition: 'envType == "pro" || envType == "oa"'
        }, {
            max_age: 31536000
        }))
        .pipe(gulp.dest(_progressPash + '/' + PROJECT_CONFIG.views.output));
})

/**
 * 不做版本,直接将view html进行combo处理
 * 直接命令行执行 gulp
 */

gulp.task('view-combo', function() {
    var _useLogic = gutil.env.useLogic ? true : false;
    var _progressPash = gutil.env.path ? gutil.env.path : '';

    var _updateTime = dateFormat((new Date()).getTime(), 'yyyymmddHHMM');
    // console.log('url时间更新' + _updateTime);
    var baseUri = '<%= staticConf.staticDomain %>/c/=';
    gulp.src('src/views/**/*.html')
        .pipe(gulpSlash())
        .pipe(combo(baseUri, {
            splitter: ',',
            async: false,
            ignorePathVar: '<%= staticConf.staticPath %>',
            assignPathTag: PROJECT_CONFIG.gtimgName, //这里需要配置combo后的相关文件路径
            serverLogicToggle: _useLogic,
            serverLogicCondition: 'envType == "pro" || envType == "oa', //这里配置combo的触发逻辑,可以是服务器环境,也可以是tag值
            updateTime: _updateTime
        }, {
            max_age: 31536000
        }))
        .pipe(gulp.dest('_previews'));
})