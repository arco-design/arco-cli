import fs from 'fs-extra';
import spawn from 'cross-spawn';
import gulp from 'gulp';
import gulpIf from 'gulp-if';
import replace from 'gulp-replace';
import { PACKAGE_NAME_ARCO_WEB_REACT_V2, PACKAGE_NAME_ARCO_WEB_VUE_V2 } from './constant';

interface TransformToProjectOptions {
  /* Project root path */
  root: string;
  /* Package name of Arco UI library */
  arcoPackageName: string;
  /* Is for Lerna monorepo project */
  isForMonorepo: boolean;
  /* Content of package.json */
  packageJson: { [key: string]: any };
}

interface TransformToTemplateOptions {
  /* Root path of project */
  root: string;
}

type PackageJson = {
  [key: string]: any;
};

type ArcoPackageInfo = {
  name: string;
  version: string;
  distCssName: string;
};

const PLACEHOLDER_PACKAGE_NAME = '@CONST_PACKAGE_NAME@';
const PLACEHOLDER_ARCO_PACKAGE_NAME = '@CONST_ARCO_PACKAGE_NAME@';
const PLACEHOLDER_ARCO_CSS_NAME = '@CONST_ARCO_DIST_CSS_NAME@';

const ARCO_PACKAGE_INFO_MAP: { [key: string]: ArcoPackageInfo } = {
  [PACKAGE_NAME_ARCO_WEB_REACT_V2]: {
    name: PACKAGE_NAME_ARCO_WEB_REACT_V2,
    version: '2.0.0',
    distCssName: 'arco.css',
  },
  [PACKAGE_NAME_ARCO_WEB_VUE_V2]: {
    name: PACKAGE_NAME_ARCO_WEB_VUE_V2,
    version: '2.0.0-beta.7',
    distCssName: 'arco.css',
  },
};

/**
 * Add Arco dependency in package.json
 */
const addArcoDependency = (
  packageJson: PackageJson,
  arcoInfo: ArcoPackageInfo,
  isForMonorepo = false
) => {
  packageJson.peerDependencies = packageJson.peerDependencies || {};
  packageJson.peerDependencies[arcoInfo.name] = `>=${arcoInfo.version}`;

  if (!isForMonorepo) {
    packageJson.devDependencies = packageJson.devDependencies || {};
    packageJson.devDependencies[arcoInfo.name] = `^${arcoInfo.version}`;
  }
};

/**
 * Remove Arco dependency in package.json
 */
const removeArcoDependency = (packageJson: PackageJson, arcoPackageName: string) => {
  if (!arcoPackageName) {
    return;
  }

  if (packageJson.peerDependencies) {
    delete packageJson.peerDependencies[arcoPackageName];
  }

  if (packageJson.devDependencies) {
    delete packageJson.devDependencies[arcoPackageName];
  }
};

/**
 * handle [files] in package.json
 * @param {Object} packageJson
 * @param {boolean} toProject
 */
const handlePackageJsonFiles = (packageJson, toProject) => {
  if (toProject) {
    if (packageJson._files) {
      packageJson.files = packageJson._files;
      delete packageJson._files;
    }
  } else {
    if (packageJson.files) {
      packageJson._files = packageJson.files;
      delete packageJson.files;
    }

    delete packageJson.arcoMeta;
  }
};

export const transformToProject = async ({
  root,
  arcoPackageName,
  isForMonorepo,
  packageJson: packageJsonToExtend,
}: TransformToProjectOptions) => {
  const packageJson = fs.readJsonSync('./package.json');
  const arcoPackageInfo = ARCO_PACKAGE_INFO_MAP[arcoPackageName];

  // Extend package.json
  Object.assign(packageJson, packageJsonToExtend);
  arcoPackageInfo && addArcoDependency(packageJson, arcoPackageInfo, isForMonorepo);
  handlePackageJsonFiles(packageJson, true);
  fs.writeJsonSync('./package.json', packageJson, { spaces: 2 });

  // Replace constant
  await new Promise((resolve, reject) => {
    gulp
      .src(['**/*', '.config/*', '.storybook/*'], {
        base: root,
        allowEmpty: true,
      })
      .pipe(
        replace(/@CONST_[^@]*@/g, (str) => {
          switch (str) {
            case PLACEHOLDER_PACKAGE_NAME:
              return packageJson.name;
            case PLACEHOLDER_ARCO_PACKAGE_NAME:
              return (arcoPackageInfo && arcoPackageInfo.name) || str;
            case PLACEHOLDER_ARCO_CSS_NAME:
              return (arcoPackageInfo && arcoPackageInfo.distCssName) || str;
            default:
              return str;
          }
        })
      )
      .pipe(gulp.dest(root))
      .on('end', resolve)
      .on('error', reject);
  });
};

export const transformToTemplate = async ({ root }: TransformToTemplateOptions) => {
  const packageJson = fs.readJsonSync('./package.json');
  const arcoPackageName = Object.keys(packageJson.peerDependencies || {}).find(
    (name) => Object.keys(ARCO_PACKAGE_INFO_MAP).indexOf(name) > -1
  );

  // Handle package.json
  removeArcoDependency(packageJson, arcoPackageName);
  handlePackageJsonFiles(packageJson, false);
  fs.writeJsonSync('./package.json', packageJson, { spaces: 2 });

  // Remove all files ignored by Git
  if (fs.existsSync('.git')) {
    await new Promise((resolve, reject) => {
      spawn('git', ['clean', '-Xdf'], { stdio: 'ignore' }).on('close', (code) => {
        code === 0 ? resolve(null) : reject(`Command Error: git clean -Xdf`);
      });
    });
  }

  // Remove package-lock、yarn.lock、.git
  ['package-lock.json', 'yarn.lock', '.git', 'arco.config.js'].forEach((file) =>
    fs.removeSync(file)
  );

  // Rename .gitignore to gitignore, otherwise it will not be uploaded to NPM
  if (fs.existsSync('.gitignore')) {
    fs.moveSync('.gitignore', 'gitignore');
  }

  const arcoPackageInfo = ARCO_PACKAGE_INFO_MAP[arcoPackageName];

  // Replace constant
  await new Promise((resolve, reject) => {
    gulp
      .src(['**/*', '.config/*', '.storybook/*'], {
        base: root,
        allowEmpty: true,
      })
      .pipe(replace(packageJson.name, PLACEHOLDER_PACKAGE_NAME))
      .pipe(
        gulpIf(
          !!arcoPackageInfo,
          replace(
            new RegExp(`${arcoPackageName}(/dist/css/)${arcoPackageInfo?.distCssName}`),
            (_, $1) => `${PLACEHOLDER_ARCO_PACKAGE_NAME}${$1}${PLACEHOLDER_ARCO_CSS_NAME}`
          )
        )
      )
      .pipe(gulpIf(!!arcoPackageInfo, replace(arcoPackageName, PLACEHOLDER_ARCO_PACKAGE_NAME)))
      .pipe(gulp.dest(root))
      .on('end', resolve)
      .on('error', reject);
  });
};
