// eslint-disable-next-line import/no-extraneous-dependencies
import React from 'react';
import { ComponentModel } from '../componentModel';

import styles from './componentMeta.module.scss';

export interface ComponentMetaProps {
  component: ComponentModel;
}

export function ComponentMeta({ component }: ComponentMetaProps) {
  return (
    <div className={styles.metadata}>
      <h1 className={styles.title}>{component.name}</h1>
      <div>
        <ul className={styles.labels}>
          {component.labels.map((label, index) => (
            <li key={index} className={styles.label}>
              {label}
            </li>
          ))}
        </ul>
        <pre>npm i {component.packageName}</pre>
      </div>
    </div>
  );
}
