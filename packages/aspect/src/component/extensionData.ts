import { cloneDeep, compact, isEmpty } from 'lodash';

type RemoveExtensionSpecialSign = '-';

type ExtensionConfig = { [extName: string]: any } | RemoveExtensionSpecialSign;

type ConfigOnlyEntry = {
  id: string;
  config: ExtensionConfig;
};

export const REMOVE_EXTENSION_SPECIAL_SIGN = '-';

export class ExtensionDataEntry {
  constructor(
    public extensionId?: string,
    public rawConfig: ExtensionConfig = {},
    public data: { [key: string]: any } = {}
  ) {}

  get config(): { [key: string]: any } {
    if (this.rawConfig === REMOVE_EXTENSION_SPECIAL_SIGN) return {};
    return this.rawConfig;
  }

  set config(val: { [key: string]: any }) {
    this.rawConfig = val;
  }

  get isRemoved(): boolean {
    return this.rawConfig === REMOVE_EXTENSION_SPECIAL_SIGN;
  }

  toObject() {
    return {
      extensionId: this.extensionId,
      // Do not use raw config here
      config: this.config,
      data: this.data,
    };
  }

  clone(): ExtensionDataEntry {
    return new ExtensionDataEntry(
      this.extensionId,
      cloneDeep(this.rawConfig),
      cloneDeep(this.data)
    );
  }
}

export class ExtensionDataList extends Array<ExtensionDataEntry> {
  static coreExtensionsNames: Map<string, string> = new Map();

  static registerCoreExtensionName(name: string) {
    ExtensionDataList.coreExtensionsNames.set(name, '');
  }

  static registerManyCoreExtensionNames(names: string[]) {
    names.forEach((name) => {
      ExtensionDataList.coreExtensionsNames.set(name, '');
    });
  }

  get ids(): string[] {
    return this.map((entry) => entry.extensionId);
  }

  findExtension(extensionId: string): ExtensionDataEntry | undefined {
    return this.find((extEntry) => extEntry.extensionId === extensionId);
  }

  remove(id) {
    return ExtensionDataList.fromArray(
      this.filter((entry) => {
        return entry.extensionId !== id;
      })
    );
  }

  toConfigObject() {
    const res = {};
    this.forEach((entry) => {
      if (entry.rawConfig && !isEmpty(entry.rawConfig)) {
        res[entry.extensionId] = entry.rawConfig;
      }
    });
    return res;
  }

  toConfigArray(): ConfigOnlyEntry[] {
    const arr = this.map((entry) => {
      // Remove extensions without config
      const clonedEntry = entry.clone();
      if (clonedEntry.rawConfig && !isEmpty(clonedEntry.rawConfig)) {
        return isEmpty(clonedEntry.rawConfig)
          ? null
          : { id: clonedEntry.extensionId, config: clonedEntry.config };
      }
      return null;
    });
    return compact(arr);
  }

  clone(): ExtensionDataList {
    const extensionDataEntries = this.map((extensionData) => extensionData.clone());
    return new ExtensionDataList(...extensionDataEntries);
  }

  static fromConfigObject(obj: { [extensionId: string]: any } = {}): ExtensionDataList {
    const arr = Object.keys(obj).map((extensionId) => {
      return new ExtensionDataEntry(extensionId, obj[extensionId]);
    });
    return this.fromArray(arr);
  }

  static fromArray(entries: ExtensionDataEntry[]): ExtensionDataList {
    if (!entries || !entries.length) {
      return new ExtensionDataList();
    }
    return new ExtensionDataList(...entries);
  }
}
