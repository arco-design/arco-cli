// eslint-disable-next-line import/no-extraneous-dependencies
import { PropsWithChildren } from 'react';

// eslint-disable-next-line @typescript-eslint/no-empty-interface
interface ThemeProps {}

export function DocsTheme(props: PropsWithChildren<ThemeProps>) {
  const { children } = props;
  const hash = window.location.hash || '';
  const [, hashQuery] = hash.split('?');
  const params = new URLSearchParams(hashQuery);
  const theme = params.get('theme') || 'light';

  // TODO theme toggle
  console.log(`Current theme ${theme}`);

  return children;
}
