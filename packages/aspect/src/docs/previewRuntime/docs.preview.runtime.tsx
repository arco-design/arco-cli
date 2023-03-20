// eslint-disable-next-line import/no-extraneous-dependencies
import { ComponentType } from 'react';
import type { RenderingContext, PreviewModule } from '@arco-cli/service/dist/preview';
import {
  PreviewAspect,
  PreviewPreview,
  PreviewRuntime,
} from '@arco-cli/service/dist/preview/previewRuntime';

import { DocsAspect } from '../docs.aspect';

export type DocsRootProps = {
  componentId: string;
  doc: ComponentType | undefined;
  context: RenderingContext;
  metadata: Record<string, any>;
};

export class DocsPreview {
  static runtime = PreviewRuntime;

  static dependencies = [PreviewAspect];

  static async provider([preview]: [PreviewPreview]) {
    const docsPreview = new DocsPreview();

    preview.registerPreview({
      name: 'overview',
      render: docsPreview.render.bind(docsPreview),
      selectPreviewModel: docsPreview.selectPreviewModel.bind(docsPreview),
    });

    return docsPreview;
  }

  constructor() {}

  selectPreviewModel(componentId: string, modules: PreviewModule) {
    const relevant = modules.componentMap[componentId];
    // only one doc file is supported.
    return relevant?.[0];
  }

  render = async (
    componentId: string,
    modules: PreviewModule,
    _include,
    context: RenderingContext
  ) => {
    let doc = null;

    const dynamicImportModule = this.selectPreviewModel(componentId, modules);
    if (typeof dynamicImportModule === 'function') {
      doc = (await dynamicImportModule()).default;
    }

    const docsProps: DocsRootProps = {
      context,
      componentId,
      doc,
      metadata: modules.componentMetadataMap[componentId],
    };

    modules.mainModule.default(docsProps);
  };
}

DocsAspect.addRuntime(DocsPreview);
