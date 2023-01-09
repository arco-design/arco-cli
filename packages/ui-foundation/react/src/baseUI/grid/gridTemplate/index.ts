import styles from './gridTemplate.module.scss';

type ColumnPreset = {
  1: string;
  2: string;
  3: string;
  4: string;
  5: string;
  6: string;
  7: string;
  8: string;
  9: string;
  10: string;
  11: string;
  12: string;
};

function makePreset(breakPoints: string): ColumnPreset {
  const obj: any = {};

  for (let i = 1; i <= 12; i++) {
    obj[i] = styles[`colTemplate--${breakPoints}-${i}`];
  }

  return obj;
}

export const colGrid = makePreset('all');
export const colGridXs = makePreset('xs');
export const colGridSm = makePreset('sm');
export const colGridMd = makePreset('md');
export const colGridL = makePreset('l');
export const colGridLg = makePreset('lg');
export const colGridXl = makePreset('xl');
