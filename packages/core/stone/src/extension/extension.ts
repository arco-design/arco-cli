import { Stone } from '../stone';
import { ExtensionManifest } from './extensionManifest';
import { RuntimeDefinition } from '../runtimes';
import { ExtensionInitError } from '../exception';

export class Extension {
  static from(manifest: ExtensionManifest) {
    return new Extension(manifest);
  }

  constructor(readonly manifest: ExtensionManifest) {}

  private _instance = null;

  private _loaded = false;

  get instance() {
    return this._instance;
  }

  get name() {
    return this.manifest.id || this.manifest.name;
  }

  get id() {
    return this.name;
  }

  get dependencies(): ExtensionManifest[] {
    return this.manifest.dependencies || [];
  }

  get provider() {
    return this.manifest.provider;
  }

  get files() {
    return this.manifest.files;
  }

  /**
   * returns an indication of the extension already loaded (the provider run)
   * We don't rely on the instance since an extension provider might return null
   */
  get loaded() {
    return this._loaded;
  }

  get declareRuntime() {
    return this.manifest.declareRuntime;
  }

  toString(): string {
    return JSON.stringify(this.name);
  }

  private buildSlotRegistries(slots: ((registerFn: () => void) => any)[], context: Stone) {
    return slots.map((slot) => {
      return slot(() => {
        return context.current;
      });
    });
  }

  getRuntime(runtime: RuntimeDefinition) {
    return this.manifest.getRuntime(runtime);
  }

  getRuntimes() {
    return this.manifest.getRuntimes();
  }

  getSlots(extensionRuntime: any) {
    if (extensionRuntime.slots && extensionRuntime.slots.length) {
      return extensionRuntime.slots;
    }

    return this.manifest.slots || [];
  }

  getConfig(context: Stone, extensionRuntime: any) {
    const defaultConfig = extensionRuntime.defaultConfig || this.manifest.defaultConfig || {};
    const config = context.config.get(this.name) || {};
    return { ...defaultConfig, ...config };
  }

  async __run(dependencies: any[], context: Stone, runtime: RuntimeDefinition) {
    const name = this.name;
    context.initExtension(name);
    const extensionRuntime = this.getRuntime(runtime);

    if (!extensionRuntime) {
      return null;
    }

    // @ts-ignore
    const registries = this.buildSlotRegistries(this.getSlots(extensionRuntime), context);
    const config = this.getConfig(context, extensionRuntime);

    if (!this.loaded) {
      if (extensionRuntime.provider) {
        this._instance = await extensionRuntime.provider(dependencies, config, registries, context);
      } else {
        try {
          // eslint-disable-next-line new-cap
          this._instance = new extensionRuntime.manifest(...dependencies);
        } catch (err) {
          throw new ExtensionInitError(err.toString());
        }
      }

      this._loaded = true;
      return this._instance;
    }

    context.endExtension();
    return Promise.resolve(this.instance);
  }
}
