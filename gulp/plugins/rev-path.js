'use strict';
var modifyFilename = require('modify-filename');

module.exports = function (pth, hash,opts) {
	if (arguments.length !== 3) {
		throw new Error('`path` and `hash` required');
	}
	return modifyFilename(pth, function (filename, ext) {
		return filename + opts.separator + hash + ext;
	});
};

module.exports.revert = function (pth, hash,opts) {

	if (arguments.length !== 3) {
		throw new Error('`path` and `hash` required');
	}

	return modifyFilename(pth, function (filename, ext) {
		return filename.replace(new RegExp(opts.separator + hash + '$'), '') + ext;
	});
};