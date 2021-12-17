import path from 'path';
import fs from 'fs-extra';
import vfs from 'vinyl-fs';
import through from 'through2';
import chokidar from 'chokidar';
import gulpIf from 'gulp-if';
import gulpTS from 'gulp-typescript';
import gulpPlumber from 'gulp-plumber';
import debounce from 'lodash.debounce';
import tsc from 'node-typescript-compiler';
import { print } from '@arco-design/arco-dev-utils';
import { transform as babelTransform } from '@babel/core';

import tscConfig from '../../../config/tsc.config';
import babelConfig from '../../../config/babel.config';
import { BUILD_ENV_TS_COMPILER, CWD } from '../../../constant';

interface CompileOptions {
  type: 'es' | 'cjs';
  outDir: string;
  watch?: boolean;
}

/**
 * Get config in tsconfig.json
 */
const getTSConfig = (
  tsconfigPath = path.resolve(CWD, 'tsconfig.json'),
  subConfig = { compilerOptions: {} }
) => {
  if (fs.pathExistsSync(tsconfigPath)) {
    const config = fs.readJsonSync(tsconfigPath);
    const compilerOptions = (config && config.compilerOptions) || {};
    const subCompilerOptions = (subConfig && subConfig.compilerOptions) || {};

    // Avoid overwriting of the compilation options of subConfig
    subConfig.compilerOptions = { ...compilerOptions, ...subCompilerOptions };
    Object.assign(config, subConfig);

    if (config.extends) {
      return getTSConfig(path.resolve(path.dirname(tsconfigPath), config.extends), config);
    }

    return config;
  }
  return { ...subConfig };
};

/**
 * Build TS with babel
 */
async function withBabel({ type, outDir, watch }: CompileOptions) {
  const tsconfig = getTSConfig();
  // The base path of the matching directory patterns
  const srcPath = tsconfig.include[0].split('*')[0].replace(/\/[^/]*$/, '');
  const targetPath = path.resolve(CWD, outDir);

  const transform = (file) => {
    // Avoid directly modifying the original presets array, it will cause errors when withBabel is called multiple times
    babelConfig.presets = babelConfig.presets.map((preset) => {
      const strPresetEnv = '@babel/preset-env';
      const presetOptions = { modules: type === 'es' ? false : 'cjs' };

      if (preset === strPresetEnv) {
        return [strPresetEnv, presetOptions];
      }

      if (Array.isArray(preset) && preset[0] === strPresetEnv) {
        const _preset = preset.slice();
        _preset[1] = {
          ...(_preset[1] || {}),
          ...presetOptions,
        };
        return _preset;
      }

      return preset;
    });

    return babelTransform(file.contents, {
      ...babelConfig,
      filename: file.path,
      // Ignore the external babel.config.js and directly use the current incoming configuration
      configFile: false,
    }).code;
  };

  const createStream = (src) => {
    return vfs
      .src(src, {
        allowEmpty: true,
        base: srcPath,
      })
      .pipe(watch ? gulpPlumber() : through.obj())
      .pipe(
        gulpIf(({ path }) => {
          return /\.tsx?$/.test(path);
        }, gulpTS(tsconfig.compilerOptions))
      )
      .pipe(
        gulpIf(
          ({ path }) => {
            return !path.endsWith('.d.ts') && /\.(t|j)sx?$/.test(path);
          },
          through.obj((file, _, cb) => {
            try {
              file.contents = Buffer.from(transform(file));
              // .jsx -> .js
              file.path = file.path.replace(path.extname(file.path), '.js');
              cb(null, file);
            } catch (error) {
              print.error('[arco-scripts]', `Failed to compile ${file.path}`);
              console.error(error);
              cb(null);
            }
          })
        )
      )
      .pipe(vfs.dest(targetPath));
  };

  return new Promise<void>((resolve) => {
    const patterns = [
      path.resolve(srcPath, '**/*'),
      `!${path.resolve(srcPath, '**/demo{,/**}')}`,
      `!${path.resolve(srcPath, '**/__test__{,/**}')}`,
      `!${path.resolve(srcPath, '**/*.md')}`,
      `!${path.resolve(srcPath, '**/*.mdx')}`,
    ];
    createStream(patterns).on('end', () => {
      if (watch) {
        print.info('[arco-scripts]', `Start watching file in ${srcPath.replace(`${CWD}/`, '')}...`);

        const watcher = chokidar.watch(patterns, {
          ignoreInitial: true,
        });

        const files = [];
        const debouncedCompileFiles = debounce(() => {
          while (files.length) {
            createStream(files.pop());
          }
        }, 1000);

        watcher.on('all', (event, fullPath) => {
          print.info(`[${event}] ${path.join(fullPath).replace(`${CWD}/`, '')}`);
          if (fs.existsSync(fullPath) && fs.statSync(fullPath).isFile()) {
            if (!files.includes(fullPath)) {
              files.push(fullPath);
            }
            debouncedCompileFiles();
          }
        });
      } else {
        resolve(null);
      }
    });
  });
}

/**
 * Build TS with tsc
 */
function withTSC({ type, outDir, watch }: CompileOptions) {
  const { compilerOptions } = getTSConfig();
  let module = type === 'es' ? 'es6' : 'commonjs';

  // Read module filed from the default configuration (es6 / es2020 / esnext)
  if (type === 'es') {
    const regexpES = /^es/i;
    if (typeof tscConfig.module === 'string' && regexpES.test(tscConfig.module)) {
      module = tscConfig.module;
    } else if (
      typeof compilerOptions?.module === 'string' &&
      regexpES.test(compilerOptions.module)
    ) {
      module = compilerOptions.module;
    }
  }

  return tsc.compile({
    ...tscConfig,
    module,
    outDir,
    watch: !!watch,
    declaration: type === 'es',
  });
}

export default (options: CompileOptions) => {
  print.info('[arco-scripts]', `Start to build ${options.type} module...`);

  return (BUILD_ENV_TS_COMPILER === 'babel' ? withBabel(options) : withTSC(options)).then(
    () => print.success('[arco-scripts]', `Build ${options.type} module success!`),
    (error) => {
      throw error;
    }
  );
};
