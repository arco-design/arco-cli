// eslint-disable-next-line import/no-extraneous-dependencies
import React, { useContext } from 'react';
import { ComponentPreview } from '@arco-cli/service/dist/preview/uiRuntime';
import { Tabs } from '@arco-cli/ui-foundation-react/dist/tabs';
import { MarkdownLive } from '@arco-cli/ui-foundation-react/dist/markdown/live';

import { ComponentContext, ComponentMeta } from '@aspect/component/uiRuntime';

import styles from './overview.module.scss';

export function Overview() {
  const component = useContext(ComponentContext);

  const titleComponentPreview = 'Preview';
  const eleComponentPreview = (
    <ComponentPreview
      style={{ width: '100%', height: '100%' }}
      pubsub
      component={component}
      previewName="overview"
      viewport={null}
      scrolling="no"
    />
  );

  return (
    <div className={styles.overview}>
      <ComponentMeta component={component} />
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
