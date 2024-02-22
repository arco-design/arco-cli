// eslint-disable-next-line import/no-extraneous-dependencies
import React, { ReactNode, useEffect, useMemo, useRef, useState } from 'react';
// eslint-disable-next-line import/no-extraneous-dependencies
import { createPortal } from 'react-dom';
import type { Doclet } from '@arco-cli/legacy/dist/types';

import { Table } from '../../baseUI/table';
import { CodeSnippet } from '../../markdown/components/snippet/codeSnippet';

import styles from './propertiesTable.module.scss';

type AnchorInfo = { depth: number; text: string };

interface PropertiesTableProps {
  doclet: Doclet[];
  placeholderID?: string;
}

export function PropertiesTable({ doclet, placeholderID }: PropertiesTableProps) {
  const [, forceUpdate] = useState(0);
  const refPortal = useRef(null);

  const anchorList = useMemo<Array<AnchorInfo & { content: ReactNode }>>(() => {
    const list = [];

    if (doclet?.length) {
      const apiTitleText = 'API';
      list.push({
        text: apiTitleText,
        depth: 1,
        content: (
          <h1 id={apiTitleText} key={apiTitleText}>
            {apiTitleText}
          </h1>
        ),
      });
      list.push(
        ...doclet.map(({ name, type, properties }, index) => ({
          text: name,
          depth: 2,
          content: (
            <div key={index} className={styles.table}>
              <h2 id={name} className={styles.tableTitle}>
                {name}
              </h2>

              {type ? <CodeSnippet children={type} /> : null}

              {properties.length ? (
                <Table
                  headings={['name', 'type', 'default', 'description']}
                  rows={properties.map((p) => ({ ...p, default: p.defaultValue }))}
                />
              ) : null}
            </div>
          ),
        }))
      );
    }

    return list;
  }, [doclet]);

  const eleTable = anchorList.length ? (
    <div className={styles.propertiesTable}>{anchorList.map(({ content }) => content)}</div>
  ) : null;

  useEffect(() => {
    if (!placeholderID) return undefined;

    const observer = new MutationObserver(() => {
      const placeholder = document.querySelector(`#${placeholderID}`);
      if (placeholder) {
        refPortal.current = createPortal(eleTable, placeholder);
        forceUpdate(Math.random());
      }
    });

    observer.observe(document.body, { childList: true, subtree: true });

    return () => {
      observer.disconnect();
    };
  }, [placeholderID]);

  return placeholderID ? refPortal.current : eleTable;
}
