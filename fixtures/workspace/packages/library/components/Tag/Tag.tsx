import React from 'react';
import { TagProps } from './interface';

export default function Tag(props: TagProps) {
  const { size, content, status } = props;
  return (
    <div className="arco-tag" data-size={size} data-status={status}>
      {content}
    </div>
  );
}
