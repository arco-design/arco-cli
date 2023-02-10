// eslint-disable-next-line import/no-extraneous-dependencies
import React from 'react';
import xcode from 'react-syntax-highlighter/dist/esm/styles/hljs/xcode';
import SyntaxHighlighter from 'react-syntax-highlighter/dist/esm/default-highlight';

import { Table } from '../../baseUI/table';

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

interface PropertiesTableProps {
  doclet: Doclet[];
}

export function PropertiesTable({ doclet }: PropertiesTableProps) {
  if (!doclet?.length) return null;

  return (
    <div className={styles.propertiesTable}>
      <h1 id="API">API</h1>
      {doclet.map(({ name, type, properties }, index) => {
        return (
          <div key={index} className={styles.table}>
            <h2 id={name} className={styles.tableTitle}>
              {name}
            </h2>

            {type ? (
              <SyntaxHighlighter theme={xcode} language="javascript">
                {type}
              </SyntaxHighlighter>
            ) : null}

            {properties.length ? (
              <Table headings={['name', 'type', 'default', 'description']} rows={properties} />
            ) : null}
          </div>
        );
      })}
    </div>
  );
}
