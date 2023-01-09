// eslint-disable-next-line import/no-extraneous-dependencies
import React, { useMemo } from 'react';
import { textToHTMLId } from '../heading';

import styles from './docAnchor.module.scss';

interface DocAnchorProps {
  outlineJsonStr: string;
}

export function DocAnchor({ outlineJsonStr }: DocAnchorProps) {
  const outline = useMemo<Array<{ depth: number; text: string }>>(() => {
    let result = [];
    try {
      result = JSON.parse(outlineJsonStr);
    } catch (e) {}

    // TODO find a way to fill anchors from component metadata
    if (!result.find(({ depth, text }) => depth === 1 && text === 'API')) {
      result.push({ depth: 1, text: 'API' });
    }

    return result;
  }, [outlineJsonStr]);

  return (
    <ul className={styles.docAnchor}>
      {outline.map(({ depth, text }, index) => {
        return (
          <li key={index}>
            <a
              className={styles.anchor}
              style={{ marginLeft: 16 * (depth - 1) }}
              href={`#${textToHTMLId(text)}`}
            >
              {text}
            </a>
          </li>
        );
      })}
    </ul>
  );
}
