import visit from 'unist-util-visit';

export function extractHeadings(docAnchorComponentName: string) {
  const headings = [];
  const getHeadingText = (node, text = '') => {
    const nodeTypeHasTextValue = ['inlineCode', 'text'];
    if (Array.isArray(node.children)) {
      for (const c of node.children) {
        text += getHeadingText(c);
      }
    } else if (nodeTypeHasTextValue.indexOf(node.type) > -1) {
      text += node.value;
    }
    return text;
  };

  return function transformer(tree, file) {
    visit(tree, 'heading', (node: any) => {
      const text = getHeadingText(node);
      const heading = {
        text,
        depth: node.depth,
      };
      headings.push(heading);
    });

    file.data.headings = headings;

    if (docAnchorComponentName) {
      tree.children.push({
        type: 'jsx',
        value: `<${docAnchorComponentName} />`,
      });
    }
  };
}
