var browserify = require('browserify');
var gulp = require('gulp');
var source = require('vinyl-source-stream');
var buffer = require('vinyl-buffer');
var uglify = require('gulp-uglify');
var fileinclude = require('gulp-file-include');

var getBundleName = function (min) {
    var name = require('./package.json').name;
    return name + ( min ? '.' + 'min' : "") + ".js";
};

gulp.task('build', ['plugin', 'demo']);


//Builds the plugin, i.e. the actual library using browserify
gulp.task('plugin', function () {

    var entries = ['./src/MutationObserver.js', './src/WeakMap.js', './src/jsTreeBind.js'];

    //Unminified pipeline
    browserify({
        entries: entries,
        debug: true
    }).bundle()
        .pipe(source(getBundleName(false)))
        .pipe(buffer())
        .pipe(gulp.dest('./dist'));

    //Minified pipeline
    browserify({
        entries: entries,
        debug: false
    }).bundle()
        .pipe(source(getBundleName(true)))
        .pipe(buffer())
        .pipe(uglify())
        .pipe(gulp.dest('./dist'));
});


//Builds the demo files
gulp.task('demo', function () {
    //Build the demo HTML files
    gulp.src(['demo_src/angular.html', 'demo_src/vue.html'])
        .pipe(fileinclude({prefix: '@@', basepath: '@file'}))
        .pipe(gulp.dest('./demo'));

    //Build the common.js file
    browserify(['./demo_src/common.js'])
        .require('./demo_src/common.js', {expose: 'common'})
        .bundle()
        .pipe(source('common.js'))
        .pipe(buffer())
        .pipe(gulp.dest('./demo'));

});