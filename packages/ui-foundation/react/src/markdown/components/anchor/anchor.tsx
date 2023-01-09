// eslint-disable-next-line import/no-extraneous-dependencies
import React, { AnchorHTMLAttributes } from 'react';
import cs from 'classnames';

import styles from './anchor.module.scss';

export function Anchor({
  href,
  children,
  className,
  ...rest
}: AnchorHTMLAttributes<HTMLAnchorElement>) {
  return (
    <a
      {...rest}
      href={href}
      target="_blank"
      rel="noreferrer"
      className={cs(styles.anchor, className)}
    >
      {children}
    </a>
  );
}
