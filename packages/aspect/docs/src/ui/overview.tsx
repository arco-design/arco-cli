// eslint-disable-next-line import/no-extraneous-dependencies
import React, { useContext } from 'react';
import { ComponentPreview } from '@arco-cli/preview/dist/ui';
import { ComponentContext, ComponentMeta } from '@arco-cli/component/dist/ui';

import styles from './overview.module.scss';

export function Overview() {
  const component = useContext(ComponentContext);

  return (
    <div className={styles.overview}>
      <ComponentMeta component={component} />
      <hr className={styles.divider} />
      <ComponentPreview
        style={{ width: '100%', height: '100%' }}
        pubsub
        component={component}
        previewName="overview"
        viewport={null}
        scrolling="no"
      />
    </div>
  );
}
