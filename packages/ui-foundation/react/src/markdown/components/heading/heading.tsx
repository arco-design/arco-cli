// eslint-disable-next-line import/no-extraneous-dependencies
import React, { HTMLAttributes, useMemo } from 'react';
import { extractChildrenText, textToHTMLId } from './utils';

interface HeadingProps extends HTMLAttributes<HTMLHeadingElement> {
  depth: 1 | 2 | 3 | 4 | 5 | 6;
}

export function Heading({ children, depth, ...rest }: HeadingProps) {
  const id = useMemo(() => {
    const text = extractChildrenText(children);
    return textToHTMLId(text);
  }, [children]);
  const attributes = { ...rest, id };

  switch (depth) {
    case 1:
      return <h1 {...attributes}>{children}</h1>;
    case 2:
      return <h2 {...attributes}>{children}</h2>;
    case 3:
      return <h3 {...attributes}>{children}</h3>;
    case 4:
      return <h4 {...attributes}>{children}</h4>;
    case 5:
      return <h5 {...attributes}>{children}</h5>;
    default:
      return <h6 {...attributes}>{children}</h6>;
  }
}
