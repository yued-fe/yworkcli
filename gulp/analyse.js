/**
 * 分析js中的依赖关系
 * Author: Luolei
 */
var gulpSlash = require('gulp-slash'); //处理windows和unix文件夹斜杠
var LOCAL_FOLDER = gulpSlash(__dirname).split('Yworkflow/')[0];

var path = require('path');

var gulp = require('gulp');
var del = require('del');
var gulp = require('gulp');
var chalk = require('chalk'); // 美化日志


var RevAll = require('gulp-rev-custom-tag');
var revReplace = require('gulp-rev-replace');

var gutil = require('gulp-util');
var resolveDependencies = require('gulp-resolve-dependencies');

var madge = require('madge');
var fs = require('fs');
var _ = require('lodash');
var stringifyStable = require('json-stable-stringify'); // json 排序


/**
 * 根据gulp rev-build任务生成出来的编译后进行二次版本处理
 */
gulp.task('deps-update-all', function(cb) {
    var _progressPash = gutil.env.path ? gutil.env.path : '';
    console.log(chalk.red('[Start]分析编译后的资源版本HASH变动'));

    //首先获得上一次的业务js编译后的hash值
    var _lastBuildHashMap = require(_progressPash + '/hash-tag-map/rev-HashMap-last.json');
    var _currentBuildHashMap = require(_progressPash + '/hash-tag-map/rev-HashMap.json');
    var _currentIdMap = require(_progressPash + '/hash-tag-map/rev-verionId.json');
    var _currentIdMapRevert = _.invert(_currentIdMap);

    //创建一个临时数据储存变化了的js名
    var _changedJsFiles = [],
        _changedJsSourceFiles = [];
    for (var i = 0; i < Object.keys(_currentBuildHashMap).length; i++) {
        var _checkJsFileName = Object.keys(_currentBuildHashMap)[i];
        if (!!_lastBuildHashMap[_checkJsFileName]) {
            //如果文件名没有变化,则比较两者的hash
            var _oldHash = !!_lastBuildHashMap[_checkJsFileName] ? _lastBuildHashMap[_checkJsFileName] : 00000;
            var _newHash = !!_currentBuildHashMap[_checkJsFileName] ? _currentBuildHashMap[_checkJsFileName] : 11111;

            //如果hash值发生了变化,则可以理解成依赖文件有变,接下来处理相关依赖
            if (_lastBuildHashMap[_checkJsFileName] !== _currentBuildHashMap[_checkJsFileName]) {
                console.log('[Hash比较] ' + chalk.green(_oldHash) + chalk.blue(' / ') + chalk.red(_newHash) + ' 文件:' + _checkJsFileName);
                _changedJsSourceFiles.push(_currentIdMapRevert[_checkJsFileName])
                _changedJsFiles.push(_checkJsFileName);
            }
        } else {
            console.log('[新文件]' + _checkJsFileName);
        }

    }

    if (_changedJsFiles.length > 0) {
        console.log(chalk.red('\n[结果]本次编译后变化的所有编译文件(含新增):') + '\n' + JSON.stringify(_changedJsFiles, null, 4));
        console.log(chalk.red('[结果]发生变化源文件是(HASH变化 版本号未变):') + '\n' + JSON.stringify(_changedJsSourceFiles, null, 4));
    } else {
        console.log(chalk.blue('[分析]没有文件发生变化'));
    }

    //接下来去检查所有的需要更新的
    var _updateJsFiles = [];
    var _updatdeAllTypeFiles = [];
    for (var i = 0; i < _changedJsSourceFiles.length; i++) {
        var _thisFile = _changedJsSourceFiles[i];
        //如果检查的js在反向依赖js表中,则进行遍历查询
        console.log(chalk.blue('[检查]编译后变化的文件:') + _thisFile);
        _updatdeAllTypeFiles.push(_thisFile);
    }
    _updatdeAllTypeFiles = _.uniq(_updatdeAllTypeFiles);
    if (_updatdeAllTypeFiles.length) {
        console.log(chalk.red('[结果] 二次检查后需要增加版本号的文件共有下列') + _.uniq(_updatdeAllTypeFiles).length + chalk.red('个'));
        console.log(JSON.stringify(_updatdeAllTypeFiles, null, 4));
    } else {
        console.log(chalk.blue('[结果]编译文件没有变化'));
    }

    /**
     * 接下来替换rev-verionId.json和更新rev-HashMap.json里面的版本文件
     */
    //更新rev-verionid.json
    var _currentFileString = JSON.stringify(_currentIdMap, null, 4);
    var _updateFileString = '';

    //更新hash-map
    var _currentBuildHashMapString = JSON.stringify(_currentBuildHashMap, null, 4);
    var _upadteBuildHashMapString = '';


    for (var i = 0; i < _updatdeAllTypeFiles.length; i++) {
        var _lastId = _currentIdMap[_updatdeAllTypeFiles[i]];


        var _lastFileNameTag = _lastId.split('/').pop().split('.').slice(-3);
        var _startVerNum = _lastFileNameTag[0],
            _secVerNum = _lastFileNameTag[1],
            _fileExt = _lastFileNameTag[2];
        var _currentVerNum = _startVerNum + '.' + _secVerNum;

        var _updateStartVernum = parseFloat(_startVerNum),
            _updateSecVerNum = parseFloat(_secVerNum);

        if (_updateSecVerNum < 99) {
            _updateSecVerNum = parseFloat(_updateSecVerNum) + 1;
        } else {
            _updateSecVerNum = '0';
            _updateStartVernum += 1;
        }

        var _updateVerNum = _updateStartVernum + '.' + _updateSecVerNum;
        var _updateFileName = _lastId.replace(_currentVerNum + '.' + _fileExt, _updateVerNum + '.' + _fileExt);
        console.log(chalk.blue('[处理]更新:') + chalk.green(_lastId) + chalk.blue(' ==> ') + chalk.green(_updateFileName));
        _currentFileString = _currentFileString.replace(_lastId, _updateFileName);
        _currentBuildHashMapString = _currentBuildHashMapString.replace(_lastId, _updateFileName);
        fs.renameSync(_progressPash + '/_tmp/' + _lastId, _progressPash + '/_tmp/' + _updateFileName);

    }

    var _updateFileStringBk = JSON.parse(_currentFileString);
    var _upadteBuildHashMapString = JSON.parse(_currentBuildHashMapString);

    if (_.uniq(_updatdeAllTypeFiles).length > 0) {
        console.log(chalk.green('[完成]更新rev-verionId.json中的文件版本号'));
    } else {
        console.log(chalk.green('[完成]最终rev-verionId.json生成'));
    }

    // 生成排序好的json文件
    fs.writeFileSync(_progressPash + '/hash-tag-map/rev-verionId.json', JSON.stringify(JSON.parse(stringifyStable(_updateFileStringBk)), null, 4));







});








