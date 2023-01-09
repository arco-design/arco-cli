import React from 'react';
import { Table } from '@arco-cli/ui-foundation-react/dist/baseUI';

import type { DocProp } from '../../tsdoc/types';

type PropertySchema = {
  name: string;
  description: string;
  properties: Array<DocProp>;
};

interface PropertiesTableProps {
  schema: PropertySchema[];
}

export function PropertiesTable({ schema }: PropertiesTableProps) {
  if (!schema || !schema.length) return null;

  return (
    <div>
      <h1 id="API">API</h1>
      {schema.map(({ name, properties }, index) => {
        return (
          <div key={index}>
            <h2>{name}</h2>
            <Table headings={['name', 'type', 'default', 'description']} rows={properties} />
          </div>
        );
      })}
    </div>
  );
}
