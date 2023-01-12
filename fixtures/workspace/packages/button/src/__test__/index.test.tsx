import React from 'react';
import { render } from '@testing-library/react';
import Button from '../index';

describe('Button', () => {
  it('render content', () => {
    render(<Button content="hello" />);
    expect(document.querySelector('.arco-btn')).toHaveTextContent('hello');
  });
});
