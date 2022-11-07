// eslint-disable-next-line import/no-extraneous-dependencies
import React from 'react';
// eslint-disable-next-line import/no-extraneous-dependencies
import ReactDOM from 'react-dom';

import { DocsApp } from './docsApp';
import { MOUNT_ROOT_ID } from '../constants';

export default function (props) {
  ReactDOM.render(<DocsApp {...props} />, document.querySelector(`#${MOUNT_ROOT_ID}`));
}
