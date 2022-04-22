import { GlobConfigForBuild, MainConfig } from '../interface';

const BASE_SUBMODULE_DIR_NAME = 'submodule';

export type SubmodulePathInfo = Record<
  keyof GlobConfigForBuild,
  { glob: GlobConfigForBuild[keyof GlobConfigForBuild]; path: string | Record<string, string> }
>;

export default function getSubmodulePath(
  buildConfig: MainConfig['build'],
  languages: string[]
): Record<string, SubmodulePathInfo> {
  const globs = buildConfig.globs;
  const result = {};

  const extendSubmoduleInfo = (submoduleKey: string, glob: GlobConfigForBuild) => {
    const info = {};
    Object.entries(glob).forEach(([key, item]) => {
      let path = null;

      if (languages.length > 1 && key === 'doc') {
        path = {};
        languages.forEach((lang) => (path[lang] = `./${submoduleKey}/${key}.${lang}.js`));
      } else {
        path = `./${submoduleKey}/${key}.js`;
      }

      info[key] = {
        glob: item,
        path,
      };
    });
    result[submoduleKey] = info;
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

  return result;
}
