// eslint-disable-next-line import/no-extraneous-dependencies
import React from 'react';
import { ErrorPage } from './errorPage';
import { ContactFooter } from './contactFooter';

export type NotFoundPageProps = React.HTMLAttributes<HTMLDivElement>;

export function NotFoundPage({ ...rest }: NotFoundPageProps) {
  return (
    <ErrorPage {...rest} code={404} title="Page Not Found">
      <ContactFooter />
    </ErrorPage>
  );
}
