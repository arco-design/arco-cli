import fs from 'fs-extra';
import path from 'path';
import glob from 'glob';
import chokidar from 'chokidar';
import gulp from 'gulp';
import gulpIf from 'gulp-if';
import rename from 'gulp-rename';
import replace from 'gulp-replace';
import cleanCSS from 'gulp-clean-css';
import mergeStream from 'merge-stream';
import { print } from 'arco-cli-dev-utils';

import through from 'through2';
import handleStyleJSEntry from './handleStyleJSEntry';
import styleConfig from '../../../config/style.config';
import { BUILD_ENV_MODE } from '../../../constant';

const { css: cssConfig, asset: assetConfig, hook = {} } = styleConfig;

// Output less compilation errors, and avoid the program from exiting due to errors
const notifyLessCompileResult = (stream) => {
  let hasError = false;
  return stream
    .on('error', function (error) {
      hasError = true;
      print.error('[arco-scripts]', 'Failed to update style');
      console.error(error);
      this.emit('end');
    })
    .on('end', () => {
      !hasError && print.info('[arco-scripts]', `Style updated at ${new Date().toLocaleString()}`);
    });
};

const handleAdditionalData = async (file: { path: string; contents: Buffer }, _, cb) => {
  try {
    const originalContents = file.contents.toString();
    const { data, append, overwrite } =
      typeof cssConfig.additionalData === 'function'
        ? await cssConfig.additionalData({
            path: file.path,
            contents: originalContents,
          })
        : cssConfig.additionalData;
    file.contents = Buffer.from(
      overwrite ? data : append ? `${originalContents}\n${data}` : `${data}\n${originalContents}`
    );
  } catch (error) {
    print.error('[arco-scripts]', `Failed to append/prepend additional data to ${file.path}`);
  }

  cb(null, file);
};

// Copy the files that need to be monitored to the es/lib directory
function copyFileWatched() {
  const patternArray = cssConfig.watch;
  const destDirs = [cssConfig.output.es, cssConfig.output.cjs].filter((path) => !!path);

  if (destDirs.length) {
    // Path of style build entries
    const rawStyleEntries: string[] = [];
    cssConfig.entry.forEach((pattern) => {
      glob.sync(pattern).forEach((relativePath) => {
        rawStyleEntries.push(path.resolve(relativePath));
      });
    });

    return new Promise((resolve, reject) => {
      let stream: NodeJS.ReadWriteStream = mergeStream(
        patternArray.map((pattern) =>
          gulp.src(pattern, { allowEmpty: true, base: cssConfig.watchBase[pattern] })
        )
      ).pipe(
        gulpIf(({ path: filePath }) => {
          return cssConfig.additionalData && rawStyleEntries.indexOf(filePath) > -1;
        }, through.obj(handleAdditionalData))
      );

      destDirs.forEach((dir) => {
        stream = stream.pipe(gulp.dest(dir));
      });

      stream.on('end', resolve).on('error', (error) => {
        print.error('[arco-scripts]', 'Failed to build css, error in copying files');
        console.error(error);
        reject(error);
      });
    });
  }

  return Promise.resolve(null);
}

// Dist all less files to dist
function distLess(cb) {
  const { path: distPath, rawFileName } = cssConfig.output.dist;
  let entries = [];

  cssConfig.entry.forEach((e) => {
    entries = entries.concat(glob.sync(e));
  });

  if (entries.length) {
    const texts = [];

    entries.forEach((entry) => {
      // Remove the first level directory
      const esEntry = cssConfig.output.es + entry.slice(entry.indexOf('/'));
      const relativePath = path.relative(distPath, esEntry);
      const text = `@import "${relativePath}";`;

      if (esEntry.startsWith(`${cssConfig.output.es}/style`)) {
        texts.unshift(text);
      } else {
        texts.push(text);
      }
    });

    fs.outputFileSync(`${distPath}/${rawFileName}`, texts.join('\n'));
  }

  cb();
}

// Compile less, and output css to at es/lib
function compileLess() {
  const destDirs = [cssConfig.output.es, cssConfig.output.cjs].filter((path) => path);

  if (destDirs.length) {
    const { beforeCompile, afterCompile } = hook;
    let stream = gulp
      .src(cssConfig.entry, { allowEmpty: true })
      .pipe(gulpIf(!!cssConfig.additionalData, through.obj(handleAdditionalData)));

    if (typeof beforeCompile === 'function') stream = stream.pipe(beforeCompile());
    stream = stream.pipe(cssConfig.compiler(cssConfig.compilerOptions));
    if (typeof afterCompile === 'function') stream = stream.pipe(afterCompile());
    stream = stream.pipe(cleanCSS());

    destDirs.forEach((dir) => {
      stream = stream.pipe(gulp.dest(dir));
    });

    return stream.on('error', (error) => {
      print.error('[arco-scripts]', 'Failed to build css, error in compiling less');
      console.error(error);
    });
  }

  return Promise.resolve(null);
}

// Compile the packaged less into css
function distCss(isDev: boolean) {
  const { beforeCompile, afterCompile } = hook;
  const { path: distPath, rawFileName, cssFileName } = cssConfig.output.dist;
  const needCleanCss = !isDev && (!BUILD_ENV_MODE || BUILD_ENV_MODE === 'production');

  let stream = gulp.src(`${distPath}/${rawFileName}`, { allowEmpty: true });

  if (typeof beforeCompile === 'function') stream = stream.pipe(beforeCompile());
  stream = stream.pipe(cssConfig.compiler(cssConfig.compilerOptions));
  if (typeof afterCompile === 'function') stream = stream.pipe(afterCompile());

  // Errors should be thrown, otherwise it will cause the program to exit
  if (isDev) {
    notifyLessCompileResult(stream);
  }

  return stream
    .pipe(
      // The less file in the /dist is packaged from the less file in /es, so its static resource path must start with ../es
      replace(
        new RegExp(`(\.{2}\/)+${cssConfig.output.es}`, 'g'),
        path.relative(cssConfig.output.dist.path, assetConfig.output)
      )
    )
    .pipe(gulpIf(needCleanCss, cleanCSS()))
    .pipe(rename(cssFileName))
    .pipe(gulp.dest(distPath))
    .on('error', (error) => {
      print.error('[arco-scripts]', 'Failed to build css, error in dist all css');
      console.error(error);
    });
}

/**
 * Match the resource that matches the entry glob and copy it to the /asset
 * @returns Stream
 */
function copyAsset() {
  return gulp.src(assetConfig.entry, { allowEmpty: true }).pipe(gulp.dest(assetConfig.output));
}

export function watch() {
  const cwd = process.cwd();
  const fastBuild = gulp.parallel(
    copyAsset,
    gulp.series(copyFileWatched, distLess, () => {
      distCss(true);
    })
  );

  // First build
  fastBuild(null);

  const watcher = chokidar.watch(cssConfig.watch, {
    ignoreInitial: true,
  });

  watcher.on('all', (event, fullPath) => {
    const relPath = fullPath.replace(cwd, '');
    print.info(`[${event}] ${relPath}`);
    try {
      fastBuild(null);
    } catch {}
  });
}

export function build() {
  return new Promise<void>((resolve) => {
    gulp.series(
      gulp.parallel(copyAsset, copyFileWatched),
      gulp.parallel(compileLess, handleStyleJSEntry),
      gulp.parallel(distLess, distCss.bind(null, false)),
      gulp.parallel(() => resolve(null))
    )(null);
  });
}
