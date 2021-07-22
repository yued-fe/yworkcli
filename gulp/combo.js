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

var path = require('path');
var gulp = require('gulp');
var del = require('del');
var combo = require('gulp-qidian-combo');
var _ = require('lodash');
var removeEmptyLines = require('gulp-remove-empty-lines');

var dateFormat = require('dateformat');
var gutil = require('gulp-util');
var config = require('../utils/config');
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
        },
        "combo": {
            "force": true,
            "gtimgTag": "<%= staticConf.domains.static %>",
            "gtimgNamePrepend":"",//兼容方案,是否在子资源路由前增加文件别名
            "uri": "<%= staticConf.domains.static %>/c/=",
            "logicCondition": "envType !== \"pro\"",
        }
    }

    try {
        var custome_project_config = config(_progressPash);
        PROJECT_CONFIG = _.assign(PROJECT_CONFIG, custome_project_config);
    } catch (e) {
        console.log(e);
        console.log('未制定配置文件,使用默认配置');
    }

    var baseUri = PROJECT_CONFIG.combo.uri; //这里设置combo的url地址
    gulp.src(_progressPash + '/' + PROJECT_CONFIG.views.output + '/**/*.html')
        .pipe(combo(baseUri, {
            splitter: ',',
            async: false,
            ignorePathVar: PROJECT_CONFIG.combo.gtimgTag,
            assignPathTag: PROJECT_CONFIG.combo.gtimgNamePrepend, //这里需要配置combo后的相关文件路径
            serverLogicToggle: _useLogic,
            serverLogicCondition: PROJECT_CONFIG.combo.logicCondition
        }, {
            max_age: 31536000
        }))
        .pipe(removeEmptyLines({
            removeComments: true
        }))
        .pipe(gulp.dest(_progressPash + '/' + PROJECT_CONFIG.views.output));
})