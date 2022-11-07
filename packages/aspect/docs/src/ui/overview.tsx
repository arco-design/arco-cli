// eslint-disable-next-line import/no-extraneous-dependencies
import React, { useContext } from 'react';
import { ComponentPreview } from '@arco-cli/preview/dist/ui';
import { ComponentContext } from '@arco-cli/component/dist/ui';

export function Overview() {
  const component = useContext(ComponentContext);

  return (
    <div>
      <h1>TODO component overview</h1>
      <ComponentPreview
        style={{ width: '100%', height: '100%' }}
        pubsub
        component={component}
        previewName="overview"
        viewport={null}
        scrolling="no"
        fullContentHeight
      />
    </div>
  );
}
