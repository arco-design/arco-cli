import React, { PropsWithChildren } from 'react';

interface BrowserProps {
  withUrl?: boolean;
}

function Browser(props: PropsWithChildren<BrowserProps>) {
  const { withUrl, children } = props;
  let className = 'ac-browser';
  if (withUrl) {
    className += ' ac-browser-with-url';
  }

  return (
    <div className={className}>
      <div className="ac-browser-header" />
      <div className="ac-browser-content">{children}</div>
    </div>
  );
}

export default Browser;
