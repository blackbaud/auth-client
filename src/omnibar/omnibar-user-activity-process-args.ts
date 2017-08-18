export interface BBOmnibarUserActivityProcessArgs {
  expirationDate: number;

  inactivityPromptDuration: number;

  maxSessionAge: number;

  minRenewalAge: number;

  lastActivity: number;

  allowAnonymous: boolean;

  isShowingInactivityPrompt: boolean;

  closeInactivityPrompt: () => void;

  renewSession: () => void;

  redirectForInactivity: () => void;

  showInactivityPrompt: () => void;
}
