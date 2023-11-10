// eslint-disable-next-line import/no-extraneous-dependencies
import React, { useContext, useEffect, useRef, useState } from 'react';

import { textToHTMLId } from '../heading';
import { PreviewContext } from '../../../preview/previewContext';

import styles from './docAnchor.module.scss';

export function DocAnchor() {
  const { pubsub, pubsubTopicParent } = useContext(PreviewContext);
  const [anchorList, setAnchorList] = useState<Array<{ text: string; depth: number; id?: string }>>(
    []
  );

  const refHeadingQueryTimer = useRef(null);
  const [pageOffset, setPageOffset] = useState(0);

  useEffect(() => {
    refHeadingQueryTimer.current = setInterval(() => {
      const titles = document.querySelectorAll('h1, h2');
      if (titles?.length) {
        setAnchorList(
          [...titles]
            .map((title) => {
              return {
                id: title.getAttribute('id'),
                text: title.textContent,
                depth: +title.tagName.slice(-1),
              };
            })
            .filter(({ id }) => !!id)
        );
      }
    }, 500);

    return () => {
      window.clearInterval(refHeadingQueryTimer.current);
    };
  }, []);

  useEffect(() => {
    pubsub?.sub(pubsubTopicParent, (message) => {
      const { type, data } = message;
      if (type === 'updateAnchorOffset' && typeof data.offset === 'number') {
        setPageOffset(data.offset);
      }
    });
  }, [pubsub]);

  return anchorList.length ? (
    <ul
      className={styles.docAnchor}
      style={pageOffset ? { transform: `translateY(${pageOffset}px)` } : {}}
    >
      {anchorList.map(({ depth, text, id }, index) => {
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
