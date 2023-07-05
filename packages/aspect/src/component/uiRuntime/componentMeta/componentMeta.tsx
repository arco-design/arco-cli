// eslint-disable-next-line import/no-extraneous-dependencies
import React, { useEffect } from 'react';
import { Typography, Select } from '@arco-design/web-react';
import { IconTag } from '@arco-design/web-react/icon';
import { ComponentModel } from '../componentModel';

import styles from './componentMeta.module.scss';

export interface ComponentMetaProps {
  component: ComponentModel;
  onComponentExtraStyleChange?: (href: string) => void;
}

export function ComponentMeta({ component, onComponentExtraStyleChange }: ComponentMetaProps) {
  const defaultExtraStyle = component.extraStyles?.[0]?.href;

  useEffect(() => {
    defaultExtraStyle && onComponentExtraStyleChange?.(defaultExtraStyle);
  }, []);

  return (
    <div className={styles.metadata}>
      <h1 className={styles.title}>{component.name}</h1>
      <p className={styles.descriptions}>{component.description}</p>
      <div className={styles.bottomWrapper}>
        <div className={styles.labels}>
          <IconTag />
          {component.labels.join(' / ')}
        </div>

        <div className={styles.rightWrapper}>
          {component.extraStyles?.length ? (
            <Select
              className={styles.extraStyleSelect}
              allowClear
              size="mini"
              placeholder="Choose a style"
              defaultValue={defaultExtraStyle}
              options={component.extraStyles.map(({ title, href }) => ({
                label: title,
                value: href,
              }))}
              onChange={onComponentExtraStyleChange}
            />
          ) : null}

          <div className={styles.usage}>
            <Typography.Text copyable>npm install {component.packageName}</Typography.Text>
          </div>
        </div>
      </div>
    </div>
  );
}
