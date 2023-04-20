// eslint-disable-next-line import/no-extraneous-dependencies
import React, { useContext, useEffect, useMemo } from 'react';

import { DocAnchorContext } from './docAnchorContext';
import { textToHTMLId } from '../heading';

import styles from './docAnchor.module.scss';

interface DocAnchorProps {
  outlineJsonStr: string;
}

// only allow to render one anchor in single page
let pageUniqueAnchorId = null;

export function DocAnchor({ outlineJsonStr }: DocAnchorProps) {
  const { anchorList: anchorListFromContext, updateAnchorList } = useContext(DocAnchorContext);

  const thisAnchorId = useMemo<string>(() => {
    return Math.random().toFixed(10).slice(2);
  }, []);

  useEffect(() => {
    try {
      const anchorListFromProps = JSON.parse(outlineJsonStr);
      // append all anchor info from mdx contents to context
      // we will render anchors according to context anchor list info
      updateAnchorList(anchorListFromProps);
    } catch (e) {}
  }, [outlineJsonStr]);

  useEffect(() => {
    return () => {
      // reset page unique anchor id to null after this anchor destroyed
      if (thisAnchorId === pageUniqueAnchorId) {
        pageUniqueAnchorId = null;
      }
    };
  }, []);

  if (!pageUniqueAnchorId) {
    pageUniqueAnchorId = thisAnchorId;
  }

  // only allow to render one anchor in the same page
  if (thisAnchorId !== pageUniqueAnchorId) {
    return null;
  }

  return anchorListFromContext.length ? (
    <ul className={styles.docAnchor}>
      {anchorListFromContext.map(({ depth, text }, index) => {
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
  ) : null;
}
