import React, { PropsWithChildren } from 'react';

interface CodeBlockProps {
  id?: string;
}

function CodeBlockWrapper(props: PropsWithChildren<CodeBlockProps>) {
  const { id, children } = props;

  return (
    <div id={id.replace(/[\s/]/g, '-')} className="codebox-wrapper">
      {children}
    </div>
  );
}

export default CodeBlockWrapper;
