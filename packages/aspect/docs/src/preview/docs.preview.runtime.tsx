// eslint-disable-next-line import/no-extraneous-dependencies
import React, { ReactNode } from 'react';
import type { RenderingContext, PreviewModule } from '@arco-cli/preview';
import { PreviewAspect, PreviewPreview, PreviewRuntime } from '@arco-cli/preview/dist/preview';

import { DocsAspect } from '../docs.aspect';
import type { Docs } from '../docs';

export type DocsRootProps = {
  Provider: React.ComponentType | undefined;
  componentId: string;
  docs: Docs | undefined;
  context: RenderingContext;
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

  render = (componentId: string, modules: PreviewModule, _include, context: RenderingContext) => {
    const docsModule = this.selectPreviewModel(componentId, modules);
    const docsProps: DocsRootProps = {
      context,
      componentId,
      docs: docsModule as Docs,
      Provider: NoopProvider as React.ComponentType,
    };

    modules.mainModule.default(docsProps);
  };
}

DocsAspect.addRuntime(DocsPreview);

function NoopProvider({ children }: { children: ReactNode }) {
  return children;
}
