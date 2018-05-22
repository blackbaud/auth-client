import { BBOmnibarThemeAccent } from './omnibar-theme-accent';

export interface BBOmnibarTheme {

  backgroundColor?: string;

  textColor?: string;

  dropShadow?: boolean;

  accent?: boolean | BBOmnibarThemeAccent;

  iconColor?: string;

}
