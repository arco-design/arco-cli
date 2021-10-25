import { parse } from '@babel/parser';

export default function (codeBlock) {
  return parse(codeBlock, {
    sourceType: 'module',
    plugins: ['jsx', 'classProperties'],
  });
}
