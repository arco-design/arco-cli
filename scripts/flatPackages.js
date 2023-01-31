/* eslint-disable */
const path = require('path');
const fs = require('fs-extra');
const gulp = require('gulp');
const gulpReplace = require('gulp-replace');
const getLocalPackages = require('./getLocalPackages');

const NEW_PACKAGES_DIR = path.resolve(__dirname, '../_packages');
const PATH_IGNORE_PATTERN = /ui-foundation|app|stone|legacy/;

const DEFAULT_PACKAGE_JSON = {
  version: '0.1.0',
  scripts: {
    dev: 'sh ../../scripts/build.sh dev',
    build: 'sh ../../scripts/build.sh',
    'build-type': 'sh ../../scripts/build-type.sh',
    clean: 'rm -rf dist',
    'clean-type': 'find dist -name *.d.ts |xargs rm -rf',
    prepublishOnly: 'npm run build',
  },
  files: ['dist'],
  license: 'MIT',
};

async function flatPackages() {
  const originPackages = await getLocalPackages();
  const newPackages = {};

  originPackages.forEach(({ name, location }) => {
    if (location.match(PATH_IGNORE_PATTERN)) {
      return;
    }

    const parentDir = path.dirname(location);
    const dirname = parentDir.split('/').pop();
    newPackages[parentDir] ||= {
      dirname,
      name: `@arco-cli/${dirname}`,
      path: path.resolve(NEW_PACKAGES_DIR, dirname),
      packages: [],
      children: [],
    };
    newPackages[parentDir].packages.push(name);
    newPackages[parentDir].children.push(location);
  });

  Object.values(newPackages).forEach(({ path: newPackagePath, name, children }) => {
    const newPackageJson = {
      name,
      ...DEFAULT_PACKAGE_JSON,
    };
    const childrenDeps = {
      peerDependencies: {},
      dependencies: {},
      devDependencies: {},
    };

    children.forEach((location) => {
      const packageJson = fs.readJsonSync(path.resolve(location, 'package.json'));
      Object.assign(childrenDeps.peerDependencies, packageJson.peerDependencies);
      Object.assign(childrenDeps.dependencies, packageJson.dependencies);
      Object.assign(childrenDeps.devDependencies, packageJson.devDependencies);
    });

    Object.entries(childrenDeps).forEach(([depType, deps]) => {
      Object.entries(deps)
        .sort(([keyA], [keyB]) => {
          return keyB.startsWith('@') && !keyA.startsWith('@') ? 1 : keyA > keyB ? 1 : -1;
        })
        .map(([key, value]) => {
          if (key.startsWith('@arco-cli/')) {
            const newPackagesInfo = Object.values(newPackages);
            for (const { name, packages } of newPackagesInfo) {
              if (packages.indexOf(key) > -1) {
                return [name, value];
              }
            }
          }

          return [key, value];
        })
        .forEach(([key, value]) => {
          if (key !== newPackageJson.name) {
            newPackageJson[depType] ||= {};
            newPackageJson[depType][key] = value;
          }
        });
    });

    // write new packageJson
    fs.ensureDirSync(`${newPackagePath}/src`);
    fs.writeJsonSync(path.join(newPackagePath, 'package.json'), newPackageJson, { spaces: 2 });

    // copy children's source file
    for (const childLocation of children) {
      fs.copySync(
        `${childLocation}/src`,
        `${newPackagePath}/src/${childLocation.split('/').pop()}`
      );
    }
  });

  return Promise.all(
    Object.values(newPackages).map(({ name, path: newPackagePath, packages }) => {
      return new Promise((resolve, reject) => {
        gulp
          .src(`${newPackagePath}/src/**/*.*`)
          .pipe(
            gulpReplace(/'@arco-cli\/[^']+'/g, function doReplace(match) {
              if (PATH_IGNORE_PATTERN.test(match)) {
                return match;
              }

              const fileRelativePath = this.file.relative;
              const splitPaths = match.replace(/'/g, '').split('/');
              const originPackage = splitPaths.slice(0, 2).join('/');
              const originImportFrom = splitPaths.slice(2).join('/');

              let newPackage = Object.values(newPackages).find(({ packages }) => {
                return packages.indexOf(originPackage) > -1;
              })?.name;

              if (!newPackage) {
                return 'NO_MATCH';
              }

              const newImportFrom = `${
                newPackage === name
                  ? `@self`
                  : `${newPackage}/dist`
              }/${originPackage.split('/').pop()}`;

              if (originImportFrom) {
                return `'${newImportFrom}/${originImportFrom.replace('dist/', '')}'`;
              } else {
                return `'${newImportFrom}'`;
              }
            })
          )
          .pipe(gulp.dest(`${newPackagePath}/src`))
          .on('end', () => {
            console.log(`_________ ${newPackagePath}`);
            resolve();
          })
          .on('error', (error) => {
            reject(error);
            console.error(error);
          });
      });
    })
  );
}

flatPackages()
  .then()
  .catch((err) => {
    console.log(err);
  });
