import React from 'react';
import { Text } from 'ink';

export type TimeProps = {
  /**
   * time to render.
   */
  time?: Date;
};

export function Time(props: TimeProps) {
  const { time } = props;
  return <Text>{time.toLocaleTimeString()}</Text>;
}
