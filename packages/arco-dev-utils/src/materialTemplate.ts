import fs from 'fs-extra';
import spawn from 'cross-spawn';
import gulp from 'gulp';
import replace from 'gulp-replace';
import { PACKAGE_NAME_ARCO_WEB_REACT_V2, PACKAGE_NAME_ARCO_WEB_VUE_V2 } from './constant';

interface TransformToProjectOptions {
  /* Project root path */
  root: string;
  /* Content of package.json */
  packageJson: { [key: string]: any };
}

interface TransformToTemplateOptions {
  /* Root path of project */
  root: string;
}

const PLACEHOLDER_PACKAGE_NAME = '@CONST_PACKAGE_NAME@';
const PLACEHOLDER_ARCO_PACKAGE_NAME = '@CONST_ARCO_PACKAGE_NAME@';
const PLACEHOLDER_ARCO_CSS_NAME = '@CONST_ARCO_DIST_CSS_NAME@';

const ARCO_PACKAGE_INFO_MAP: {
  [key: string]: {
    name: string;
    distCssName: string;
  };
} = {
  react: {
    name: PACKAGE_NAME_ARCO_WEB_REACT_V2,
    distCssName: 'arco.css',
  },
  vue: {
    name: PACKAGE_NAME_ARCO_WEB_VUE_V2,
    distCssName: 'arco.css',
  },
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
  packageJson: packageJsonToExtend,
}: TransformToProjectOptions) => {
  const packageJson = fs.readJsonSync('./package.json');

  // Extend package.json
  Object.assign(packageJson, packageJsonToExtend);
  handlePackageJsonFiles(packageJson, true);
  fs.writeJsonSync('./package.json', packageJson, { spaces: 2 });

  const isVue = !!packageJson.peerDependencies?.vue;
  const arcoPackageInfo = ARCO_PACKAGE_INFO_MAP[isVue ? 'vue' : 'react'];

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
              return arcoPackageInfo.name;
            case PLACEHOLDER_ARCO_CSS_NAME:
              return arcoPackageInfo.distCssName;
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

  // Handle package.json
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

  // Replace constant
  await new Promise((resolve, reject) => {
    gulp
      .src(['**/*', '.config/*', '.storybook/*'], {
        base: root,
        allowEmpty: true,
      })
      .pipe(replace(packageJson.name, PLACEHOLDER_PACKAGE_NAME))
      .pipe(gulp.dest(root))
      .on('end', resolve)
      .on('error', reject);
  });
};
