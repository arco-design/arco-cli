import fs from 'fs-extra';
import path from 'path';
import { SourceFile } from '@arco-cli/legacy/dist/workspace/component/sources';
import { ComponentInfo } from '@arco-cli/legacy/dist/workspace/componentInfo';
import { ComponentNotFoundInPathError } from '@arco-cli/legacy/dist/workspace/component/exceptions';
import { ExtensionDataEntry, ExtensionDataList } from './extensionData';

export class Component {
  public extensions: ExtensionDataList = new ExtensionDataList();

  constructor(private info: ComponentInfo, public files: SourceFile[] = []) {}

  get id() {
    return this.info.id;
  }

  get name() {
    return this.info.name;
  }

  get group() {
    return this.info.group;
  }

  get author() {
    return this.info.author;
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

  get rootDir() {
    return this.info.rootDir;
  }

  get componentDir() {
    return path.join(this.info.rootDir, this.entries.base);
  }

  get packageDir() {
    return this.info.packageDir;
  }

  get packageDirAbs() {
    return this.info.packageDirAbs;
  }

  get entries() {
    return this.info.entries;
  }

  async upsertExtensionData(extension: string, data: Record<string, any>) {
    if (!data) return;
    const existingExtension = this.extensions.findExtension(extension);
    if (existingExtension) {
      // Only merge top level of extension data
      Object.assign(existingExtension.data, data);
    } else {
      this.extensions.push(await new ExtensionDataEntry(extension, undefined, data));
    }
  }

  static async loadFromFileSystem(info: ComponentInfo, projectPath: string) {
    const rootDirAbs = path.join(projectPath, info.rootDir);
    if (!fs.existsSync(rootDirAbs)) throw new ComponentNotFoundInPathError(rootDirAbs);

    const files = info.files.map((file) => {
      const filePath = path.join(rootDirAbs, file.relativePath);
      return SourceFile.load(filePath, rootDirAbs, projectPath, {
        test: file.test,
      });
    });

    return new Component(info, files);
  }
}
