// eslint-disable-next-line import/no-extraneous-dependencies
import React from 'react';
import { Text, Newline } from 'ink';

export enum ErrorLevel {
  // eslint-disable-next-line no-unused-vars
  WARNING = 'warning',
  // eslint-disable-next-line no-unused-vars
  ERROR = 'error',
}

export type ErrorProps = {
  errors: any[];
  level: ErrorLevel;
};

export function Error({ errors, level }: ErrorProps) {
  const color = level === ErrorLevel.WARNING ? 'yellow' : 'red';

  return (
    <>
      {errors.map((warning, index) => (
        <Text key={index} color={color}>
          <Text>{warning.message}</Text>
          {warning.stack && <Newline />}
          <Text>{warning.stack}</Text>
          <Newline />
        </Text>
      ))}
    </>
  );
}
