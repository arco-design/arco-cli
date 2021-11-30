import fs from 'fs';
import path from 'path';
import glob from 'glob';
import { RawSource } from 'webpack-sources';
import { ModuleUMDInfo } from '@arco-design/arco-material-preview-utils/es/interface';

import parseComment from './parseComment';
import parseRawComment, { Comment } from './parseRawComment';
import parseDependencies from './parseDependencies';
import parseModuleExport, { ModuleExportMap } from './parseModuleExport';
import tryGetUMDInfo from '../utils/tryGetUMDInfo';
import { PLACEHOLDER_ARCO_SITE_MODULE_INFO } from '../constant';
import encodeInfo from '../utils/encodeInfo';

type ModuleInfo = {
  name: string;
  info: Record<string, string> & { umd: ModuleUMDInfo };
  isDoc?: boolean;
  children?: Array<any>;
};

type ChunkInfo = {
  name: string;
  entry: string;
  files?: string[];
};

export default class ArcoSiteModuleInfoPlugin {
  private readonly options: {
    globs?: {
      doc?: string;
      demo?: string;
    };
  };

  private paths: {
    doc: string[];
    demo: string[];
  };

  constructor(options) {
    options = options || {};
    const { globs } = options;

    this.options = options;
    this.paths = {
      doc: globs.doc ? glob.sync(globs.doc).map((item) => path.resolve(item)) : [],
      demo: globs.demo ? glob.sync(globs.demo).map((item) => path.resolve(item)) : [],
    };
  }

  parseModuleExport({ context, filePathList, statsModules, needRawCode = false }) {
    const fileDependencyMap = {};
    const { modules } = parseDependencies(statsModules);

    // Filter unnecessary dependency information, and convert the path to an absolute path
    Object.entries(modules).forEach(([modulePath, dependencies]) => {
      modulePath = path.resolve(context, modulePath);
      if (filePathList.indexOf(modulePath) > -1) {
        fileDependencyMap[modulePath] = dependencies
          .map((filePath) => path.resolve(context, filePath))
          .filter((filePath) => filePath.indexOf('node_modules') === -1);
      }
    });

    return parseModuleExport({
      context,
      statsModules,
      needRawCode,
      validPaths: filePathList,
      fileDependencyMap,
    });
  }

  getModuleInfoMap({
    chunkInfoList,
    moduleExportMap,
  }: {
    moduleExportMap: ModuleExportMap;
    chunkInfoList: Array<ChunkInfo>;
  }): {
    /**
     * Module info like { zh-CN: { name: 'Button', info: {}, children: [] } }
     */
    [key: string]: ModuleInfo;
  } {
    // Parse raw comment
    const rawDemoCommentMap: { [key: string]: Array<Comment> } = {};
    this.paths.demo.forEach((demoPath) => {
      rawDemoCommentMap[demoPath] = parseRawComment(fs.readFileSync(demoPath, 'utf-8'));
    });

    const moduleInfoMap = {};

    for (const { name: chunkName, entry } of chunkInfoList) {
      if (!moduleExportMap[entry]) {
        continue;
      }

      // Parse comment of target language
      const demoCommentMap = {};
      Object.entries(rawDemoCommentMap).forEach(([demoPath, commentList]) => {
        demoCommentMap[demoPath] = commentList.map((comment) => {
          // memberof and memberOf both works fine
          if (comment.memberof) {
            comment.memberOf = comment.memberof;
          }

          return parseComment({
            comment,
            targetLanguage: chunkName,
          });
        });
      });

      // Inject comment for module info
      moduleInfoMap[chunkName] = moduleExportMap[entry]
        .map(({ name, moduleFilePath }) => {
          if (this.paths.doc.indexOf(moduleFilePath) > -1) {
            const docContent = fs.readFileSync(moduleFilePath, 'utf-8');
            let infoName = path.basename(moduleFilePath).replace(/\..+$/, '');

            // try to get name from markdown content
            let _match = docContent.match(/`{5}\n(.+)`{5}\n/s);
            if (_match && _match[1]) {
              _match = _match[1].match(/#\s(.+)\n/);
              infoName = (_match && _match[1]) || infoName;
            }

            return {
              name,
              info: {
                name: infoName,
              },
              isDoc: true,
            };
          }

          if (this.paths.demo.indexOf(moduleFilePath) > -1) {
            const demoList = moduleExportMap[moduleFilePath];
            if (demoList) {
              const commentList = demoCommentMap[moduleFilePath];
              const componentInfo = commentList ? commentList[0] : {};
              const demoInfoList = commentList ? commentList.slice(-demoList.length) : [];

              // Try to get umd info of component
              componentInfo.umd = tryGetUMDInfo(moduleFilePath);

              return {
                name,
                info: componentInfo,
                children: demoList.map(({ name, rawCode }, index) => {
                  return {
                    name,
                    rawCode,
                    info: demoInfoList[index] || {},
                  };
                }),
              };
            }
          }
        })
        .filter((info) => info);
    }

    return moduleInfoMap;
  }

  apply(compiler) {
    const { globs } = this.options;
    const paths = {
      doc: globs.doc ? glob.sync(globs.doc).map((item) => path.resolve(item)) : [],
      demo: globs.demo ? glob.sync(globs.demo).map((item) => path.resolve(item)) : [],
    };

    let moduleExportMap: ModuleExportMap = {};
    let hasInjectedModuleInfo = false;
    const chunkInfoList: ChunkInfo[] = [];

    const getNewSource = (source: string, moduleInfo: ModuleInfo): string => {
      return source.replace(
        new RegExp(PLACEHOLDER_ARCO_SITE_MODULE_INFO, 'g'),
        encodeInfo(moduleInfo)
      );
    };

    compiler.hooks.compilation.tap('ArcoSiteModuleInfoPlugin', (compilation) => {
      compilation.hooks.optimizeModules.tap('ArcoSiteModuleInfoPlugin', () => {
        const chunkList = [...compilation.chunks];

        chunkList.forEach((chunk) => {
          if (compilation.chunkGraph !== undefined) {
            for (const module of compilation.chunkGraph.getChunkEntryModulesIterable(chunk)) {
              if (module.resource.indexOf('/node_modules/') === -1) {
                chunkInfoList.push({
                  name: chunk.name,
                  entry: module.resource,
                });
              }
            }
          } else {
            const { name, entryModule } = chunk;
            chunkInfoList.push({
              name,
              entry: entryModule.resource,
            });
          }
        });

        // Parse the export module info of entry file and demo file
        moduleExportMap = this.parseModuleExport({
          context: compiler.context,
          statsModules: compilation.getStats().toJson({
            source: true,
            providedExports: true,
          }).modules,
          filePathList: paths.demo.concat(chunkInfoList.map(({ entry }) => entry)),
          needRawCode: true,
        });
      });

      // [Webpack5] Needs to process resource content in processAssets
      if (compilation.hooks.processAssets) {
        compilation.hooks.processAssets.tap('ArcoSiteModuleInfoPlugin', (assets) => {
          const moduleInfoMap = this.getModuleInfoMap({
            moduleExportMap,
            chunkInfoList,
          });

          for (const filename in assets) {
            if (assets.hasOwnProperty(filename) && filename.endsWith('.js')) {
              const chunkName = Object.keys(compiler.options.entry).find(
                (chunkName) =>
                  compiler.options.output.filename.replace('.[name].', `.${chunkName}.`) ===
                  filename
              );

              if (moduleInfoMap[chunkName]) {
                compilation.updateAsset(
                  filename,
                  new RawSource(getNewSource(assets[filename].source(), moduleInfoMap[chunkName]))
                );
              }
            }
          }

          hasInjectedModuleInfo = true;
        });
      }
    });

    // [Webpack4] Processes the final result during emit
    compiler.hooks.emit.tapPromise('ArcoSiteModuleInfoPlugin', async (compilation) => {
      if (hasInjectedModuleInfo) {
        return;
      }

      // Supplement the asset file name information in chunkInfo
      compilation.chunks.forEach(({ name, files }) => {
        const info = chunkInfoList.find((i) => i.name === name);
        if (info) {
          info.files = files;
        }
      });

      const moduleInfoMap = this.getModuleInfoMap({
        chunkInfoList,
        moduleExportMap,
      });

      chunkInfoList.forEach(({ name: chunkName, files }) => {
        // Inject the extracted module information
        files &&
          files.forEach((file) => {
            if (moduleInfoMap[chunkName]) {
              const asset = compilation.assets[file];
              const source = asset.source();
              asset.source = () => getNewSource(source, moduleInfoMap[chunkName]);
            }
          });
      });
    });
  }
}

// Don't delete this, make sure direct require is available
module.exports = ArcoSiteModuleInfoPlugin;
