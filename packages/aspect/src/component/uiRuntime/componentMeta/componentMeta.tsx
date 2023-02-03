// eslint-disable-next-line import/no-extraneous-dependencies
import React from 'react';
import { Typography } from '@arco-design/web-react';
import { ComponentModel } from '../componentModel';

import styles from './componentMeta.module.scss';

export interface ComponentMetaProps {
  component: ComponentModel;
}

export function ComponentMeta({ component }: ComponentMetaProps) {
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
        <Typography.Text className={styles.usage} code copyable>
          npm install {component.packageName}
        </Typography.Text>
      </div>
    </div>
  );
}
