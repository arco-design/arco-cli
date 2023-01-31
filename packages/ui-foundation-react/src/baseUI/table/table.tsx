// eslint-disable-next-line import/no-extraneous-dependencies
import React from 'react';
import classNames from 'classnames';
import { GridProps } from '../grid';
import { HeadingRow } from './tableHeadingRow';
import { TableRow, RowType } from './tableRow';

import styles from './table.module.scss';

export interface TableProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'className'> {
  className?: string | string[];
  /**
   * the heading row, by which the table data is ordered
   */
  headings: string[];
  /**
   * the data to be shown in the table
   */
  rows: RowType[];
  /**
   * the number of columns to show in the table
   */
  colNumber?: GridProps['col'];
  /**
   * display mobile styles
   */
  isListView?: boolean;
}

/**
 * A table component that renders the properties of a component.
 */
export function Table({
  headings,
  rows,
  colNumber = 4,
  isListView,
  className,
  ...rest
}: TableProps) {
  return (
    <div {...rest} className={classNames(styles.table, className)}>
      <HeadingRow isListView={isListView} colNumber={colNumber} headings={headings} />
      {rows.map((row: RowType, index: number) => {
        return (
          <TableRow
            key={index}
            isListView={isListView}
            headings={headings}
            row={row}
            colNumber={colNumber}
          />
        );
      })}
    </div>
  );
}
