import prompt, { Properties } from 'prompt';

import loader from '../cli/loader';
import { PromptCanceled } from './exceptions';

const DEFAULT_PROMPT_MSG = '';
const CANCEL_ERROR_MSG = 'canceled';

export default function (schema: Record<string, any>): () => Promise<Properties> {
  return function (): Promise<Properties> {
    return new Promise((resolve, reject) => {
      loader.stop();
      prompt.start();
      prompt.message = DEFAULT_PROMPT_MSG;

      prompt.get(schema, (err, res) => {
        if (err) {
          if (err.message === CANCEL_ERROR_MSG) {
            reject(new PromptCanceled());
          }
          return reject(err);
        }
        loader.start();
        return resolve(res);
      });
    });
  };
}
