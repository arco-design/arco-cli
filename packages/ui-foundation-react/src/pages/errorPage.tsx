// eslint-disable-next-line import/no-extraneous-dependencies
import React, { CSSProperties } from 'react';
import Image404 from './assets/404.svg';

import styles from './style/errorPage.module.scss';

type ErrorPageProps = {
  /**
   * specifies the type of error that was encountered
   */
  code: number;
  /**
   * title to be shown above the error image
   */
  title?: string;
  /**
   * style of this page
   */
  style?: CSSProperties;
} & React.HTMLAttributes<HTMLDivElement>;

/**
 * A component that shows an error page according to the error code
 */
export function ErrorPage({ code, title, style, children, ...rest }: ErrorPageProps) {
  return (
    <div {...rest} className={styles.errorPage} style={style}>
      {code === 404 ? <Image404 /> : null}
      <h1 className={styles.title}>{title}</h1>
      {children}
    </div>
  );
}
