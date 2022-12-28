// eslint-disable-next-line import/no-extraneous-dependencies
import React, { useContext } from 'react';
import { ComponentPreview } from '@arco-cli/preview/dist/ui';
import { ComponentContext } from '@arco-cli/component/dist/ui';

export function Overview() {
  const component = useContext(ComponentContext);

  return (
    <div>
      <div>
        <h1>{component.name}</h1>
        <h2>{component.description}</h2>
        <ul>
          {component.labels.map((label, index) => (
            <li key={index}>{label}</li>
          ))}
        </ul>
        <ul>
          {component.outline.map(({ text, depth }, index) => (
            <li key={index} style={{ marginLeft: 8 * (depth - 1) }}>
              {text}
            </li>
          ))}
        </ul>
      </div>
      <ComponentPreview
        style={{ width: '100%', height: '100%' }}
        pubsub
        component={component}
        previewName="overview"
        viewport={null}
        scrolling="no"
        fullContentHeight
      />
    </div>
  );
}
