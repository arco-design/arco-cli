import path from 'path';
import { GlobConfigForBuild, MainConfig } from '../interface';

const BASE_SUBMODULE_DIR_NAME = 'submodule';

export type SubmodulePathInfo = Record<
  keyof GlobConfigForBuild,
  { glob: GlobConfigForBuild[keyof GlobConfigForBuild]; path: string | Record<string, string> }
>;

export default function getSubmodulePath(
  buildConfig: MainConfig['build'],
  languages: string[]
): {
  pathInfoMap: Record<string, SubmodulePathInfo>;
  globsToWatch: string[];
} {
  const globs = buildConfig.globs;
  const pathInfoMap = {};
  const globsToWatch = [];

  const extendSubmoduleInfo = (submoduleKey: string, glob: GlobConfigForBuild) => {
    const info = {};
    Object.entries(glob).forEach(([key, item]) => {
      let entryFilePath = null;

      if (languages.length > 1 && key === 'doc') {
        entryFilePath = {};
        languages.forEach((lang) => (entryFilePath[lang] = `./${submoduleKey}/${key}.${lang}.js`));
      } else {
        entryFilePath = `./${submoduleKey}/${key}.js`;
      }

      info[key] = {
        glob: item,
        path: entryFilePath,
      };

      if (typeof item === 'string') {
        globsToWatch.push(path.resolve(item));
      } else if (Object.prototype.toString.call(item) === '[object Object]') {
        Object.entries(item).forEach(([globKey, globStr]) => {
          if (globKey !== 'base') {
            const globBase = (item as { base: string }).base;
            globsToWatch.push(globBase ? path.resolve(globBase, globStr) : globStr);
          }
        });
      }
    });

    pathInfoMap[submoduleKey] = info;
  };

  if (Array.isArray(globs)) {
    globs.forEach((item, index) =>
      extendSubmoduleInfo(`${BASE_SUBMODULE_DIR_NAME}_${index}`, item)
    );
  } else if (typeof globs === 'object' && globs !== null) {
    if (typeof globs.component !== 'object' && typeof globs.doc !== 'string') {
      Object.entries(globs as Record<string, GlobConfigForBuild>).forEach(([submoduleKey, item]) =>
        extendSubmoduleInfo(submoduleKey, item)
      );
    } else {
      extendSubmoduleInfo(BASE_SUBMODULE_DIR_NAME, globs as GlobConfigForBuild);
    }
  }

  return {
    pathInfoMap,
    globsToWatch,
  };
}
