/**
 * 发布和编译
 * Author: Luolei
 */
var gutil = require('gulp-util');
var path = require('path');

var YWORKFLOW_PATH = path.resolve(__dirname, '..');

var gulp = require('gulp');
var del = require('del');
var chalk = require('chalk'); // 美化日志
var _ = require('lodash');

var rename = require('gulp-rename')
var rev = require('./plugins/rev');
var revGrep = require('./plugins/rev-grep');
var RevAll = require('gulp-rev-custom-tag');
var gulpFilter = require('gulp-filter');
var revReplace = require('gulp-rev-replace');
var eos = require('end-of-stream');
var execSync = require('child_process').execSync;

var stringify = require('json-stable-stringify');
var sortJSON = require('gulp-json-sort').default;

var globMatch = require('../utils/globmatch');
var config = require('../utils/config');
var paths = {
    sass: 'src/static/**/*.scss',
    build: 'build',
    prelease: '_prelease'
};

/**
 * 设置默认项目配置
 * @type {Object}
 */
var PROJECT_CONFIG = {
    "static": {
        "path": "build",
        "gtimgName": 'qdm'
    },
    "views": {
        "path": ""
    },
    "deps": {
        "replaceMD5": ['*']
    }
}

/**
 * 分析目标文件夹的hash值,根据hash-tag-map 进行处理
 */
gulp.task('rev-hash', function(cb) {
    console.log('[Yworkcli]处理静态资源版本号 简化HASH流程');
    var _skipReversion = (gutil.env.skipV === 'true') ? true : false;
    var _progressPash = gutil.env.path ? gutil.env.path : '';
    var _gtimgNameArgs = gutil.env.gtimg ? gutil.env.gtimg : 'qdm';
    var _deps = gutil.env.deps ? (!!gutil.env.deps) : false;

    try {
        var custome_project_config = config(_progressPash);
        PROJECT_CONFIG = _.assign(PROJECT_CONFIG, custome_project_config);
    } catch (e) {
        console.log('未指定配置文件,使用默认配置');
    }

    if (!!_skipReversion) {
        console.log(chalk.green('[处理]版本号变化') + chalk.red('关闭'));
    } else {
        console.log(chalk.green('[处理]版本号变化') + chalk.blue('开启'));
    }
    var ignoredFiles = {};
    var filterManifestJson = gulpFilter(function(file) {
        // 过滤掉manifest.json
        return !(/manifest\.json$/.test(file.path));
    });
    var st1 = gulp.src([
            _progressPash + '/' + PROJECT_CONFIG.static.path + '/' + PROJECT_CONFIG.static.gtimgName + '/**',
            '!' + _progressPash + '/' + PROJECT_CONFIG.static.path + '/**/*.map',
            '!' + _progressPash + '/' + PROJECT_CONFIG.static.path + '/**/*.html'
        ])
        .pipe(revGrep(_.extend({
            manifest: 'rev-manifest.json',
            baseDir: _progressPash + '/' + PROJECT_CONFIG.static.path + '/' + PROJECT_CONFIG.static.gtimgName+ '/',
            exclude: [
                '**/.map/**/*.map',
                '**/.map/**/*.*.map',
                '**/*.html',
                '**/*.*.html'
            ]
        }, _deps ? { ignoreReplace: ['**/*.js'] } : { replaceSelf: true })))
        .pipe(filterManifestJson)
        .pipe(gulp.dest(_progressPash + '/' + PROJECT_CONFIG.static.output));
    
    eos(st1, function () {
        eos(filterManifestJson.restore({ end: true})
            .pipe(gulp.dest(_progressPash + '/hash-tag-map/')), function () {
            cb();
        });
    });
});


/**
 * 分析目标文件夹的hash值,根据hash-tag-map 进行处理
 */
gulp.task('rev', function(cb) {
    console.log('[Yworkcli]处理静态资源版本号');
    var _skipReversion = (gutil.env.skipV === 'true') ? true : false;
    var _progressPash = gutil.env.path ? gutil.env.path : '';
    var _gtimgNameArgs = gutil.env.gtimg ? gutil.env.gtimg : 'qdm';

    try {
        var custome_project_config = config(_progressPash);
        PROJECT_CONFIG = _.assign(PROJECT_CONFIG, custome_project_config);
    } catch (e) {
        console.log('未指定配置文件,使用默认配置');
    }

    if (!!_skipReversion) {
        console.log(chalk.green('[处理]版本号变化') + chalk.red('关闭'));
    } else {
        console.log(chalk.green('[处理]版本号变化') + chalk.blue('开启'));
    }


    var revAll = new RevAll({
        prefix: '', //自动增加url路径
        dontRenameFile: [/^\/favicon.ico$/g, '.html', '.json', '.map'],
        hashLength: 5,
        hashTagMapPath: 'hash-tag-map', //这里可以自定义配置hashTag映射表的目录
        skipVersion: _skipReversion,
        taskAbsPath: _progressPash
    });

    var ignoredFiles = {};
    gulp.src([
            _progressPash + '/' + PROJECT_CONFIG.static.path + '/' + PROJECT_CONFIG.static.gtimgName + '/**',
            '!' + _progressPash + '/' + PROJECT_CONFIG.static.path + '/**/*.map',
            '!' + _progressPash + '/' + PROJECT_CONFIG.static.path + '/**/*.html'
        ])
        .pipe(revAll.revision())
        .pipe(gulp.dest(_progressPash + '/' + PROJECT_CONFIG.static.output))
        .pipe(revAll.manifestFile()) //创建静态资源hash映射表
        .pipe(sortJSON({
            space: 2
        }))
        .pipe(gulp.dest(_progressPash + '/hash-tag-map'))
        .pipe(revAll.verionIdFile()) //创建递增id映射表
        .pipe(sortJSON({
            space: 2
        }))
        .pipe(gulp.dest(_progressPash + '/hash-tag-map'))

    cb()
});


gulp.task('copy-hash-map', function(cb) {
    var _progressPash = gutil.env.path ? gutil.env.path : '';
    gulp.src(_progressPash + '/hash-tag-map/rev-HashMap.json')
        .pipe(rename('rev-HashMap-last.json'))
        .pipe(gulp.dest(_progressPash + '/hash-tag-map'))
    cb()
})



/**
 * 检查所有的静态资源HASH是否有变动
 * @param  {[type]} cb) {               var _skipReversion [description]
 * @return {[type]}     [description]
 */
gulp.task('rev-build-all', function(cb) {
    var _skipReversion = (gutil.env.skipV === true) ? true : false;
    var _progressPash = gutil.env.path ? gutil.env.path : '';

    try {
        var custome_project_config = config(_progressPash);
        PROJECT_CONFIG = _.assign(PROJECT_CONFIG, custome_project_config);
    } catch (e) {
        console.log('未指定配置文件,使用默认配置');
    }

    /**
     * 首先备份原有的rev-HashMap.json,做比较用
     */

    var revAll = new RevAll({
        prefix: '', //自动增加url路径
        dontRenameFile: [/^\/favicon.ico$/g, '.html', '.json'],
        hashLength: 5,
        hashTagMapPath: 'hash-tag-map-build', //这里可以自定义配置hashTag映射表的目录
        skipVersion: _skipReversion,
        recursiveRev: true, //进行递归版本叠加
        taskAbsPath: _progressPash
    });
    var ignoredFiles = {
        // sprites:paths.dist.
    };

    gulp.src(_progressPash + '/' + PROJECT_CONFIG.static.output + '/' + '**/*')
        .pipe(revAll.revision())
        .pipe(revAll.verionRevFile()) //创建静态资源hash映射表
        .pipe(sortJSON({
            space: 2
        }))
        .pipe(gulp.dest(_progressPash + '/hash-tag-map'))

    cb()
});

/**
 * 二次替换,防止js和css中有url没有被替换
 */

gulp.task('rev-fix', function() {
    var _progressPash = gutil.env.path ? gutil.env.path : '';
    var _gtimgNameArgs = gutil.env.gtimg ? gutil.env.gtimg : 'qdm';
    var _sourceManifest = (gutil.env.hash === 'true') ? 'rev-manifest.json' : 'rev-verionId.json';
    try {
        var custome_project_config = config(_progressPash);
        PROJECT_CONFIG = _.assign(PROJECT_CONFIG, custome_project_config);
    } catch (e) {
        console.log('未指定配置文件,使用默认配置');
    }


    var manifest = gulp.src(_progressPash + "/hash-tag-map/" + _sourceManifest);
    return gulp.src([_progressPash + '/' + PROJECT_CONFIG.static.output + '/**/*.{js,ejs,css}']) // Minify any CSS sources
        .pipe(revReplace(_.extend({}, {
            manifest: manifest
        }, gutil.env.deps === 'true' ? {
            modifyUnreved: function (filename) {
                if(globMatch(filename, PROJECT_CONFIG.deps.replaceMD5)) {
                    return filename;
                }
                return '';
            },
            modifyReved: function (filename) {
                if(globMatch(filename, PROJECT_CONFIG.deps.replaceMD5)) {
                    return filename;
                }
                return '';
            }
        } : {})))
        .pipe(gulp.dest(_progressPash + '/' + PROJECT_CONFIG.static.output))
});



gulp.task('tmp-store', function() {
    var _progressPash = gutil.env.path ? gutil.env.path : '';

    try {
        var custome_project_config = config(_progressPash);
        PROJECT_CONFIG = _.assign(PROJECT_CONFIG, custome_project_config);
    } catch (e) {
        console.log('未指定配置文件,使用默认配置');
    }

    return gulp.src([_progressPash + '/' + PROJECT_CONFIG.static.output + '/**/*']) // Minify any CSS sources
        .pipe(gulp.dest(_progressPash + '/_tmp'))
})


/**
 * 替换模板文件中的静态资源引入路径
 */
gulp.task('rev-views', function(cb) {
    var _progressPash = gutil.env.path ? gutil.env.path : '';
    var _gtimgNameArgs = gutil.env.gtimg ? gutil.env.gtimg : 'qdm';
    var _sourceManifest = (gutil.env.hash === 'true') ? 'rev-manifest.json' : 'rev-verionId.json';
    try {
        var custome_project_config = config(_progressPash);
        PROJECT_CONFIG = _.assign(PROJECT_CONFIG, custome_project_config);
    } catch (e) {
        console.log(e);
        console.log('未指定配置文件,使用默认配置');
    }

    var manifest = gulp.src(_progressPash + "/hash-tag-map/" + _sourceManifest);


    return gulp.src(_progressPash + PROJECT_CONFIG.views.path + "/**/*.html") // Minify any CSS sources
        .pipe(revReplace({
            manifest: manifest
        }))
        .pipe(gulp.dest(_progressPash + '/_previews'))
    cb()
});



/**
 * 二次替换,防止js和css中有url没有被替换
 */

gulp.task('rev-fix-deps', function() {
    var _progressPash = gutil.env.path ? gutil.env.path : '';
    var _gtimgNameArgs = gutil.env.gtimg ? gutil.env.gtimg : 'qdm';
    var _sourceManifest = (gutil.env.hash === 'true') ? 'rev-manifest.json' : 'rev-verionId.json';
    try {
        var custome_project_config = config(_progressPash);
        PROJECT_CONFIG = _.assign(PROJECT_CONFIG, custome_project_config);
    } catch (e) {
        console.log('未指定配置文件,使用默认配置');
    }
    _progressPash = _progressPash.replace(/ /g, '\\ ');
    var _thisCleanTask = execSync('cd ' + _progressPash + ' && del -f ' + PROJECT_CONFIG.static.output + '/**/*');
    var manifest = gulp.src(_progressPash + "/hash-tag-map/" + _sourceManifest);
    return gulp.src([_progressPash + '/_tmp/**']) // Minify any CSS sources
        .pipe(revReplace({
            manifest: manifest
        }))
        .pipe(gulp.dest(_progressPash + '/' + PROJECT_CONFIG.static.output))
});

/**
 * 替换模板文件中的静态资源引入路径
 */
gulp.task('rev-views-deps', function(cb) {
    var _progressPash = gutil.env.path ? gutil.env.path : '';
    var _gtimgNameArgs = gutil.env.gtimg ? gutil.env.gtimg : 'qdm';
    var _sourceManifest = (gutil.env.hash === 'true') ? 'rev-manifest.json' : 'rev-verionId.json';
    try {
        var custome_project_config = config(_progressPash);
        PROJECT_CONFIG = _.assign(PROJECT_CONFIG, custome_project_config);
    } catch (e) {
        console.log('未指定配置文件,使用默认配置');
    }
    var manifest = gulp.src(_progressPash + "/hash-tag-map/" + _sourceManifest);
    return gulp.src(_progressPash + '/' + PROJECT_CONFIG.views.path + "/**/*.html") // Minify any CSS sources
        .pipe(revReplace(_.extend({}, {
            manifest: manifest
        }, gutil.env.deps === 'true' ? {
            modifyUnreved: function (filename) {
                if(globMatch(filename, PROJECT_CONFIG.deps.replaceMD5)) {
                    return filename;
                }
                return '';
            },
            modifyReved: function (filename) {
                if(globMatch(filename, PROJECT_CONFIG.deps.replaceMD5)) {
                    return filename;
                }
                return '';
            }
        } : {})))
        .pipe(gulp.dest(_progressPash + '/' + PROJECT_CONFIG.views.output))
    cb()
});



/**
 * ARS在发布模板的同时,顺便把node-config发布到同一目录(ars就不用重复建单)
 */
gulp.task('copy-config', function() {
    var _progressPash = gutil.env.path ? gutil.env.path : '';

    try {
        var custome_project_config = config(_progressPash);
        PROJECT_CONFIG = _.assign(PROJECT_CONFIG, custome_project_config);
    } catch (e) {
        console.log('未指定配置文件,使用默认配置');
    }

    console.log(chalk.red('[处理]复制node-config配置文件到 _previews/ 目录'));
    gulp.src(_progressPash + '/' + PROJECT_CONFIG.configs.path + '/**/*')
        .pipe(gulp.dest(_progressPash + '/' + PROJECT_CONFIG.configs.output))
})