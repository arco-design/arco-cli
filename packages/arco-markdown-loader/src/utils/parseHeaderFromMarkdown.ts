import marked from '../parser/marked';

export default function parseHeaderFromMarkdown(
  markdown: string,
  formatTitle?: (string) => string
) {
  const getRawHeader = (str: string) => {
    const reg = /^(([ \t]*`{5})([^\n]*)([\s\S]+?)(^[ \t]*\2))/m.exec(str);
    return reg && reg[4];
  };
  const getTitle = (str: string) => {
    const reg = /# (.*)/.exec(str);
    const result = reg && reg[1];
    return formatTitle ? formatTitle(result) : result;
  };
  const getDescription = (str: string) => {
    const reg = /# .*\n*(.*)/.exec(str);
    return reg && reg[1];
  };

  let title = '';
  let description = '';
  let headerHtml = '';

  const rawHeader = getRawHeader(markdown);
  if (rawHeader) {
    markdown = markdown.replace(`\`\`\`\`\`${rawHeader}\`\`\`\`\``, '');
    headerHtml = `<div className="ac-nav-intro">${marked(
      rawHeader.replace(/(\/) (.*)/, '<span className="separator">$1</span> **$2**')
    )}</div>`;
    title = getTitle(rawHeader);
    description = getDescription(rawHeader);
  }

  return {
    markdown,
    headerHtml,
    title,
    description,
  };
}
