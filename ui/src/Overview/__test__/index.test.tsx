/* eslint-disable import/no-extraneous-dependencies */
import React from 'react';
import { render } from '@testing-library/react';
import { Overview } from '../index';

describe('Overview', () => {
  it('render current content', () => {
    render(<Overview />);
    expect(document.querySelector('div')).toHaveTextContent('Edit this component');
  });
});
