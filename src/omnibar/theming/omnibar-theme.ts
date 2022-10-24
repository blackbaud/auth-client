//#region imports

import { BBOmnibarThemeAccent } from './omnibar-theme-accent';

//#endregion

export interface BBOmnibarTheme {
  backgroundColor?: string;

  textColor?: string;

  dropShadow?: boolean;

  accent?: boolean | BBOmnibarThemeAccent;

  iconColor?: string;

  name?: string;

  mode?: string;
}
