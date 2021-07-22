/**
 * Created by liupeng on 2018/1/26.
 */

var fs = require('fs');
var path = require('path');
var filenameJS = 'ywork.config.js';
var filenameJSON = 'ywork.config.json';

exports = module.exports = function (projPath) {

    if(fs.existsSync(path.resolve(projPath, filenameJSON))) {
        return JSON.parse(fs.readFileSync(path.resolve(projPath, filenameJSON), 'utf-8'));
    }

    return require(path.resolve(projPath, filenameJS));
};
