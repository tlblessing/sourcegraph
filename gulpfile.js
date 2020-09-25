// @ts-check

const gulp = require('gulp')
const {
  graphQlSchema,
  graphQlOperations,
  schema,
  watchGraphQlSchema,
  generateAndWatchGraphQlOperations,
  watchSchema,
} = require('./shared/gulpfile')
const { webpack: webWebpack, webpackDevServer: webWebpackDevServer } = require('./web/gulpfile')

/**
 * Generates files needed for builds.
 */
const generate = gulp.parallel(schema, graphQlSchema, graphQlOperations)

/**
 * Generates files needed for builds whenever files change.
 */
const watchGenerate = gulp.series(
  gulp.parallel(schema, graphQlSchema),
  gulp.parallel(watchSchema, watchGraphQlSchema, generateAndWatchGraphQlOperations),
)

/**
 * Builds everything.
 */
const build = gulp.series(generate, webWebpack)

/**
 * Watches everything and rebuilds on file changes.
 */
const watch = gulp.series(
  gulp.parallel(schema, graphQlSchema),
  gulp.parallel(watchSchema, watchGraphQlSchema, generateAndWatchGraphQlOperations, webWebpackDevServer),
)

module.exports = {
  generate,
  watchGenerate,
  build,
  watch,
  schema,
  graphQlSchema,
  watchGraphQlSchema,
  graphQlOperations,
  generateAndWatchGraphQlOperations,
}
