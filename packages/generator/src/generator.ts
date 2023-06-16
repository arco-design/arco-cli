/* eslint-disable @typescript-eslint/no-var-requires */
import path from 'path';
import fs from 'fs-extra';
import gulp from 'gulp';
import gulpIgnore from 'gulp-ignore';
import gulpRename from 'gulp-rename';
import through2 from 'through2';
import yargs from 'yargs';

import {
  GenerateOptions,
  ComponentExports,
  GeneratorContext,
  TemplateDirectoryDescriptionFunction,
  TemplateFunction,
  TemplateManifest,
} from './types';

const DEFAULT_TEMPLATE_NAME = 'react-component';
const FILENAME_TEMPLATE_DESCRIPTION = '__arco.tpl.desc.json';
const FILENAME_TEMPLATE_DIRECTORY_DESCRIPTION = '__arco.dir.desc.js';

type GulpFile = { path: string; contents: Buffer };

export class Generator {
  static parseLocalTemplatePath(template: string): null | { prefix: string; path: string } {
    const match = (template || '').match(/^(file:)(.+)/);
    if (match) {
      return {
        prefix: match[1],
        path: match[2],
      };
    }
    return null;
  }

  private readonly CWD = process.cwd();

  constructor(private name: string, private options: GenerateOptions = {}) {
    this.options.path ||= this.CWD;
    this.options.packageName ||= this.name;
    this.options.template ||= DEFAULT_TEMPLATE_NAME;
  }

  private getTemplatePath() {
    const template = this.options.template;
    const localTemplate = Generator.parseLocalTemplatePath(template);
    return localTemplate?.path || path.join(__dirname, 'templates', template);
  }

  getTargetPath() {
    return path.join(this.options.path, this.name);
  }

  async generate(): Promise<null | {
    path: string;
    manifest: TemplateManifest;
    exports: ComponentExports;
  }> {
    const CWD = this.CWD;
    const targetPath = this.getTargetPath();
    const templatePath = this.getTemplatePath();

    let componentExports: ComponentExports = {
      path: '',
      modules: [],
    };

    try {
      let templateManifest: TemplateManifest = {};
      const ignorePathList: string[] = [];
      const templateTransformResultMap: Record<string, { name: string; contents: string }> = {};

      const readStream = () => {
        if (!fs.existsSync(templatePath)) {
          throw new Error(
            `unable to find template from path '${templatePath}'
please check if this directory exists
or did you forget to add prefix 'file:' for '--template' if you want to specify a local directory as template`
          );
        }

        return gulp.src([`${templatePath}/**/*`], {
          dot: true,
          base: templatePath,
        });
      };

      // handle files with template function and find files to ignore
      await new Promise((resolve, reject) => {
        readStream()
          .pipe(
            through2.obj((file: GulpFile, _, cb) => {
              const ignoreFilePathTails = [
                '.d.ts',
                '.js.map',
                FILENAME_TEMPLATE_DESCRIPTION,
                FILENAME_TEMPLATE_DIRECTORY_DESCRIPTION,
              ];

              const context: GeneratorContext = {
                name: this.name,
                packageName: this.options.packageName,
                version: this.options.version,
                description: this.options.description,
                path: templatePath,
                templateArgs: yargs(this.options.templateArgs || '').argv,
              };

              // get manifest of template here
              if (file.path.endsWith(FILENAME_TEMPLATE_DESCRIPTION)) {
                try {
                  templateManifest = fs.readJSONSync(file.path);
                } catch (err) {}
              }

              // directories ignore
              if (file.path.endsWith(FILENAME_TEMPLATE_DIRECTORY_DESCRIPTION)) {
                try {
                  const fnModule = require(file.path);
                  const fn: TemplateDirectoryDescriptionFunction =
                    typeof fnModule === 'function' ? fnModule : fnModule.default;
                  const { ignore } = fn(context) || {};
                  if (ignore) {
                    ignorePathList.push(path.dirname(file.path));
                  }
                } catch (error) {
                  console.error(`\n${error}\n`);
                }
              }

              // files ignore
              if (ignoreFilePathTails.find((tail) => file.path.endsWith(tail))) {
                ignorePathList.push(file.path);
              }

              // handle file template
              if (file.path.endsWith('.tpl.js')) {
                try {
                  const fnModule = require(file.path);
                  const templateFn: TemplateFunction =
                    typeof fnModule === 'function' ? fnModule : fnModule.default;
                  if (typeof templateFn === 'function') {
                    const template = templateFn(context);
                    if (template === false) {
                      ignorePathList.push(file.path);
                    } else {
                      templateTransformResultMap[file.path] = {
                        name: template.filename,
                        contents: template.contents,
                      };

                      const isComponentEntry =
                        path.dirname(file.path) === templatePath &&
                        /index\.[jt]sx?/i.test(template.filename || '');
                      if (isComponentEntry && template.exports) {
                        componentExports = {
                          path: path.resolve(
                            CWD,
                            targetPath,
                            path.relative(templatePath, path.dirname(file.path))
                          ),
                          modules: template.exports,
                        };
                      }
                    }
                  }
                } catch (error) {
                  console.error(`\n${error}\n`);
                }
              }

              cb(null, file);
            })
          )
          // we need this noop callback to trigger end event
          // https://github.com/gulpjs/gulp/issues/1637#issuecomment-216963506
          .on('data', () => null)
          .on('end', resolve)
          .on('error', reject);
      });

      // copy all workspace files
      await new Promise((resolve, reject) => {
        readStream()
          .pipe(
            gulpIgnore.include((file: GulpFile) => {
              return !ignorePathList.find((ignorePath) => file.path.startsWith(ignorePath));
            })
          )
          .pipe(
            through2.obj((file: GulpFile, _, cb) => {
              if (templateTransformResultMap[file.path]) {
                file.contents = Buffer.from(templateTransformResultMap[file.path].contents);
              }
              cb(null, file);
            })
          )
          .pipe(
            gulpRename((filePath: { dirname: string; basename: string; extname: string }, file) => {
              if (templateTransformResultMap[file.path]) {
                const newFilename = templateTransformResultMap[file.path].name;
                return {
                  dirname: filePath.dirname,
                  basename: newFilename,
                  extname: '',
                };
              }

              return filePath;
            })
          )
          .pipe(gulp.dest(targetPath))
          .on('end', resolve)
          .on('error', reject);
      });

      return {
        path: targetPath,
        manifest: templateManifest,
        exports: componentExports,
      };
    } catch (err) {
      throw new Error(
        `failed to generate ${targetPath}, using template from ${templatePath}, details:\n${err.toString()}`
      );
    }
  }
}
