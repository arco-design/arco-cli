// eslint-disable-next-line import/no-extraneous-dependencies
import React, { HTMLAttributes, ReactNode } from 'react';
import type { RouteProps } from 'react-router-dom';
import { SlotRouter } from '@arco-cli/react-router/dist/ui';
import cn from 'classnames';

import style from './navbar.module.scss';

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
    <div className={cn(style.navbar, className)}>
      <h1>{title}</h1>
      <SlotRouter routes={menu} />
    </div>
  );
}
