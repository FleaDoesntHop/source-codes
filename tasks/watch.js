var gulp = require("gulp"),
  watch = require("gulp-watch"),
  browserSync = require("browser-sync").create();

gulp.task("serve", () => {
  browserSync.init({
    notify: false,
    server: {
      baseDir: "./"
    }
  });

  watch("./index.html", function() {
    browserSync.reload();
  });

  watch("./src/css/**/*", function() {
    gulp.start("cssInject");
  });
  watch("./src/js/**/*", () => {
    gulp.start('scriptInject');
  })
});

gulp.task("cssInject", ["css"], function() {
  return gulp.src("./dist/style.css")
      .pipe(browserSync.stream());
});

gulp.task('scriptInject', ['script'], () => {
  return gulp.src("./dist/scripts/main.js")
      .pipe(browserSync.stream());
});
