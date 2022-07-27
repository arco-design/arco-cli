import { lexer, Tokens } from 'marked';

export default function (content: string): Array<{ depth: number; text: string }> {
  content = content || '';

  return lexer(content)
    .filter(({ type }) => type === 'heading')
    .map((token) => {
      const { depth, text } = token as Tokens.Heading;
      return {
        depth,
        text,
      };
    });
}
