import fs from 'fs-extra';
import path from 'path';
import { SourceFile } from '@arco-cli/legacy/dist/workspace/component/sources';
import { ComponentInfo } from '@arco-cli/legacy/dist/workspace/componentInfo';
import { DEFAULT_ENV } from '@arco-cli/legacy/dist/constants';
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

  get labels() {
    return this.info.labels;
  }

  get env() {
    return DEFAULT_ENV;
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

  get repository() {
    return this.info.repository;
  }

  get uiResource() {
    return this.info.uiResource;
  }

  get extraStyles() {
    return this.info.extraStyles;
  }

  get forkable() {
    return this.info.forkable;
  }

  get rawConfig() {
    return this.info.rawConfig;
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
