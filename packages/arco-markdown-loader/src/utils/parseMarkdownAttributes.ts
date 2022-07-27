import fm from 'front-matter';
import marked from '../parser/marked';

function generateHeaderHtml(header: string) {
  return header
    ? `<div className="ac-nav-intro">${marked(
        header.replace(/(\/) (.*)/, '<span className="separator">$1</span><strong>$2</strong>')
      )}</div>`
    : '';
}

function trimHeaderDefinedInMarkdownContent(
  markdown,
  formatTitle: (string) => string
): {
  headerHtml: string;
  title: string;
  description: string;
  markdown: string;
} {
  const header = /^(([ \t]*`{5})([^\n]*)([\s\S]+?)(^[ \t]*\2))/m.exec(markdown)?.[4] || '';
  const title = /# (.*)/.exec(header)?.[1] || '';

  return {
    headerHtml: generateHeaderHtml(header),
    title: typeof formatTitle === 'function' ? formatTitle(title) : title,
    description: /# .*\n*(.*)/.exec(header)?.[1] || '',
    markdown: markdown.replace(`\`\`\`\`\`${header}\`\`\`\`\``, ''),
  };
}

export default function parseMarkdownAttributes(
  originalMarkdown: string,
  formatTitle?: (string) => string
): {
  markdown: string;
  headerHtml: string;
  title: string;
  description: string;
  attributes: Record<string, string>;
} {
  const { body: markdownBody, attributes } = fm<Record<string, any>>(originalMarkdown);
  const trimResult = trimHeaderDefinedInMarkdownContent(markdownBody, formatTitle);

  /**
   * Get markdown header from content like below
   * `````
   * Group
   * # Title
   * Some description...
   * `````
   */
  if (trimResult.headerHtml) {
    return {
      ...trimResult,
      attributes,
    };
  }

  /**
   * Get markdown header from front matter like below
   * ---
   * group: Group
   * title: Title
   * description: Some description...
   * ---
   */
  const { title = '', description = '', group = '' } = attributes;
  return {
    title,
    description,
    attributes,
    markdown: trimResult.markdown,
    headerHtml:
      title || description || group
        ? generateHeaderHtml([group, title.replace(/^([^#])/, '# $1'), description].join('\n'))
        : '',
  };
}
