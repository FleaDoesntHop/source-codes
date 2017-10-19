var gulp = require('gulp'),
    webpack = require('webpack');

gulp.task('script', cb => {
    webpack(require('../webpack.config'), (err, stats) => {
        if (err) console.log(err.toString());
        console.log(stats.toString());
        cb();
    })
});