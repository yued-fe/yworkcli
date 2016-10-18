/**
 * 命令行参数的统一入口
 * Author:luolei
 */


var argv = require('yargs').argv;
var path = require('path');


// console.log('统一入口的argv' + JSON.stringify(argv));


var options = {
	path : !!argv.path ? argv.path : 'demo'
}