import { cloneDeep } from 'lodash';

export const systemFields = ['stack', 'code', 'errno', 'syscall'];

export default function cloneErrorObject(error: Error): Error {
  // @ts-ignore
  const err = new error.constructor(error.message);

  systemFields.forEach((field) => {
    if (error[field]) err[field] = error[field];
  });
  Object.keys(error).forEach((key) => {
    err[key] = cloneDeep(error[key]);
  });
  return err;
}
