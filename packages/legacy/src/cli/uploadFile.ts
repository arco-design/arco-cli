import fs from 'fs-extra';
import axios from 'axios';
import FormData from 'form-data';

import { getSync } from '../globalConfig';
import { CFG_ACCESS_TOKEN_KEY, CFG_HOST_ARCO_KEY, CFG_USER_TOKEN_KEY } from '../constants';

type FileUploadResult = {
  code: number;
  msg: string;
  data?: {
    zip: string;
    files: Record<string, string>;
  };
};

export async function uploadFile(options: {
  filePath: string;
  manifest?: Record<string, string>;
  cdnGlobs?: string[];
}): Promise<FileUploadResult> {
  const hostArco = getSync(CFG_HOST_ARCO_KEY);
  const userToken = getSync(CFG_USER_TOKEN_KEY);
  const accessToken = getSync(CFG_ACCESS_TOKEN_KEY);
  const { filePath, manifest, cdnGlobs } = options;

  const form = new FormData();
  const result: FileUploadResult = {
    code: 1,
    msg: '',
  };

  form.append('file', fs.createReadStream(filePath));
  if (manifest) {
    form.append('manifest', JSON.stringify(manifest));
  }
  if (Array.isArray(cdnGlobs) && cdnGlobs.length) {
    form.append('cdnGlobs', JSON.stringify(cdnGlobs));
  }

  try {
    const {
      data: { code, msg, data },
    } = await axios.post(`https://${hostArco}/files/uploadFiles`, form, {
      timeout: 1000 * 60 * 10,
      headers: {
        ...form.getHeaders(),
        [CFG_USER_TOKEN_KEY]: userToken,
        [CFG_ACCESS_TOKEN_KEY]: accessToken,
      },
    });

    result.msg = msg;
    result.code = code;
    result.data = data;
  } catch (err) {
    result.msg = err.toString();
  }

  return result;
}
