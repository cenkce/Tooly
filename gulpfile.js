/**
 * Created by cenkce on 10/26/15.
 */
var gulp = require('gulp');
var requirejsOptimize = require('gulp-requirejs-optimize');
var concat = require('gulp-concat');
var uglify = require('gulp-uglify');
var maps = require('gulp-sourcemaps');

gulp.task('scripts-min', function () {
    return gulp.src(['node_modules/almond/almond.js', './src/tooly/**'])
            .pipe(requirejsOptimize({
                optimize:'none'
            }))
            .pipe(maps.init())
            .pipe(uglify( {
                compress: {
                    'drop_debugger': true
                }
            }))
            .pipe(concat('tooly.min.js'))
            .pipe(maps.write('.', {
                sourceRoot: 'src/tooly'
            }))
            .pipe(gulp.dest('dist'));
});

gulp.task('scripts', function () {
    return gulp.src(['node_modules/almond/almond.js', './src/tooly/**'])
            .pipe(requirejsOptimize({
                optimize:'none'
            }))
            .pipe(maps.init())
            .pipe(concat('tooly.js'))
            .pipe(maps.write('.', {
                sourceRoot: 'src/tooly'
            }))
            .pipe(gulp.dest('dist'));
});

gulp.task('default', ['scripts','scripts-min']);