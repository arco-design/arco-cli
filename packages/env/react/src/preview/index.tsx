/**
 * This is the entry for preview-runtime render
 */

// eslint-disable-next-line import/no-extraneous-dependencies
import React from 'react';
// eslint-disable-next-line import/no-extraneous-dependencies
import ReactDOM from 'react-dom';
import { App } from './app';

const MOUNT_ROOT_ID = 'root';

export default function (props) {
  ReactDOM.render(<App {...props} />, document.querySelector(`#${MOUNT_ROOT_ID}`));
}
