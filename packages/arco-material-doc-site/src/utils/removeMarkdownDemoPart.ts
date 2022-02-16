// Remove demo part in markdown
function removeMarkdownDemoPart(markdown) {
  const regDemoPart = /##\s+Demos\s*\n/i;

  if (regDemoPart.test(markdown)) {
    const separator = `$arco_markdown_separator$`;
    let docPart = '';
    markdown
      .replace(/##\s+.+\n/gi, (match) => `${separator}${match}`)
      .split(separator)
      .forEach((str) => {
        if (!regDemoPart.test(str)) {
          docPart += str;
        }
      });
    return docPart;
  }

  return markdown;
}

export default removeMarkdownDemoPart;
