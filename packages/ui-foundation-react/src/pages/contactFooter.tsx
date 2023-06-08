// eslint-disable-next-line import/no-extraneous-dependencies
import React, { CSSProperties, HTMLAttributes } from 'react';

const styles: Record<string, CSSProperties> = {
  link: {
    margin: '0 12px',
    textDecoration: 'none',
    lineHeight: 'inherit',
    color: 'unset',
  },
};

export type ContactFooterProps = HTMLAttributes<HTMLDivElement>;

// TODO complete help info
export function ContactFooter(props: ContactFooterProps) {
  return (
    <div style={{ ...styles.iconLine, ...props.style }} {...props}>
      <a style={styles.link} href="https://github.com/arco-design/arco-cli">
        Github
      </a>
      <a style={styles.link} href="https://arco.design/material">
        Material Market
      </a>
    </div>
  );
}
