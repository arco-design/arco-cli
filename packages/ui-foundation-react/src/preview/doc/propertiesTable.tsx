// eslint-disable-next-line import/no-extraneous-dependencies
import React, { ReactNode, useContext, useEffect, useMemo } from 'react';

import { Table } from '../../baseUI/table';
import { DocAnchorContext } from '../../markdown/components/docAnchor';
import { CodeSnippet } from '../../markdown/components/snippet/codeSnippet';

import styles from './propertiesTable.module.scss';

// Type from @arco-cli/react/dist/tsdoc/types
export type DocProp = {
  name: string;
  description: string;
  required: boolean;
  type: string;
  defaultValue?: string;
  version?: string;
};

// Type from @arco-cli/react/dist/tsdoc/types
export type Doclet = {
  filePath: string;
  name: string;
  description?: string;
  type?: string;
  args?: Record<string, any>[];
  returns?: Record<string, any>;
  properties?: DocProp[];
};

type AnchorInfo = { depth: number; text: string };

interface PropertiesTableProps {
  doclet: Doclet[];
}

export function PropertiesTable({ doclet }: PropertiesTableProps) {
  const { updateAnchorList } = useContext(DocAnchorContext);

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

  useEffect(() => {
    updateAnchorList(anchorList.map(({ text, depth }) => ({ text, depth })));
  }, [doclet]);

  return anchorList.length ? (
    <div className={styles.propertiesTable}>{anchorList.map(({ content }) => content)}</div>
  ) : null;
}
