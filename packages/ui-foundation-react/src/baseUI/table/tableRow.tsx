// eslint-disable-next-line import/no-extraneous-dependencies
import React, { ReactElement } from 'react';
import classNames from 'classnames';

import { Grid, GridProps } from '../grid';
import { TableColumn } from './tableColumn';
import { CodeHighlighter } from '../../baseUI/highlighter';

import styles from './tableRow.module.scss';

export type DefaultValueProp = {
  value: string;
  computed?: boolean;
  __typename?: string;
};

export type RowType = {
  name: string;
  type: string;
  description: string;
  required: boolean;
  version?: string;
  default?: DefaultValueProp;
  [key: string]: string | any;
};

export type CustomRowType = {
  // eslint-disable-next-line no-unused-vars
  [K in keyof RowType]?: ReactElement;
};

export type TableRowProps = {
  /**
   * the number of columns to show in the row
   */
  colNumber: GridProps['col'];
  /**
   * the data to be shown in the row
   */
  row: RowType;
  /**
   * custom renderer for the data in the row
   */
  customRow?: CustomRowType;
  /**
   * the heading row, by which the row data is ordered
   */
  headings: string[];
  /**
   * display mobile styles
   */
  isListView?: boolean;
} & GridProps;

/**
 *
 * Renders a row in the table according to the order of the headings.
 */
export function TableRow({
  row,
  customRow,
  colNumber = 4,
  headings,
  isListView,
  className,
  ...rest
}: TableRowProps) {
  return (
    <Grid
      col={colNumber}
      className={classNames(
        styles.propRow,
        {
          [styles.singleColumn]: isListView,
        },
        className
      )}
      {...rest}
    >
      {headings.map((title, index) => {
        if (title === 'required') return null;
        if (title === 'name') {
          return (
            <TableColumn className={styles.breakWord} key={index}>
              <div
                className={classNames(styles.mobileTitle, {
                  [styles.show]: isListView,
                })}
              >
                {title}
              </div>
              <div className={styles.columnContent}>
                <div className={styles.name}>{customRow?.name || row[title]}</div>

                {!customRow?.required && row.required && (
                  <div className={styles.required}>(Required)</div>
                )}
                {customRow?.required && <div className={styles.required}>{customRow.required}</div>}

                {!customRow?.version && row.version && (
                  <div className={styles.version}>{row.version}</div>
                )}
                {customRow?.version && <div className={styles.version}>{customRow.version}</div>}
              </div>
            </TableColumn>
          );
        }
        if (title === 'type') {
          return (
            <TableColumn className={classNames(styles.breakWord, styles.typeColumn)} key={index}>
              <div
                className={classNames(styles.mobileTitle, {
                  [styles.show]: isListView,
                })}
              >
                {title}
              </div>
              {!customRow?.type && (
                <CodeHighlighter language="typescript" className={styles.highlighted}>
                  {row[title]}
                </CodeHighlighter>
              )}
              {customRow?.type}
            </TableColumn>
          );
        }
        if (title === 'default') {
          return (
            <TableColumn className={styles.breakWord} key={index}>
              <div
                className={classNames(styles.mobileTitle, {
                  [styles.show]: isListView,
                })}
              >
                {title}
              </div>
              {!customRow?.default && (
                <span className={styles.default}>{(row[title] && row[title]?.value) || '-'}</span>
              )}
              {customRow?.default && <span className={styles.default}>{customRow.default}</span>}
            </TableColumn>
          );
        }
        if (title === 'description') {
          return (
            <TableColumn className={styles.breakWord} key={index}>
              {customRow?.description || row[title]}
            </TableColumn>
          );
        }
        // default
        return (
          <TableColumn className={styles.breakWord} key={index}>
            <div
              className={classNames(styles.mobileTitle, {
                [styles.show]: isListView,
              })}
            >
              {title}
            </div>
            {customRow?.[title] || row[title]}
          </TableColumn>
        );
      })}
    </Grid>
  );
}
