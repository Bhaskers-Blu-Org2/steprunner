var fs = require('fs');
var path = require('path');
var gulp = require('gulp');
var del = require('del');
var mocha = require('gulp-mocha');
var ts = require('gulp-typescript');
//var tar = require('gulp-tar');
//var gzip = require('gulp-gzip');
//var merge = require('merge2');

var buildRoot = path.join(__dirname, '_build');
//var testRoot = path.join(buildRoot, 'test');

var tsProject = ts.createProject({
	declartionFiles:false,
	noExternalResolve: true,
	module: 'commonjs'
});


gulp.task('build', ['clean'], function () { 
	tsResult = gulp.src(['src/**/*.ts'])
		.pipe(ts(tsProject));

	return tsResult.js.pipe(gulp.dest(buildRoot), null, ts.reporter.fullReporter(true));
		//.on('error', function (err) { process.exit(1) });
	/*
	return merge([
		tsResult.js.pipe(gulp.dest(buildPath), null, ts.reporter.fullReporter(true)),
		gulp.src(['package.json']).pipe(gulp.dest(buildPath)),
		gulp.src(['src/agent/svc.sh']).pipe(gulp.dest(agentPath)),
	    gulp.src(['src/agent/plugins/build/lib/askpass.js']).pipe(gulp.dest(buildPluginLibPath)),
		gulp.src(['src/bin/install.js']).pipe(gulp.dest(binPath))
	]);
	*/	
});

gulp.task('test', ['build'], function () {
	var suitePath = path.join(buildRoot, 'tests.js');
	/*if (options.suite !== '*') {
		suitePath = path.join(testPath, options.suite + '.js');
	}*/

	return gulp.src([suitePath])
		.pipe(mocha({ reporter: 'spec', ui: 'bdd'}));
});

gulp.task('clean', function (done) {
	del([buildRoot], done);
});

gulp.task('default', ['build']);
