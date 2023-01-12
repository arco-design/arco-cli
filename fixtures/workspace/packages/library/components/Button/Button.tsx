import React from 'react';
import { ButtonProps } from './interface';

export default function Button(props: ButtonProps) {
  const { size, content, status } = props;
  return (
    <button className="arco-btn" data-size={size} data-status={status}>
      {content}
    </button>
  );
}
