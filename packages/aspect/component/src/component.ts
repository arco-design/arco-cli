import fs from 'fs-extra';
import path from 'path';
import { SourceFile } from '@arco-cli/legacy/dist/workspace/component/sources';
import { ComponentInfo } from '@arco-cli/legacy/dist/workspace/componentInfo';
import { ComponentNotFoundInPathError } from '@arco-cli/legacy/dist/workspace/component/exceptions';

export class Component {
  constructor(private info: ComponentInfo, public files: SourceFile[] = []) {}

  get id() {
    return this.info.id;
  }

  get name() {
    return this.info.name;
  }

  get env() {
    return 'arco.env/react';
  }

  get language() {
    return 'javascript';
  }

  get version() {
    return this.info.version;
  }

  get packageName() {
    return this.info.packageName;
  }

  get dependencies() {
    return this.info.dependencies;
  }

  get devDependencies() {
    return this.info.devDependencies;
  }

  get peerDependencies() {
    return this.info.peerDependencies;
  }

  get componentDir() {
    return this.info.rootDir;
  }

  get packageDir() {
    return path.dirname(this.info.packageJsonPath);
  }

  static async loadFromFileSystem(info: ComponentInfo, projectPath: string) {
    const componentDirAbs = path.join(projectPath, info.rootDir);
    if (!fs.existsSync(componentDirAbs)) throw new ComponentNotFoundInPathError(componentDirAbs);

    const files = info.files.map((file) => {
      const filePath = path.join(componentDirAbs, file.relativePath);
      return SourceFile.load(filePath, componentDirAbs, projectPath, {
        test: file.test,
      });
    });

    return new Component(info, files);
  }
}
