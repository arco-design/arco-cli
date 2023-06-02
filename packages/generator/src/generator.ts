import path from 'path';
import fs from 'fs-extra';
import gulp from 'gulp';
import gulpIf from 'gulp-if';
import gulpIgnore from 'gulp-ignore';
import gulpRename from 'gulp-rename';
import through2 from 'through2';

import { GeneratorContext, TemplateFunction, TemplateManifest } from './types';

const TEMPLATE_MANIFEST_NAME = 'arco.template.json';

type GenerateOptions = {
  path?: string;
  packageName?: string;
  version?: string;
  description?: string;
};

type GenerateType = 'workspace' | 'component';

type GulpFile = { path: string; contents: Buffer };

export class Generator {
  private readonly CWD = process.cwd();

  private filenameMapFromTemplate: Record<string, string> = {};

  constructor(
    private name: string,
    private type: GenerateType,
    private options: GenerateOptions = {}
  ) {
    this.options.path ||= this.CWD;
    this.options.packageName ||= this.name;
  }

  private getTemplatePath() {
    return path.join(__dirname, 'templates', this.type);
  }

  getTargetPath() {
    return path.join(this.options.path, this.name);
  }

  async generate(): Promise<null | { path: string; manifest: TemplateManifest }> {
    // eslint-disable-next-line @typescript-eslint/no-this-alias
    const that = this;
    const targetPath = this.getTargetPath();
    const templatePath = this.getTemplatePath();

    const handleFileTemplate = async (file: GulpFile, _, cb) => {
      try {
        const context: GeneratorContext = {
          name: this.type === 'workspace' ? this.options.packageName : this.name,
          version: this.options.version,
          description: this.options.description,
          path: templatePath,
        };
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        const templateFn: TemplateFunction = require(file.path).default;
        if (typeof templateFn === 'function') {
          const template = templateFn(context);
          if (typeof template === 'string') {
            file.contents = Buffer.from(template);
          } else {
            file.contents = Buffer.from(template.contents);
            that.filenameMapFromTemplate[file.path] = template.filename;
          }
        }
      } catch (error) {
        console.error(error);
      }
      cb(null, file);
    };

    try {
      let templateManifest: TemplateManifest = {
        entries: {},
      };

      await new Promise((resolve, reject) => {
        gulp
          .src([`${templatePath}/**/*`], {
            base: templatePath,
          })
          .pipe(
            gulpIgnore.include((file: GulpFile) => {
              const ignoreFilePathTails = ['.d.ts', '.js.map', TEMPLATE_MANIFEST_NAME];

              // get manifest of template here
              if (file.path.endsWith(TEMPLATE_MANIFEST_NAME)) {
                try {
                  templateManifest = fs.readJSONSync(file.path);
                } catch (err) {}
              }

              return !ignoreFilePathTails.find((tail) => file.path.endsWith(tail));
            })
          )
          .pipe(gulpIf((file) => file.path.endsWith('.tpl.js'), through2.obj(handleFileTemplate)))
          .pipe(
            gulpRename((filePath: { dirname: string; basename: string; extname: string }) => {
              if (filePath.basename.endsWith('.tpl') && filePath.extname === '.js') {
                const fullFilePathAbs = path.join(
                  templatePath,
                  filePath.dirname,
                  `${filePath.basename}${filePath.extname}`
                );

                return {
                  dirname: filePath.dirname,
                  basename:
                    this.filenameMapFromTemplate[fullFilePathAbs] ||
                    filePath.basename.replace(/\.tpl$/, ''),
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
      };
    } catch (err) {
      throw new Error(
        `failed to generate ${
          this.type
        } to ${targetPath}, using template from ${templatePath}, details:\n${err.toString()}`
      );
    }
  }
}
