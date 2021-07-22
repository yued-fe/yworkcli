/**
 * Created by liupeng on 2018/1/25.
 */
var gulp = require('gulp');
var gutil = require('gulp-util');
var fs = require('fs');
var path = require('path');
var workbox = require('workbox-build');
var config = require('../utils/config');

gulp.task('sw', function (done) {
// passed by command line argv
    var envPath = gutil.env.path || './';
    var custom_project_config = config(envPath);
    var TASK_CONFIG = custom_project_config.sw || [];

    var before = function () { done(); }
    function link(before, last) {
        return function () {
            return before().then(function () {
                last();
            });
        };
    }
    TASK_CONFIG.forEach((config) => {
        before = link(function () { return workbox.generateSW(config)}, before);
    });
    before();
});
