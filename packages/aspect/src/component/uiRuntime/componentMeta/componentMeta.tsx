// eslint-disable-next-line import/no-extraneous-dependencies
import React, { useEffect } from 'react';
import { Typography, Select } from '@arco-design/web-react';
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
      <div>
        <ul className={styles.labels}>
          {component.labels.map((label, index) => (
            <li key={index} className={styles.label}>
              {label}
            </li>
          ))}
        </ul>

        <div className={styles.usage}>
          <Typography.Text code copyable>
            npm install {component.packageName}
          </Typography.Text>

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
        </div>
      </div>
    </div>
  );
}
