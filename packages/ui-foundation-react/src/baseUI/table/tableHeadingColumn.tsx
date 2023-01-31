// eslint-disable-next-line import/no-extraneous-dependencies
import React from 'react';
import classNames from 'classnames';

import styles from './tableHeadingColumn.module.scss';

export interface TableHeadingColumnProps
  extends Omit<React.HTMLAttributes<HTMLDivElement>, 'className'> {
  className?: string | string[];
}

/**
 * Title heading column for using in the table heading
 */
export function HeadingColumn({ children, className, ...rest }: TableHeadingColumnProps) {
  return (
    <div className={classNames(styles.headingColumn, className)} {...rest}>
      <div className={classNames(styles.title)}>{children}</div>
    </div>
  );
}
