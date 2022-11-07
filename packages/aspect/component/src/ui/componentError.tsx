// eslint-disable-next-line import/no-extraneous-dependencies
import React from 'react';
import { NotFoundPage } from '@arco-cli/ui-foundation-react/dist/pages';

export class ComponentError {
  constructor(
    /**
     * http status code of error
     */
    public readonly code: number,

    /**
     * error message of the error
     */
    public readonly message?: string
  ) {}

  renderError() {
    return <NotFoundPage />;
  }
}
