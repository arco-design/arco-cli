// eslint-disable-next-line import/no-extraneous-dependencies
import React, { CSSProperties, HTMLAttributes } from 'react';

const BASE_DOCS_DOMAIN = '#';

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
        Github
      </a>
      <a style={styles.link} href={BASE_DOCS_DOMAIN}>
        Arco Homepage
      </a>
    </div>
  );
}
