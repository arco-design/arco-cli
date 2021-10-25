export default function getDescriptionFromMdLexer(lexer = [], lang) {
  const index = lexer.findIndex((l) => l.type === 'heading' && l.depth === 2 && l.text === lang);
  const s = [];
  if (index > -1) {
    lexer.slice(index + 1).some((le) => {
      if (le.type === 'heading' && le.depth === 2) {
        return true;
      }
      if (le.text) {
        s.push(le.text);
      }
      return false;
    });
    return s.join('\n\n');
  }
  return null;
}
