// eslint-disable-next-line import/no-extraneous-dependencies
import React, { HTMLAttributes, ReactNode } from 'react';
import type { RouteProps } from 'react-router-dom';
import { Button } from '@arco-design/web-react';
import { SlotRouter } from '@arco-cli/aspect/dist/react-router/uiRuntime';
import cn from 'classnames';
import { BASE_DOCS_DOMAIN } from '../constants';

import Logo from './asset/arco-material-logo.svg';
import styles from './navbar.module.scss';

export interface NavbarProps extends Omit<HTMLAttributes<HTMLDivElement>, 'className' | 'title'> {
  className?: string | string[];
  title?: ReactNode;
  // route for registering menus to the top-bar.
  menu?: RouteProps[];
}

/**
 * Top bar with corner and contextual menu.
 */
export function Navbar({ menu = [], className, title }: NavbarProps) {
  return (
    <div className={cn(styles.navbar, className)}>
      <div>
        <div className={styles.title}>
          <Logo className={styles.logo} />
          <span className={styles.text}>{title}</span>
        </div>
        <SlotRouter routes={menu} />
      </div>
      <Button type="primary" target="_blank" href={`https://${BASE_DOCS_DOMAIN}`}>
        Get Started
      </Button>
    </div>
  );
}
