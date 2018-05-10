/*
 * Copyright (c) 2018 Elias Häußler <mail@elias-haeussler.de> (www.elias-haeussler.de).
 */

'use strict';

import plugins from 'gulp-load-plugins';
import yargs from 'yargs';
import gulp from 'gulp';
import browser from 'browser-sync';
import rimraf from 'rimraf';
import webpackStream from 'webpack-stream';
import webpack from 'webpack';
import named from 'vinyl-named';
import merge from 'merge-stream';




// ==================== CONSTANTS ====================

// Define Server Settings
const SERVER = {
  port: "8000"
};

// Define Paths
const PATHS = {
  dist: "dist",
  assets: [
    "src/assets/**/*",
    "!src/assets/{js,scss}/**/*"
  ],
  data: "src/data/**/*",
  images: [
    "src/assets/img/**/*"
  ],
  javascript: {
    all: "src/assets/js/**/*.js",
    entry: "src/assets/js/main.js",
  },
  sass: {
    all: "src/assets/scss/**/*.scss",
    entry: "src/assets/scss/main.scss",
    reset: "node_modules/reset-css"
  },
  pages: "src/**/*.html"
};

// Browser compatibility
const COMPATIBILITY = [
  "last 2 versions",
  "ie >= 8",
  "ios >= 7"
];

// Check for --production flag
const PRODUCTION = !!(yargs.argv.production);

// Check for --with-server flag
const WITH_SERVER = !!(yargs.argv['with-server']);




// ==================== TASKS ====================

// Load all Gulp plugins
const $ = plugins();

/**
 * Compile Sass
 * @returns {*}
 */
let sass = () =>
{
  return gulp.src(PATHS.sass.entry)
    .pipe(named())
    .pipe($.sourcemaps.init())
    .pipe($.sass({
      includePaths: [PATHS.sass.entry, PATHS.sass.reset]
    }).on('error', $.sass.logError))
    .pipe($.autoprefixer({ browsers: COMPATIBILITY }))
    .pipe($.if(PRODUCTION, $.cleanCss({
      compatibility: 'ie8',
      level: {
        1: {
          specialComments: 1
        }
      }
    })))
    .pipe($.if(!PRODUCTION, $.sourcemaps.write()))
    .pipe(gulp.dest(PATHS.dist + '/assets/css'));
};

/**
 * JavaScript Lint task
 * @returns {*}
 */
let lint = () =>
{
  return gulp.src(PATHS.javascript.all)
    .pipe($.jshint())
    .pipe($.jshint.reporter('default'));
};

let webpackConfig = {
  rules: [
    {
      test: /.js$/,
      use: [
        {
          loader: 'babel-loader'
        }
      ]
    }
  ]
};

/**
 * Concatenate and minify JavaScript
 * @returns {*}
 */
let javascript = () =>
{
  return gulp.src(PATHS.javascript.entry)
    .pipe(named())
    .pipe($.sourcemaps.init())
    .pipe(webpackStream({ module: webpackConfig }, webpack))
    .pipe($.if(PRODUCTION, $.uglify().on('error', e => { console.log(e); })))
    .pipe($.if(!PRODUCTION, $.sourcemaps.write()))
    .pipe(gulp.dest(PATHS.dist + '/assets/js'));
};

/**
 * Copy pages to dist folder
 * @returns {*}
 */
let pages = () =>
{
  return gulp.src(PATHS.pages)
    .pipe(gulp.dest(PATHS.dist));
};

/**
 * Copy assets to dist folder
 * @returns {*}
 */
let copy = () =>
{
  let assets = gulp.src(PATHS.assets, { nodir: true })
    .pipe(gulp.dest(PATHS.dist + '/assets'));
  let data = gulp.src(PATHS.data, { nodir: true })
    .pipe(gulp.dest(PATHS.dist + '/data'));

  return merge(assets, data);
};

/**
 * Clean the dist folder
 * @param done
 */
let clean = done =>
{
  rimraf(PATHS.dist, done);
};

/**
 * Start a Server with BrowserSync
 * @param done
 */
let server = done =>
{
  browser.init({
    server: PATHS.dist, port: SERVER.port
  });
  done();
};

/**
 * Reload Browser
 * @param done
 */
let reload = done =>
{
  browser.reload();
  done();
};

/**
 * Watch Files for Changes
 */
let watch = () =>
{
  gulp.watch(PATHS.assets, gulp.series(copy, reload));
  gulp.watch(PATHS.javascript.all, gulp.series(lint, javascript, reload));
  gulp.watch(PATHS.sass.all, gulp.series(sass, reload));
  gulp.watch(PATHS.pages, gulp.series(pages, reload));
};

/**
 * Build the dist folder
 */
let build = gulp.series(clean, gulp.parallel(copy, lint, sass, javascript, pages));

// Default Task
gulp.task('default', !PRODUCTION || PRODUCTION && WITH_SERVER
  ? gulp.series(build, server, watch)
  : gulp.series(build)
);
