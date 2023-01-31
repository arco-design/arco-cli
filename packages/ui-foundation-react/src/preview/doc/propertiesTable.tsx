// eslint-disable-next-line import/no-extraneous-dependencies
import React from 'react';
import { Table } from '../../baseUI/table';

// Type from @arco-cli/react/dist/tsdoc/types
type DocProp = {
  name: string;
  description: string;
  required: boolean;
  type: string;
  defaultValue?: string;
  version?: string;
};

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
