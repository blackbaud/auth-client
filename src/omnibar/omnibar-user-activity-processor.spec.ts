import { BBOmnibarUserActivityProcessArgs } from './omnibar-user-activity-process-args';
import { BBOmnibarUserActivityProcessor } from './omnibar-user-activity-processor';

describe('Omnibar user activity processor', () => {

  let closeInactivityPromptSpy: jasmine.Spy;
  let renewSessionSpy: jasmine.Spy;
  let redirectForInactivitySpy: jasmine.Spy;
  let showInactivityPromptSpy: jasmine.Spy;

  function createDefaultArgs(): BBOmnibarUserActivityProcessArgs {
    return {
      allowAnonymous: false,
      closeInactivityPrompt: closeInactivityPromptSpy,
      expirationDate: undefined,
      inactivityPromptDuration: undefined,
      isShowingInactivityPrompt: undefined,
      lastActivity: undefined,
      maxSessionAge: undefined,
      minRenewalAge: undefined,
      redirectForInactivity: redirectForInactivitySpy,
      renewSession: renewSessionSpy,
      showInactivityPrompt: showInactivityPromptSpy
    };
  }

  beforeEach(() => {
    closeInactivityPromptSpy = jasmine.createSpy('closeInactivityPrompt');
    renewSessionSpy = jasmine.createSpy('renewSession');
    redirectForInactivitySpy = jasmine.createSpy('redirectForInactivity');
    showInactivityPromptSpy = jasmine.createSpy('showInactivityPrompt');
  });

  it('should short-circuit when expiration date is null', () => {
    const args = createDefaultArgs();

    args.expirationDate = null;

    BBOmnibarUserActivityProcessor.process(args);

    expect(redirectForInactivitySpy).not.toHaveBeenCalled();
    expect(renewSessionSpy).not.toHaveBeenCalled();
    expect(showInactivityPromptSpy).not.toHaveBeenCalled();
    expect(closeInactivityPromptSpy).not.toHaveBeenCalled();
  });

  it('should redirect for inactivity', () => {
    const args = createDefaultArgs();

    args.expirationDate = Date.now() - 10;

    BBOmnibarUserActivityProcessor.process(args);

    expect(redirectForInactivitySpy).toHaveBeenCalled();
  });

  it('should close the inactivity prompt when the expiration date after the prompt timeframe', () => {
    const args = createDefaultArgs();

    args.expirationDate = Date.now() + 6;
    args.inactivityPromptDuration = 5;
    args.isShowingInactivityPrompt = true;

    BBOmnibarUserActivityProcessor.process(args);

    expect(closeInactivityPromptSpy).toHaveBeenCalled();
  });

  it('should not close the inactivity prompt when the expiration date is within the prompt timeframe', () => {
    const args = createDefaultArgs();

    args.expirationDate = Date.now() + 4;
    args.inactivityPromptDuration = 5;
    args.isShowingInactivityPrompt = true;

    BBOmnibarUserActivityProcessor.process(args);

    expect(closeInactivityPromptSpy).not.toHaveBeenCalled();
  });

  it('should renew the session if the last activity is past the scheduled renewal date', () => {
    const args = createDefaultArgs();

    args.expirationDate = Date.now() + 1;
    args.inactivityPromptDuration = 5;
    args.lastActivity = Date.now() - 1;
    args.maxSessionAge = 10;
    args.minRenewalAge = 5;

    BBOmnibarUserActivityProcessor.process(args);

    expect(renewSessionSpy).toHaveBeenCalled();
  });

  it('should show the inactivity prompt when the prompt timeframe is reached', () => {
    const args = createDefaultArgs();

    args.expirationDate = Date.now() + 1;
    args.inactivityPromptDuration = 5;
    args.lastActivity = Date.now() - 4;
    args.maxSessionAge = 10;
    args.minRenewalAge = 5;

    BBOmnibarUserActivityProcessor.process(args);

    expect(showInactivityPromptSpy).toHaveBeenCalled();
  });

  it('should not show the inactivity prompt when allow anonymous is true', () => {
    const args = createDefaultArgs();

    args.allowAnonymous = true;
    args.expirationDate = Date.now() + 1;
    args.inactivityPromptDuration = 5;
    args.lastActivity = Date.now() - 4;
    args.maxSessionAge = 10;
    args.minRenewalAge = 5;

    BBOmnibarUserActivityProcessor.process(args);

    expect(showInactivityPromptSpy).not.toHaveBeenCalled();
  });

});
