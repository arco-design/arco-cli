// eslint-disable-next-line import/no-extraneous-dependencies
import React, { ReactElement, ReactNode } from 'react';
import classNames from 'classnames';

import { Grid, GridProps } from '../grid';
import { TableColumn } from './tableColumn';
import { CodeHighlighter } from '../../baseUI/highlighter';
import { MarkdownLive } from '../../markdown/live';

import styles from './tableRow.module.scss';

export type RowType = {
  name: string;
  type: string;
  description: string;
  required: boolean;
  version?: string;
  default?: string;
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
   * the heading row, by which the row data is ordered
   */
  headings: string[];
} & GridProps;

/**
 *
 * Renders a row in the table according to the order of the headings.
 */
export function TableRow({ row, colNumber = 4, headings, className, ...rest }: TableRowProps) {
  return (
    <Grid col={colNumber} className={classNames(styles.propRow, className)} {...rest}>
      {headings.map((title, index) => {
        if (title === 'name') {
          return (
            <TableColumn className={styles.breakWord} key={index}>
              <div className={styles.columnContent}>
                <div className={styles.name}>{row[title]}</div>
                {row.required && <div className={styles.required}>(Required)</div>}
                {row.version && <div className={styles.version}>{row.version}</div>}
              </div>
            </TableColumn>
          );
        }

        if (title === 'type' || title === 'default') {
          const text = row[title] || '-';
          const matches = text.match(/^\[([^\]]+)]\(([^)]+)\)$/);
          let columnContent: ReactNode = null;

          if (matches) {
            const [, typeText, href] = matches;
            columnContent = (
              <a className={styles.link} href={href}>
                {typeText}
              </a>
            );
          } else {
            columnContent = (
              <CodeHighlighter language="typescript" className={styles.highlighted}>
                {text}
              </CodeHighlighter>
            );
          }

          return (
            <TableColumn className={classNames(styles.breakWord, styles.typeColumn)} key={index}>
              {columnContent}
            </TableColumn>
          );
        }

        // default
        return (
          <TableColumn className={styles.breakWord} key={index}>
            <MarkdownLive children={row[title]} />
          </TableColumn>
        );
      })}
    </Grid>
  );
}
