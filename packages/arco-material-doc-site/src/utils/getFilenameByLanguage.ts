import { PLACEHOLDER_FILENAME_LANGUAGE } from '../constant';

export default function getFilenameByLanguage(filename: string, language: string) {
  return typeof filename === 'string'
    ? filename.replace(`.${PLACEHOLDER_FILENAME_LANGUAGE}.`, `.${language}.`)
    : filename;
}
