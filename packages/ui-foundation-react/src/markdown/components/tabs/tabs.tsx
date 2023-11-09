// eslint-disable-next-line import/no-extraneous-dependencies
import React, { ReactNode, useContext, useEffect, useState } from 'react';
import cs from 'classnames';
import { PreviewContext } from '../../../preview/previewContext';

import styles from './tabs.module.scss';

export interface TabsProps {
  panes: Array<{ title: string; content: ReactNode }>;
}

export function Tabs({ panes = [] }: TabsProps) {
  const { pubsub, pubsubTopic, registerGlobalMethod } = useContext(PreviewContext);
  const [activeKey, setActiveKey] = useState<string>('0');

  useEffect(() => {
    pubsub?.reportActiveTab(pubsubTopic, { activeTab: `${activeKey}` });
  }, [activeKey]);

  useEffect(() => {
    registerGlobalMethod('updateMDXPreviewActiveTab', (activeKey: string) => {
      setActiveKey(`${activeKey}`);
    });
  }, []);

  return (
    <div className={styles.tabs}>
      <div className={styles.header}>
        {panes.map(({ title }, index) => {
          const isActive = index.toString() === activeKey;
          return (
            <div
              key={index}
              title={typeof title === 'string' ? title : undefined}
              className={cs(styles.title, { [styles.active]: isActive })}
              onClick={() => setActiveKey(index.toString())}
            >
              {title}
            </div>
          );
        })}
      </div>
      <div>
        {panes.map(({ content }, index) => {
          const isActive = index.toString() === activeKey;
          return isActive ? <div key={index}>{content}</div> : null;
        })}
      </div>
    </div>
  );
}
