import doctrine from 'doctrine';

export type Comment = { [key: string]: string };

export default function parseRawComment(fileContent: string) {
  const commentList: Array<Comment> = [];
  fileContent.replace(/\/\*{2}\s*\n(\s*\*.*\n)+\s*\*\//g, (match) => {
    const comment = {
      kind: 'member',
    };

    doctrine
      .parse(match, { unwrap: true, recoverable: true })
      .tags.forEach(({ title, name, description }) => {
        const value = name || description;
        if (value) {
          comment[title] = value;
        }
        if (title === 'file') {
          comment.kind = 'file';
        }
      });

    commentList.push(comment);

    return match;
  });

  return commentList;
}
