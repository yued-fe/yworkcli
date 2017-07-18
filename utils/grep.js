/**
 * Created by patrickliu on 2017/7/5.
 */
var execSync = require('child_process').execSync;
var exec = require('child_process').exec;
var execFile = require('child_process').execFile;
var globmatch = require('./globmatch');
var path = require('path');
var fs = require('fs');

var grepSync = function (dir, pattern, exclude) {
   
    exclude = exclude || [];
    // 找出dir目录下的所有内容包含pattern的文件名
    return filter(dir, new Buffer(execSync('cd ' + dir + ' && find ./ -type f -print0 | xargs -0 grep -l \'' + pattern + '\' | uniq ')).toString(), exclude, pattern);
};

var grep = function (dir, pattern, exclude) {
    
    return new Promise(function (resolve, reject) {
        exec('grep -R -I -l ' + pattern + ' ' +  dir + ' | uniq',
            function (err, stdout, stderr) {
                if(err) {
                    console.log(err);
                    resolve('');
                    return;
                }
                resolve(filter(dir, stdout, exclude, pattern));
            });
    });
}

var grepBatch = function (dir, arr, exclude) {

    var shellStr = '';

    for(var i = 0, len = arr.length; i < len; i++) {
        var singlePattern = arr[i];
        shellStr += 'rs' + i + '=`grep -R -I -l \'' + singlePattern + '\' ' + dir + ' | uniq`\r\n';
    }

    fs.writeFileSync(path.resolve(__dirname, '.batch.sh'), shellStr, 'utf-8');
    return new Promise(function (resolve, reject) {
        exec('sh ' + path.resolve(__dirname, '.batch.sh'), function (err, stdout, stderr) {
            if(err) {
                resolve('');
                return;
            }
            resolve(filter(dir, stdout, exclude, ''))
        });
    });
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

exports = module.exports;
exports.grep = grep;
exports.grepBatch = grepBatch;
exports.grepSync = grepSync;
