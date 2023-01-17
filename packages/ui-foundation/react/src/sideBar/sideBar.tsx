// eslint-disable-next-line import/no-extraneous-dependencies
import React from 'react';
import cs from 'classnames';
import { ComponentMenu, ComponentMenuProps } from './componentMenu';

import styles from './sideBar.module.scss';

export interface SideBarProps {
  className?: string | string[];
  componentMenuProps?: ComponentMenuProps;
}

export function SideBar({ className, componentMenuProps }: SideBarProps) {
  return (
    <div className={cs(className, styles.sideBar)}>
      <ComponentMenu {...componentMenuProps} />
    </div>
  );
}
