/**
 * Parse comment to target language
 */
export default function parseComment(options: {
  comment: { [key: string]: any };
  targetLanguage?: string;
  /** Fields to skip */
  skip?: string[];
}): { [key: string]: string } {
  const { comment, targetLanguage = 'zh-cn', skip = [] } = options;
  const splitLabel = `${Math.random()}`;
  // Do NOT modify options.comment directly, this function may execute multi-times
  const targetComment = {};

  Object.entries(comment).forEach(([key, value]) => {
    if (key === 'children') {
      targetComment[key] = value.map((v) => parseComment({ ...options, comment: v }));
      return;
    }

    if (typeof value === 'string' && skip.indexOf(key) === -1) {
      const stringList = value
        .replace(/\n([a-z]{2}-[A-Z]{2})[:：]/g, (_, $1) => `${splitLabel}${$1}`)
        .split(splitLabel);
      let length = stringList.length;

      // Search only if there are multiple languages
      if (length > 1) {
        while (length--) {
          const str = stringList[length];
          const regExp = new RegExp(`^${targetLanguage}`, 'i');
          if (regExp.test(str)) {
            targetComment[key] = str
              .replace(regExp, '')
              .replace(/^:\s*|\s*\n$/g, '')
              .replace(/\n/g, '\\n');
            return;
          }
        }
      }
    }
  });

  return targetComment;
}
