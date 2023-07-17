// eslint-disable-next-line import/no-extraneous-dependencies
import React, { useContext, useEffect, useMemo, useRef, useState } from 'react';

import { textToHTMLId } from '../heading';
import { DocAnchorContext } from './docAnchorContext';
import { CLASSNAME_MARKDOWN_CONTENT } from '../../../constants';
import { PreviewContext } from '../../../preview/previewContext';

import styles from './docAnchor.module.scss';

// only allow to render one anchor in single page
let pageUniqueAnchorId = null;

export function DocAnchor() {
  const { registerGlobalMethod } = useContext(PreviewContext);
  const { anchorList: anchorListFromContext, updateAnchorList } = useContext(DocAnchorContext);

  const refHeadingQueryTimer = useRef(null);
  const [pageOffset, setPageOffset] = useState(0);

  // only allow to render one anchor in the same page
  const isTheOnlyAnchorToRender = useMemo<boolean>(() => {
    const thisId = Math.random().toFixed(10).slice(2);
    if (!pageUniqueAnchorId) {
      pageUniqueAnchorId = thisId;
    }
    return thisId === pageUniqueAnchorId;
  }, []);

  useEffect(() => {
    if (isTheOnlyAnchorToRender) {
      refHeadingQueryTimer.current = setInterval(() => {
        const titles = document
          .querySelector(`.${CLASSNAME_MARKDOWN_CONTENT}`)
          ?.querySelectorAll('h1, h2');
        if (titles?.length) {
          updateAnchorList(
            [...titles]
              .map((title) => {
                return {
                  id: title.getAttribute('id'),
                  text: title.textContent,
                  depth: +title.tagName.slice(-1),
                };
              })
              .filter(({ id }) => !!id),
            'prepend'
          );
          window.clearInterval(refHeadingQueryTimer.current);
        }
      }, 200);
    }

    return () => {
      window.clearInterval(refHeadingQueryTimer.current);
    };
  }, []);

  useEffect(() => {
    return () => {
      // reset page unique anchor id to null after this anchor destroyed
      if (isTheOnlyAnchorToRender) {
        pageUniqueAnchorId = null;
      }
    };
  }, []);

  useEffect(() => {
    registerGlobalMethod('updateAnchorOffset', (nextOffset) => {
      setPageOffset(nextOffset);
    });
  }, []);

  return isTheOnlyAnchorToRender && anchorListFromContext.length ? (
    <ul
      className={styles.docAnchor}
      style={pageOffset ? { transform: `translateY(${pageOffset}px)` } : {}}
    >
      {anchorListFromContext.map(({ depth, text, id }, index) => {
        return (
          <li key={index}>
            <a
              className={styles.anchor}
              style={{ marginLeft: 16 * (depth - 1) }}
              href={`#${id || textToHTMLId(text)}`}
            >
              {text}
            </a>
          </li>
        );
      })}
    </ul>
  ) : null;
}
