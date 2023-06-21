// eslint-disable-next-line import/no-extraneous-dependencies
import React, { useContext, useEffect, useRef, useState } from 'react';
import { ComponentPreview, ComponentPreviewHandle } from '@arco-cli/service/dist/preview/uiRuntime';
import { Tabs } from '@arco-cli/ui-foundation-react/dist/tabs';
import { MarkdownLive } from '@arco-cli/ui-foundation-react/dist/markdown/live';

import { ComponentContext, ComponentMeta } from '@aspect/component/uiRuntime';

import styles from './overview.module.scss';

export function Overview() {
  const component = useContext(ComponentContext);

  const [iframeLoaded, setIframeLoaded] = useState(false);
  const [extraStyle, setExtraStyle] = useState<string>(null);
  const refComponentPreview = useRef<ComponentPreviewHandle>(null);

  useEffect(() => {
    if (iframeLoaded && extraStyle) {
      refComponentPreview?.current?.appendExtraStyle(extraStyle);
    }
  }, [iframeLoaded, extraStyle]);

  const titleComponentPreview = 'Preview';
  const eleComponentPreview = (
    <ComponentPreview
      style={{ width: '100%', height: '100%' }}
      ref={refComponentPreview}
      pubsub
      component={component}
      previewName="overview"
      viewport={null}
      scrolling="no"
      onIframeLoad={() => setIframeLoaded(true)}
    />
  );

  return (
    <div className={styles.overview}>
      <ComponentMeta component={component} onComponentExtraStyleChange={setExtraStyle} />

      <hr className={styles.divider} />

      {component.extraDocs?.length ? (
        <Tabs type="rounded">
          <Tabs.TabPane key={titleComponentPreview} title={titleComponentPreview}>
            {eleComponentPreview}
          </Tabs.TabPane>

          {component.extraDocs.map(({ title, content }) => {
            return (
              <Tabs.TabPane key={title} title={title}>
                <MarkdownLive children={content} />
              </Tabs.TabPane>
            );
          })}
        </Tabs>
      ) : (
        eleComponentPreview
      )}
    </div>
  );
}
