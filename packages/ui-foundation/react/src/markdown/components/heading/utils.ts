// eslint-disable-next-line import/no-extraneous-dependencies
import { Children, ReactNode, ReactElement } from 'react';

export function extractChildrenText(children: ReactNode, text = ''): string {
  if (!children) return '';

  Children.toArray(children).forEach((child) => {
    if (!child) return;

    if ((child as ReactElement).props?.children) {
      text += extractChildrenText((child as ReactElement).props?.children);
    } else {
      text += child.toString();
    }
  });

  return text;
}

export function textToHTMLId(text: string): string {
  return typeof text === 'string' ? text.replace(/\s/g, '') : undefined;
}
