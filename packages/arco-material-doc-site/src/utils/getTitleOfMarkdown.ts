import path from 'path';
import fs from 'fs-extra';

export default function getTitleOfMarkdown(filePath: string) {
  const docContent = fs.readFileSync(filePath, 'utf-8');
  let title = path.basename(filePath).replace(/\..+$/, '');

  // try to get name from markdown content
  let _match = docContent.match(/`{5}\n(.+)`{5}\n/s);
  if (_match && _match[1]) {
    _match = _match[1].match(/#\s(.+)\n/);
    title = (_match && _match[1]) || title;
  }

  return title;
}
