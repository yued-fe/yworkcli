/**
 * Created by patrickliu on 2017/6/29.
 */

var minimatch = require('minimatch');

exports = module.exports = function (data, patterns) {
    
    var match = false;
    
    if(typeof patterns !== 'object') {
        patterns = [patterns];
    }
    
    patterns.forEach(function (pattern)  {
        match = (match || minimatch(data, pattern));
    });
    
    return match;
};
