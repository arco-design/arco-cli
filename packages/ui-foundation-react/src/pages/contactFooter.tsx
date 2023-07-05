// eslint-disable-next-line import/no-extraneous-dependencies
import React, { HTMLAttributes } from 'react';
import { Button } from '@arco-design/web-react';

import styles from './style/contactFooter.module.scss';

export type ContactFooterProps = HTMLAttributes<HTMLDivElement>;

export function ContactFooter({ style, ...rest }: ContactFooterProps) {
  return (
    <div className={styles.contactFooter} style={style} {...rest}>
      <Button className={styles.btn} type="primary" href="https://arco.design/material">
        Material Market
      </Button>
      <Button className={styles.btn} type="primary" href="https://github.com/arco-design/arco-cli">
        Github
      </Button>
    </div>
  );
}
