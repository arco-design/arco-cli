/**
 * In order to solve the problem of on-demand loading of style files, less|css entry file is generated in the /style folder
 * Corresponding to /style/index.js | /style/css.js respectively
 */
import path from 'path';
import gulp from 'gulp';
import glob from 'glob';
import fs from 'fs-extra';
import vfs from 'vinyl-fs';
import through from 'through2';
import rename from 'gulp-rename';
import replace from 'gulp-replace';
import mergeStream from 'merge-stream';
import { print } from 'arco-cli-dev-utils';

import styleConfig from '../../../config/style.config';
import parsePackageImports from '../../utils/parsePackageImports';
import {
  ARCO_LIBRARY_PACKAGE_NAME_REACT,
  CWD,
  DIR_NAME_CJS,
  DIR_NAME_ESM,
  FILENAME_STYLE_ENTRY_CSS,
  FILENAME_STYLE_ENTRY_RAW,
} from '../../../constant';

const { css: cssConfig, jsEntry: jsEntryConfig } = styleConfig;

const dependenciesCacheMap = {};

/**
 * Get the GlobPattern of the component directory
 */
function getComponentDirPattern(dirName: string[]): string {
  const pathDir = `${CWD}/${dirName.length > 1 ? `{${dirName.join(',')}}` : dirName[0]}`;
  let pattern = pathDir;
  if (glob.sync(path.resolve(pathDir, `*/style/${FILENAME_STYLE_ENTRY_RAW}`)).length) {
    pattern = path.resolve(pathDir, './*');
  }
  return pattern;
}

/**
 * Generate /style/css.js
 */
async function compileCssJsEntry({
  styleJSEntry,
  outDirES,
  outDirCJS,
}: {
  /** Glob of css entry file */
  styleJSEntry: string[];
  /** Path of ESM */
  outDirES: string;
  /** Path of CJS */
  outDirCJS: string;
}) {
  const compile = (module: 'es' | 'cjs') => {
    return new Promise((resolve, reject) => {
      mergeStream(
        styleJSEntry.map((entry) =>
          gulp.src(entry, {
            allowEmpty: true,
            base: entry.replace(/(\/\*{1,2})*\/style\/index\.[jt]s$/, ''),
          })
        )
      )
        .pipe(replace(`.${jsEntryConfig.styleSheetExtension}`, '.css'))
        .pipe(
          // import './index.css' => import './index.css'
          // import '../es/Button/style' => import '../es/Button/style/css.js'
          replace(/import\s+'(.+(?:\/style)?)(?:\/index.[jt]s)?'/g, (_, $1) => {
            const suffix = $1.endsWith('/style') ? '/css.js' : '';
            return module === 'es' ? `import '${$1}${suffix}'` : `require('${$1}${suffix}')`;
          })
        )
        .pipe(
          rename(function (path) {
            const [basename, extname] = FILENAME_STYLE_ENTRY_CSS.split('.');
            path.basename = basename;
            path.extname = `.${extname}`;
          })
        )
        .pipe(gulp.dest(module === 'es' ? outDirES : outDirCJS))
        .on('end', resolve)
        .on('error', reject);
    });
  };

  if (Array.isArray(styleJSEntry) && styleJSEntry.length) {
    try {
      const asyncTasks: Array<Promise<unknown>> = [];
      if (fs.pathExistsSync(outDirES)) {
        asyncTasks.push(compile('es'));
      }
      if (fs.pathExistsSync(outDirCJS)) {
        asyncTasks.push(compile('cjs'));
      }
      await Promise.all(asyncTasks);
    } catch (error) {
      print.error('[arco-scripts]', `Failed to build ${FILENAME_STYLE_ENTRY_CSS}`);
      console.error(error);
    }
  }
}

/**
 * Automatically inject the style reference of the dependent Arco component into the style entry file
 * e.g. import '@arco-design/web-react/es/Button/style/index.js'
 */
async function transformStyleEntryContent({
  esEntryPath,
  module,
}: {
  /** Component entry path of ESM */
  esEntryPath: string;
  /** Type of module handled */
  module: 'es' | 'cjs';
}) {
  const replaceStyleEntryContent = async (type: string) => {
    const moduleDirName = module === 'es' ? DIR_NAME_ESM : DIR_NAME_CJS;
    const styleEntryFileName =
      type === jsEntryConfig.styleSheetExtension
        ? FILENAME_STYLE_ENTRY_RAW
        : FILENAME_STYLE_ENTRY_CSS;
    const styleEntryPath = path
      .resolve(path.dirname(esEntryPath), `./style/${styleEntryFileName}`)
      .replace('/es/', `/${moduleDirName}/`);

    if (fs.pathExistsSync(styleEntryPath)) {
      let styleIndexContent = fs.readFileSync(styleEntryPath, 'utf8');

      if (!dependenciesCacheMap[esEntryPath]) {
        dependenciesCacheMap[esEntryPath] = await parsePackageImports(
          esEntryPath,
          ARCO_LIBRARY_PACKAGE_NAME_REACT
        );
      }

      dependenciesCacheMap[esEntryPath].forEach((dep) => {
        const depStyleRequirePath = `${ARCO_LIBRARY_PACKAGE_NAME_REACT}/${moduleDirName}/${dep}/style/${styleEntryFileName}`;
        if (styleIndexContent.indexOf(depStyleRequirePath) === -1) {
          const expression =
            module === 'es'
              ? `import '${depStyleRequirePath}';\n`
              : `require('${depStyleRequirePath}');\n`;
          styleIndexContent = `${expression}${styleIndexContent}`;
        }
      });

      fs.writeFileSync(styleEntryPath, styleIndexContent);
    }
  };

  await Promise.all([
    replaceStyleEntryContent(jsEntryConfig.styleSheetExtension),
    replaceStyleEntryContent('css'),
  ]);
}

function injectArcoDepStyle(componentEsDirPattern: string) {
  return new Promise<void>((resolve) => {
    vfs
      .src(path.resolve(componentEsDirPattern, 'index.js'), {
        allowEmpty: true,
        base: componentEsDirPattern,
      })
      .pipe(
        through.obj(async (file: { path: string; contents: Buffer }, _, cb) => {
          try {
            await Promise.all([
              transformStyleEntryContent({
                esEntryPath: file.path,
                module: 'es',
              }),
              transformStyleEntryContent({
                esEntryPath: file.path,
                module: 'cjs',
              }),
            ]);
          } catch (error) {
            print.error(
              '[arco-scripts]',
              `Failed to inject arco dependencies style to ${file.path}`
            );
            console.error(error);
          }
          cb(null);
          resolve(null);
        })
      );
  });
}

function renameStyleEntryFilename() {
  const { cssEntryFileName, rawEntryFileName } = jsEntryConfig;
  if (cssEntryFileName || rawEntryFileName) {
    glob.sync(getComponentDirPattern([DIR_NAME_ESM, DIR_NAME_CJS])).forEach((dirPath) => {
      const random = `${Math.random().toFixed(5)}`;
      const styleDirPath = `${dirPath}/style`;
      const cssEntryPath = {
        prev: path.resolve(styleDirPath, FILENAME_STYLE_ENTRY_CSS),
        temp: path.resolve(styleDirPath, `css.${random}.js`),
        next: path.resolve(styleDirPath, cssEntryFileName),
      };
      const rawEntryPath = {
        prev: path.resolve(styleDirPath, FILENAME_STYLE_ENTRY_RAW),
        temp: path.resolve(styleDirPath, `${random}.js`),
        next: path.resolve(styleDirPath, rawEntryFileName),
      };
      const needRenameCssEntry = cssEntryFileName && fs.existsSync(cssEntryPath.prev);
      const needRenameLessEntry = rawEntryFileName && fs.existsSync(rawEntryPath.prev);

      if (needRenameCssEntry) {
        fs.renameSync(cssEntryPath.prev, cssEntryPath.temp);
      }
      if (needRenameLessEntry) {
        fs.renameSync(rawEntryPath.prev, rawEntryPath.temp);
      }
      if (needRenameCssEntry) {
        fs.renameSync(cssEntryPath.temp, cssEntryPath.next);
      }
      if (needRenameLessEntry) {
        fs.renameSync(rawEntryPath.temp, rawEntryPath.next);
      }
    });
  }
}

export default async function handleStyleJSEntry() {
  await compileCssJsEntry({
    styleJSEntry: jsEntryConfig.entry,
    outDirES: cssConfig.output.es,
    outDirCJS: cssConfig.output.cjs,
  });

  if (jsEntryConfig.autoInjectArcoDep) {
    await injectArcoDepStyle(getComponentDirPattern([DIR_NAME_ESM]));
  }

  renameStyleEntryFilename();
}
