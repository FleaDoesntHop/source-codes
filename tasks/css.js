var gulp = require('gulp'),
    postcss = require('gulp-postcss'),
    mixins = require('postcss-mixins'),
    stylus = require('gulp-stylus'),
    importCss = require('postcss-import'),
    cleanCss = require('gulp-clean-css'),
    autoprefixer = require('autoprefixer'),
    hash = require('gulp-hash');

gulp.task('css', () => {
    var plugins = [
        importCss,
        mixins,
        autoprefixer
    ];

    gulp.src('./src/css/style.styl')
        .pipe(stylus())
        .pipe(postcss(plugins))
        .on('error', function (errorInfo) {
            console.log(errorInfo.toString());
            this.emit('end');
        })
        .pipe(cleanCss())
        .pipe(gulp.dest('./dist'));
});



