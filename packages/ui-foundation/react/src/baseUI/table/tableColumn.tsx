// eslint-disable-next-line import/no-extraneous-dependencies
import React from 'react';
import classNames from 'classnames';

import styles from './tableColumn.module.scss';

export interface TableColumnProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'className'> {
  className?: string | string[];
}

/**
 *
 * a column to be shown in the table
 */
export function TableColumn({ children, className, ...rest }: TableColumnProps) {
  return (
    <div className={classNames(styles.tableColumn, className)} {...rest}>
      {children}
    </div>
  );
}
