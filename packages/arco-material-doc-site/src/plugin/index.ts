import fs from 'fs';
import path from 'path';
import glob from 'glob';
import { RawSource } from 'webpack-sources';
import { ModuleUMDInfo } from '@arco-materials/material-preview-utils/es/interface';

import parseComment from './parseComment';
import parseRawComment, { Comment } from './parseRawComment';
import parseModuleExport, { ModuleExportInfoMap } from './parseModuleExport';
import tryGetUMDInfo from '../utils/tryGetUMDInfo';
import { PLACEHOLDER_ARCO_SITE_MODULE_INFO } from '../constant';
import encodeInfo from '../utils/encodeInfo';
import getTitleOfMarkdown from '../utils/getTitleOfMarkdown';
import { GlobConfigForBuild, MainConfig } from '../interface';
import parseMarkdownTitle from './parseMarkdownTitle';
import removeMarkdownDemoPart from '../utils/removeMarkdownDemoPart';

export type ModuleInfo = {
  name: string;
  info: Record<string, string> & { umd?: ModuleUMDInfo };
  isDoc?: boolean;
  children?: Array<{
    name: string;
    info: Record<string, string>;
    rawCode?: string;
  }>;
  outline: Array<{ depth: number; text: string }>;
};

export type ModuleInfoOfEntry = {
  key: string;
  doc: ModuleInfo[];
  component: ModuleInfo[];
};

type ChunkInfo = {
  name: string;
  entry: string;
  files?: string[];
};

export default class ArcoSiteModuleInfoPlugin {
  private paths: {
    doc: string[];
    demo: string[];
  };

  constructor(options: { globs?: MainConfig['build']['globs'] }) {
    options = options || {};

    const { globs } = options;
    let docPathList = [];
    let demoPathList = [];

    const extendPathList = (
      { doc, component }: GlobConfigForBuild = { doc: null, component: null }
    ) => {
      if (doc) {
        docPathList = docPathList.concat(glob.sync(path.resolve(doc)));
      }
      if (component?.base && component?.demo) {
        demoPathList = demoPathList.concat(glob.sync(path.resolve(component.base, component.demo)));
      }
    };

    if (globs) {
      if (Array.isArray(globs)) {
        globs.forEach((item) => extendPathList(item));
      } else if (typeof globs === 'object' && !globs.component && !globs.doc) {
        Object.entries(globs as Record<string, GlobConfigForBuild>).forEach(([_, item]) =>
          extendPathList(item)
        );
      } else {
        extendPathList(globs as GlobConfigForBuild);
      }
    }

    this.paths = {
      doc: docPathList,
      demo: demoPathList,
    };
  }

  /**
   * Get module info like
   * {
   *   zh-CN: [
   *     {
   *       key: 'submodule_1',
   *       components: [ { name: 'Button', info: {}, children: [] } ],
   *       documents: [ { name: 'Doc_1', info: {}, isDoc: true } ]
   *     }
   *   ]
   * }
   */
  getModuleInfoMap({
    chunkInfoList,
    moduleExportInfoMap,
  }: {
    moduleExportInfoMap: ModuleExportInfoMap;
    chunkInfoList: Array<ChunkInfo>;
  }): Record<string, ModuleInfoOfEntry[]> {
    // Parse raw comment
    const rawDemoCommentMap: { [key: string]: Array<Comment> } = {};
    this.paths.demo.forEach((demoPath) => {
      rawDemoCommentMap[demoPath] = parseRawComment(fs.readFileSync(demoPath, 'utf-8'));
    });

    const moduleInfoMap = {};

    for (const { name: chunkName, entry } of chunkInfoList) {
      if (!moduleExportInfoMap[entry]) {
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

      const moduleInfo = [];

      // Inject comment for module info
      // [entry] is the entry file for webpack building
      moduleExportInfoMap[entry].forEach(({ name, dependencies }) => {
        // Submodule info for pure document imported by buildConfig.glob.doc
        const pureDocSubmodules =
          moduleExportInfoMap[dependencies.find(({ key }) => key === 'doc')?.path];
        // Submodule info for component imported by buildConfig.glob.component
        const componentSubmodules =
          moduleExportInfoMap[dependencies.find(({ key }) => key === 'component')?.path];

        if (!pureDocSubmodules && !componentSubmodules) {
          return;
        }

        const submoduleInfo: ModuleInfoOfEntry = {
          key: name,
          doc: [],
          component: [],
        };

        if (pureDocSubmodules) {
          pureDocSubmodules.forEach(({ name, dependencies }) => {
            const { path: documentPath, rawCode: documentContent } =
              dependencies.find(({ path }) => this.paths.doc.indexOf(path) > -1) || {};
            if (documentPath) {
              submoduleInfo.doc.push({
                name,
                isDoc: true,
                info: {
                  name: getTitleOfMarkdown(dependencies[0].path),
                },
                outline: parseMarkdownTitle(documentContent),
              });
            }
          });
        }

        if (componentSubmodules) {
          componentSubmodules.forEach(({ name, dependencies }) => {
            const demoEntryPath = dependencies.find(
              ({ path }) => this.paths.demo.indexOf(path) > -1
            )?.path;
            const demoSubmodules = moduleExportInfoMap[demoEntryPath];
            const commentList = demoCommentMap[demoEntryPath];
            const componentInfo = {
              ...(commentList?.[0] || {}),
              umd: tryGetUMDInfo(demoEntryPath),
            };
            const demoCommentList = commentList ? commentList.slice(-demoSubmodules.length) : [];
            const demoInfoList = demoSubmodules.map(({ name, value, dependencies }, index) => {
              return {
                name,
                rawCode: dependencies[0]?.rawCode || value,
                info: demoCommentList[index] || {},
              };
            });
            const apiDocument = parseMarkdownTitle(
              removeMarkdownDemoPart(
                dependencies.find(({ path }) => path.endsWith('.md'))?.rawCode || ''
              )
            );

            submoduleInfo.component.push({
              name,
              info: componentInfo,
              children: demoInfoList,
              outline: [
                { depth: 1, text: componentInfo.title || name },
                ...demoInfoList.map(({ name }) => ({ depth: 2, text: name })),
                ...apiDocument,
              ],
            });
          });
        }

        moduleInfo.push(submoduleInfo);
      });

      moduleInfoMap[chunkName] = moduleInfo;
    }

    return moduleInfoMap;
  }

  apply(compiler) {
    let moduleExportInfoMap: ModuleExportInfoMap = {};
    let hasInjectedModuleInfo = false;
    const chunkInfoList: ChunkInfo[] = [];

    const getNewSource = (source: string, moduleInfo: Record<string, any>): string => {
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

        // Parse the export module info of demo files
        moduleExportInfoMap = parseModuleExport({
          context: compiler.context,
          validPaths: this.paths.demo.concat(
            glob.sync(path.resolve(path.dirname(chunkInfoList[0].entry), '**/*'))
          ),
          statsModules: compilation.getStats().toJson({
            source: true,
            providedExports: true,
          }).modules,
        });
      });

      // [Webpack5] Needs to process resource content in processAssets
      if (compilation.hooks.processAssets) {
        compilation.hooks.processAssets.tap('ArcoSiteModuleInfoPlugin', (assets) => {
          const moduleInfoMap = this.getModuleInfoMap({
            moduleExportInfoMap,
            chunkInfoList,
          });

          for (const filename in assets) {
            if (assets.hasOwnProperty(filename) && filename.endsWith('.js')) {
              const chunkName = Object.keys(compiler.options.entry).find(
                (chunkName) => compiler.options.output.filename.indexOf(`.${chunkName}.`) > -1
              );
              const targetModuleInfo =
                moduleInfoMap[chunkName] || Object.entries(moduleInfoMap)[0]?.[1];

              if (targetModuleInfo) {
                compilation.updateAsset(
                  filename,
                  new RawSource(getNewSource(assets[filename].source(), targetModuleInfo))
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
        moduleExportInfoMap,
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
