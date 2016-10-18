/**
 * 处理资源入git仓库
 */


var gulpSlash = require('gulp-slash'); //处理windows和unix文件夹斜杠
var gulp = require('gulp');
var path = require('path');
var chalk = require('chalk'); //美化日志
var plumber = require("gulp-plumber");
var gutil = require('gulp-util');
var exec = require('exec');
// var Git = require("nodegit");
var dateFormat = require('dateformat');

gulp.task('git', function() {
    console.log(chalk.green('[Git] 测试发布页面文件'));
    console.log(gutil.env.path);
    var _progressPash = gutil.env.path ? gutil.env.path : '';
    _progressPash = _progressPash.replace(/ /g, '\\ ');
     var _updateTime = dateFormat((new Date()).getTime(), 'yyyymmddHHMM');
     console.log('cd ' + _progressPash + '  && git add src && git commit -m "' + '自动构建:' + _updateTime + '" && git push  && git log --name-status HEAD^..HEAD');
    exec('cd ' + _progressPash + '  && git add src && git commit -m "' + '自动构建:"' + _updateTime + '&& git push  && git log --name-status HEAD^..HEAD' , function(err, stdout, stderr) {
		if (err) {
			console.log('Something went wrong...');
			console.log(err);
			return;
		}
    	console.log(stdout);
    });

    // Open the repository directory.
    // Git.Repository.open("tmp")
    //     // Open the master branch.
    //     .then(function(repo) {
    //         return repo.getMasterCommit();
    //     })
    //     // Display information about commits on master.
    //     .then(function(firstCommitOnMaster) {
    //         // Create a new history event emitter.
    //         var history = firstCommitOnMaster.history();

    //         // Create a counter to only show up to 9 entries.
    //         var count = 0;

    //         // Listen for commit events from the history.
    //         history.on("commit", function(commit) {
    //             // Disregard commits past 9.
    //             if (++count >= 9) {
    //                 return;
    //             }

    //             // Show the commit sha.
    //             console.log("commit " + commit.sha());

    //             // Store the author object.
    //             var author = commit.author();

    //             // Display author information.
    //             console.log("Author:\t" + author.name() + " <" + author.email() + ">");

    //             // Show the commit date.
    //             console.log("Date:\t" + commit.date());

    //             // Give some space and show the message.
    //             console.log("\n    " + commit.message());
    //         });

    //         // Start emitting events.
    //         history.start();
    //     });

});
