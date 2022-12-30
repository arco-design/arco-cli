import React from 'react';

interface PropertiesTableProps {
  schema: any;
}

export function PropertiesTable({ schema }: PropertiesTableProps) {
  if (!schema) return null;

  return <pre>{JSON.stringify(schema, null, 2)}</pre>;
}
