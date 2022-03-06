const gulp = require("gulp");
const rename = require("gulp-rename");
const plumber = require("gulp-plumber");
const sourcemap = require("gulp-sourcemaps");
const sass = require("gulp-sass");
const postcss = require("gulp-postcss");
const autoprefixer = require("autoprefixer");
const csso = require("postcss-csso");
const htmlmin = require("gulp-htmlmin");
const sync = require("browser-sync").create();
const del = require("del");
const terser = require("gulp-terser");
const webp = require("gulp-webp");
const htmlwebp = require("gulp-webp-html");
const csswebp = require("gulp-webp-css");
const imagemin = require("gulp-imagemin");
const svgstore = require("gulp-svgstore");
const fileChanged = require("gulp-changed");
const imgRetina = require("gulp-img-retina");
const fileInclude = require("gulp-file-include");

// Styles

const styles = () => {
  return gulp
    .src("source/sass/style.scss")
    .pipe(plumber())
    .pipe(sourcemap.init())
    .pipe(sass())
    .pipe(postcss([autoprefixer(), csso()]))
    .pipe(csswebp([".jpg", ".png"]))
    .pipe(postcss([csso()]))
    .pipe(rename("style.min.css"))
    .pipe(sourcemap.write("."))
    .pipe(gulp.dest("build/css"))
    .pipe(sync.stream());
};

exports.styles = styles;

// HTML

const html = () => {
  return gulp
    .src(["source/**/*.html", "!source/**/_*.html"])
    .pipe(
      fileInclude({
        prefix: "@@",
        basepath: "@file",
      })
    )
    .pipe(htmlmin({ collapseWhitespace: false }))
    .pipe(htmlwebp())
    .pipe(imgRetina())
    .pipe(htmlmin({ collapseWhitespace: true }))
    .pipe(gulp.dest("build"));
};

exports.html = html;

// Scripts

const scripts = () => {
  return gulp
    .src("source/js/*.js")
    .pipe(terser())
    .pipe(rename({ suffix: ".min" }))
    .pipe(gulp.dest("build/js"))
    .pipe(sync.stream());
};

exports.scripts = scripts;

// Images

const optimizeImages = () => {
  return gulp
    .src(["source/img/**/*.{png,jpg,svg}", "!source/img/sprite-src/*"])
    .pipe(fileChanged("build/img"))
    .pipe(
      imagemin([
        imagemin.mozjpeg({ progressive: true }),
        imagemin.optipng({ optimizationLevel: 3 }),
        imagemin.svgo(),
      ])
    )
    .pipe(gulp.dest("build/img"));
};

exports.images = optimizeImages;

const copyImages = () => {
  return gulp
    .src(["source/img/**/*.{png,jpg,svg}", "!source/img/sprite-src/*"])
    .pipe(gulp.dest("build/img"));
};

exports.images = copyImages;

// Webp

const createWebp = () => {
  return gulp
    .src("source/img/**/*.{jpg,png}")
    .pipe(webp({ quality: 90 }))
    .pipe(gulp.dest("build/img"));
};

exports.createWebp = createWebp;

// Sprite

const sprite = () => {
  return gulp
    .src("source/img/sprite-src/*.svg")
    .pipe(
      svgstore({
        inlineSvg: true,
      })
    )
    .pipe(rename("sprite.svg"))
    .pipe(gulp.dest("build/img"));
};

exports.sprite = sprite;

// Copy

const copy = (done) => {
  gulp
    .src(
      [
        "source/fonts/*.{woff2,woff}",
        "source/*.ico",
        // "source/manifest.webmanifest",
        "source/css/*min.css",
        "source/img/**/*.svg",
        "!source/img/icons/*.svg",
        "!source/img/sprite-src/*.svg",
      ],
      {
        base: "source",
      }
    )
    .pipe(gulp.dest("build"));
  done();
};

exports.copy = copy;

// Clean

const clean = () => {
  return del("build");
};

// Server

const server = (done) => {
  sync.init({
    server: {
      baseDir: "build",
    },
    cors: false,
    notify: false,
    ui: false,
  });
  done();
};

exports.server = server;

// Reload

const reload = (done) => {
  sync.reload();
  done();
};

// Watcher

const watcher = () => {
  gulp.watch("source/sass/**/*.scss", gulp.series(styles));
  gulp.watch("source/js/script.js", gulp.series(scripts));
  gulp.watch(
    ["source/img/**/*.{png,jpg,svg}", "!source/img/sprite-src/*"],
    gulp.series(optimizeImages, createWebp)
  );
  gulp.watch("source/img/sprite-src/**/*.svg", gulp.series(sprite));
  gulp.watch("source/**/*.html", gulp.series(html, reload));
};

// Build

const build = gulp.series(
  clean,
  copy,
  optimizeImages,

  gulp.parallel(styles, html, scripts, sprite, createWebp)
);

exports.build = build;

exports.default = gulp.series(
  clean,
  copy,
  copyImages,
  gulp.parallel(styles, html, scripts, sprite, createWebp),
  gulp.series(server, watcher)
);
