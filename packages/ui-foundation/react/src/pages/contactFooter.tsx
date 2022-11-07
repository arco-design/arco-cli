// eslint-disable-next-line import/no-extraneous-dependencies
import React, { CSSProperties, HTMLAttributes } from 'react';
import { BASE_DOCS_DOMAIN } from '@arco-cli/legacy/dist/constants';

const styles: Record<string, CSSProperties> = {
  link: {
    textDecoration: 'none',
    lineHeight: 'inherit',
    color: 'unset',
  },
  logo: {
    width: '24px',
    height: '24px',
    margin: '0 13px',
  },
};

export type ContactFooterProps = HTMLAttributes<HTMLDivElement>;

// TODO complete help info
export function ContactFooter(props: ContactFooterProps) {
  return (
    <div style={{ ...styles.iconLine, ...props.style }} {...props}>
      <a style={styles.link} href={BASE_DOCS_DOMAIN}>
        <img alt="github" style={styles.logo} src="https://static.bit.dev/harmony/github.svg" />
      </a>
      <a style={styles.link} href={BASE_DOCS_DOMAIN}>
        <img alt="arco docs" style={styles.logo} src="https://static.bit.dev/bit-logo.svg" />
      </a>
    </div>
  );
}
