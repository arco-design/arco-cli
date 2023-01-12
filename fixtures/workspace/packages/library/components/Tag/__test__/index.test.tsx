import React from 'react';
import { render } from '@testing-library/react';
import Tag from '../index';

describe('Tag', () => {
  it('render content', () => {
    render(<Tag content="hello" />);
    // expect(document.querySelector('.arco-btn')).toHaveTextContent('hello');
  });
});
