const gulp = require('gulp');

const babel = require('gulp-babel');
const uglify = require('gulp-uglify');

const base64 = require('gulp-base64');
const sass = require('gulp-sass');
const autoprefixer = require('gulp-autoprefixer');
const cleanCSS = require('gulp-clean-css');

gulp.task('js', () => {
  return gulp.src('./src/resources/assets/js/**/*.js')
    .pipe(babel({ presets: ['env'] }))
    .pipe(uglify())
    .pipe(gulp.dest('./public/js'));
});

gulp.task('scss', () => {
  return gulp.src('./src/resources/assets/scss/**/*.scss')
    .pipe(base64())
    .pipe(sass().on('error', sass.logError))
    .pipe(autoprefixer({ browsers: ['last 2 versions'], cascade: false }))
    .pipe(cleanCSS({ compatibility: 'ie8' }))
    .pipe(gulp.dest('./public/css'));
});

gulp.task('watch', () => {
  gulp.watch('./src/resources/assets/js/**/*.js', ['js']);
  gulp.watch('./src/resources/assets/scss/**/*.scss', ['scss']);
});

gulp.task('build', ['js', 'scss']);
gulp.task('default', ['js', 'scss', 'watch']);
