/**
 * Created by cenkce on 10/26/15.
 */
var gulp = require('gulp');
var requirejsOptimize = require('gulp-requirejs-optimize');
var concat = require('gulp-concat');
var uglify = require('gulp-uglify');
var maps = require('gulp-sourcemaps');

gulp.task('scripts', function () {
    return gulp.src(['node_modules/almond/almond.js', './src/tooly/*.js', './src/tooly/**/*.js'])
            .pipe(requirejsOptimize({
                optimize:'none'
            }))
            .pipe(maps.init())
            .pipe(concat('tooly.min.js'))
            .pipe(uglify( {
                compress: {
                    'drop_debugger': true
                }
            }))
            .pipe(maps.write('.', {
                sourceRoot: 'src/tooly'
            }))
            .pipe(gulp.dest('dist'));
});

gulp.task('default', ['scripts']);