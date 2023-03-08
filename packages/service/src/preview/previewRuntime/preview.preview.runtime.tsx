import { Slot, SlotRegistry } from '@arco-cli/stone';

import { PREVIEW_MODULES } from './previewModules';
import { PreviewNotFoundError } from '../exceptions';
import PreviewAspect, { PreviewRuntime } from '../preview.aspect';
import {
  PreviewModule,
  PreviewType,
  RenderingContext,
  RenderingContextSlot,
  RenderingContextProvider,
} from '../types';

// forward linkModules for generate-link.ts
export { linkModules } from './previewModules';

type PreviewSlot = SlotRegistry<PreviewType>;

export class PreviewPreview {
  static dependencies = [];

  static slots = [Slot.withType<PreviewType>(), Slot.withType<RenderingContextProvider>()];

  static runtime = PreviewRuntime;

  static provider(
    _deps,
    _config,
    [previewSlot, renderingContextSlot]: [PreviewSlot, RenderingContextSlot]
  ) {
    const previewPreview = new PreviewPreview(previewSlot, renderingContextSlot);
    return previewPreview;
  }

  constructor(
    private previewSlot: PreviewSlot,
    private renderingContextSlot: RenderingContextSlot
  ) {}

  private getParam(query: string, param: string) {
    const params = new URLSearchParams(query);
    return params.get(param);
  }

  private getQuery() {
    const withoutHash = window.location.hash.substring(1);
    const [, after] = withoutHash.split('?');
    return after;
  }

  private getLocation() {
    const withoutHash = window.location.hash.substring(1);
    const [before, after] = withoutHash.split('?');

    return {
      previewName: this.getParam(after, 'preview'),
      componentId: before,
    };
  }

  private getDefault() {
    const previews = this.previewSlot.values();
    const defaultOne = previews.find((previewCandidate) => previewCandidate.default);
    return defaultOne?.name || previews[0].name;
  }

  private getPreview(previewName: string): undefined | PreviewType {
    const previews = this.previewSlot.values();
    return previews.find((previewCandidate) => previewCandidate.name === previewName);
  }

  private async getPreviewModule(previewName: string): Promise<PreviewModule> {
    const relevantModel = PREVIEW_MODULES.get(previewName);
    if (!relevantModel) throw new Error(`[preview.preview] missing preview "${previewName}"`);
    return relevantModel;
  }

  private getRenderingContext() {
    return new RenderingContext(this.renderingContextSlot);
  }

  registerPreview(preview: PreviewType) {
    this.previewSlot.register(preview);
    return this;
  }

  registerRenderContext(renderContext: RenderingContextProvider) {
    this.renderingContextSlot.register(renderContext);
    return this;
  }

  setViewport() {
    const query = this.getQuery();
    const viewPort = this.getParam(query, 'viewport');
    if (viewPort) {
      window.document.body.style.maxWidth = `${viewPort}px`;
    } else {
      window.document.body.style.width = '100%';
    }
  }

  async render() {
    // fit content always.
    window.document.body.style.width = 'fit-content';

    const { previewName, componentId } = this.getLocation();
    const name = previewName || this.getDefault();
    const preview = this.getPreview(name);

    if (!preview) {
      throw new PreviewNotFoundError(previewName);
    }

    const includes = (
      await Promise.all(
        (preview.include || []).map(async (inclPreviewName) => {
          const includedPreview = this.getPreview(inclPreviewName);
          if (!includedPreview) return undefined;

          const inclPreviewModule = await this.getPreviewModule(inclPreviewName);
          return includedPreview.selectPreviewModel?.(componentId, inclPreviewModule);
        })
      )
    ).filter((module) => !!module);

    const previewModule = await this.getPreviewModule(name);
    preview.render(componentId, previewModule, includes, this.getRenderingContext());

    this.setViewport();
  }
}

PreviewAspect.addRuntime(PreviewPreview);
