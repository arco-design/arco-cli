import React from 'react';
import classNames from 'classnames';
import { Grid, GridProps } from '../grid';
import { HeadingColumn } from './tableHeadingColumn';

import styles from './tableHeadingRow.module.scss';

export type HeadingRowProps = {
  /**
   * array of strings to be displayed in the title row
   */
  headings: string[];
  /**
   * number of columns in the row
   */
  colNumber: GridProps['col'];
  /**
   * display mobile styles
   */
  isListView?: boolean;
} & GridProps;

export function HeadingRow({
  headings,
  colNumber,
  isListView = false,
  className,
  ...rest
}: HeadingRowProps) {
  return (
    <Grid
      {...rest}
      col={colNumber}
      className={classNames(styles.titleRow, { [styles.hide]: isListView }, className)}
    >
      {headings.map((title: string, index: number) => {
        return title === 'required' ? null : (
          <HeadingColumn key={index} className={styles.titleCol}>
            {title}
          </HeadingColumn>
        );
      })}
    </Grid>
  );
}
