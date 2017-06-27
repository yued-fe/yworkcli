/**
 * Created by patrickliu on 2017/6/26.
 */
const path = require('path');
const glob = require('glob');
const fs = require('fs');

/* function used for generate deps and alias */
function getMatch(string) {
    var matches = [];
    var pattern = /\brequire\b\([^'"]*['"]([^'"]*)['"][^'"]*\)/g;
    string.replace(pattern, function ($0, $1) { matches.indexOf($1) === -1 && matches.push($1); });
    return matches;
}

/**
 * 获取dir/paths/*.js 里面的require依赖
 * @type {module.exports}
 */
exports = module.exports = function (dir, paths) {
    var arr = glob.sync(dir + '/.cache/' + paths + '/**/*.js', { nodir: true }) || [],
        depsMap = {};
    
    for(var i = 0, len = arr.length - 1; i < len; i++) {
        var singleJs = arr[i];
        var relPath = path.relative(dir + '/.cache/', singleJs);
        depsMap[relPath] = getMatch(fs.readFileSync(singleJs, 'utf-8'));
    }
    return depsMap;
};


