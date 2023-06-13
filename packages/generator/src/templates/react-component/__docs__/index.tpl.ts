import { TemplateFunction } from '../../../types';

const templateFn: TemplateFunction = function ({ name: componentName }) {
  componentName = componentName.replace(/-(.)/g, (_, $1) => $1.toUpperCase());

  return {
    filename: 'index.mdx',
    contents: `---
title: ${componentName}
description: Some description about this component.
labels: ['Keyword-1', 'Keyword-2']
---

# 基本用法

import Basic from './basic';

<div data-arco-demo="Basic">
  <Basic />
</div>
`,
  };
};

export default templateFn;
