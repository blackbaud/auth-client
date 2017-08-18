import { BBOmnibarUserActivityProcessArgs } from './omnibar-user-activity-process-args';

export class BBOmnibarUserActivityProcessor {
  public static process(args: BBOmnibarUserActivityProcessArgs) {
    const {
      allowAnonymous,
      closeInactivityPrompt,
      expirationDate,
      inactivityPromptDuration,
      isShowingInactivityPrompt,
      lastActivity,
      maxSessionAge,
      minRenewalAge,
      redirectForInactivity,
      renewSession,
      showInactivityPrompt
    } = args;

    const now = Date.now();

    // This is for the edge case where the user has signed out in another window but session
    // watcher hasn't yet redirected this window to the sign in page.  Just return and let
    // session watcher trigger the redirect.
    if (expirationDate === null) {
      return;
    }

    if (now > expirationDate) {
      redirectForInactivity();
    }

    // When the inactivity prompt is scheduled to be shown.
    const promptDate = expirationDate - inactivityPromptDuration;

    // When the next renewal opportunity will occur.
    const renewDate = expirationDate - maxSessionAge + minRenewalAge;

    // If we're showing the prompt, then don't process renewals based on activity.  They will need to
    // physically click on the prompt now.
    if (isShowingInactivityPrompt) {
      // The inactivity prompt was dismissed in another window.  Hide this one.
      if (now < promptDate) {
        closeInactivityPrompt();
      }
    } else {
      if (lastActivity > renewDate) {
        renewSession();
      } else if (!allowAnonymous && now > promptDate) {
        showInactivityPrompt();
      }
    }
  }
}
