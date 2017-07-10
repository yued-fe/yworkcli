/**
 * Created by patrickliu on 2017/7/5.
 */
var execSync = require('child_process').execSync;
var globmatch = require('./globmatch');
var path = require('path');

exports = module.exports = function (dir, pattern, exclude) {
   
    exclude = exclude || [];
    // 找出dir目录下的所有内容包含pattern的文件名
    return filter(dir, new Buffer(execSync('cd ' + dir + ' && find ./ -type f | xargs grep "' + pattern + '" | awk -F \':\' \'{print $1}\' | uniq ')).toString(), exclude, pattern);
};

function filter(dir, str, exclude, pattern) {
    var arr = str.split(require('os').EOL);
    for(var i = arr.length - 1; i >= 0; i--) {
        // normalize
        arr[i] = path.relative(dir, path.resolve(dir, arr[i]))
        // empty string, exclude files or self should be deleted
        if(!arr[i] || globmatch(arr[i], exclude) || arr[i] === pattern) {
            arr.splice(i, 1);
        }
    }
    return arr;
}
