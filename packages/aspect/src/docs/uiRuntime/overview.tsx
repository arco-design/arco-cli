import React, { useContext, useState } from 'react';
import { WorkspaceContext } from '@arco-cli/ui-foundation-react';
import { ComponentPreview } from '@arco-cli/service/dist/preview/uiRuntime';
import { Tabs } from '@arco-cli/ui-foundation-react/dist/tabs';
import { MarkdownLive } from '@arco-cli/ui-foundation-react/dist/markdown/live';

import { ComponentContext, ComponentMeta } from '@aspect/component/uiRuntime';

import '@arco-cli/ui-foundation-react/dist/markdown/style/markdown.css';
import styles from './overview.module.scss';

export function Overview() {
  const { darkMode } = useContext(WorkspaceContext);
  const component = useContext(ComponentContext);
  const [extraStyle, setExtraStyle] = useState<string>(null);

  const titleComponentPreview = 'Preview';
  const eleComponentPreview = (
    <ComponentPreview
      component={component}
      previewName="overview"
      viewport={null}
      extraStyle={extraStyle}
      darkMode={darkMode}
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
