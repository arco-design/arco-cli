import yaml from 'yaml';
import visit from 'unist-util-visit';
import remove from 'unist-util-remove';

export function extractMetadata() {
  return function transformer(tree, file) {
    visit(tree, 'yaml', (node: any) => {
      try {
        file.data.frontmatter = yaml.parse(node.value, { prettyErrors: true });
      } catch (err: any) {
        throw new Error(
          `failed extracting metadata/front-matter using Yaml lib, due to an error (please disregard the line/column): ${err.message}`
        );
      }
    });

    remove(tree, 'yaml');
  };
}
