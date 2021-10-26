import {
  BBAuth
} from '../auth';

import {
  BBAuthInterop
} from '../shared/interop';

import {
  BBOmnibarPushNotifications
} from './omnibar-push-notifications';

import {
  BBOmnibarPushNotificationsConnectArgs
} from './omnibar-push-notifications-connect-args';

import {
  BBOmnibarScriptLoader
} from './omnibar-script-loader';

import {
  BBOmnibarToastContainer
} from './omnibar-toast-container';

describe('Omnibar push notifications', () => {

  // tslint:disable-next-line:max-line-length
  const testTokenWithNotificationEntitlement = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyLCIxYmIuZW50aXRsZW1lbnRzIjpbIm5vdGlmIiwiZm9vIl19.XskU9eHmCxzkRq0GIgmZd3MtFHZ9xaWJUWeuUkDjPb0';

  // tslint:disable-next-line:max-line-length
  const testTokenWithoutNotificationEntitlement = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c';

  let addCustomMessageListenerSpy: jasmine.Spy;
  let addListenerSpy: jasmine.Spy;
  let destroySpy: jasmine.Spy;
  let initSpy: jasmine.Spy;
  let registerScriptSpy: jasmine.Spy<typeof BBOmnibarScriptLoader.registerScript>;
  let updateNotificationsSpy: jasmine.Spy;
  let toastContainerInitSpy: jasmine.Spy<typeof BBOmnibarToastContainer.init>;
  let getTokenSpy: jasmine.Spy<typeof BBAuth.getToken>;

  function createNotificationsClient(): any {
    return (window as any).BBNotificationsClient = {
      BBNotifications: {
        addCustomMessageListener: addCustomMessageListenerSpy,
        addListener: addListenerSpy,
        destroy: destroySpy,
        init: initSpy,
        updateNotifications: updateNotificationsSpy
      }
    };
  }

  function createTestConnectArgs(): BBOmnibarPushNotificationsConnectArgs {
    return {
      customMessageCallback: jasmine.createSpy('customMessageCallback'),
      envId: 'abc',
      handleNavigate: jasmine.createSpy('handleNavigate'),
      handleNavigateUrl: jasmine.createSpy('handleNavigateUrl'),
      leId: '123',
      notificationsCallback: jasmine.createSpy('notificationsCallback'),
      openPushNotificationsMenu: jasmine.createSpy('openPushNotificationsMenu'),
      showVerticalNav: false,
      svcId: 'xyz'
    };
  }

  async function testSvcId(
    svcId: string,
    tokenSpyCalled: boolean,
    notificationsInitialized: boolean
  ): Promise<void> {
    getTokenSpy.calls.reset();
    addListenerSpy.calls.reset();

    await BBOmnibarPushNotifications.disconnect();

    createNotificationsClient();

    getTokenSpy
      .and
      .returnValue(Promise.resolve(testTokenWithNotificationEntitlement));

    const args = createTestConnectArgs();
    args.svcId = svcId;

    await BBOmnibarPushNotifications.connect(args);

    let tokenSpyExpectation = expect(getTokenSpy);
    if (!tokenSpyCalled) {
      tokenSpyExpectation = tokenSpyExpectation.not;
    }

    tokenSpyExpectation.toHaveBeenCalled();

    let notificationsInitExpectation = expect(addListenerSpy);
    if (!notificationsInitialized) {
      notificationsInitExpectation = notificationsInitExpectation.not;
    }

    notificationsInitExpectation.toHaveBeenCalledWith(args.notificationsCallback);
  }

  beforeEach(() => {
    registerScriptSpy = spyOn(BBOmnibarScriptLoader, 'registerScript');

    addCustomMessageListenerSpy = jasmine.createSpy('addCustomMessageListener');
    addListenerSpy = jasmine.createSpy('addListener');
    initSpy = jasmine.createSpy('init');
    destroySpy = jasmine.createSpy('destroy');
    updateNotificationsSpy = jasmine.createSpy('updateNotifications');

    toastContainerInitSpy = spyOn(BBOmnibarToastContainer, 'init')
      .and
      .returnValue(Promise.resolve());

    getTokenSpy = spyOn(BBAuth, 'getToken');
  });

  afterEach(async () => {
    await BBOmnibarPushNotifications.disconnect();
    delete (window as any).BBNotificationsClient;
  });

  it('should init the notifications client', async () => {
    createNotificationsClient();

    await BBOmnibarPushNotifications.connect(createTestConnectArgs());

    expect(registerScriptSpy).not.toHaveBeenCalled();

    expect(initSpy).toHaveBeenCalledWith({
      tokenCallback: jasmine.any(Function)
    });
  });

  it('should register notifications client if it is not present', async () => {
    registerScriptSpy.and.callFake(async () => {
      createNotificationsClient();
    });

    await BBOmnibarPushNotifications.connect(createTestConnectArgs());

    expect(registerScriptSpy).toHaveBeenCalledWith(BBOmnibarPushNotifications.NOTIFICATIONS_CLIENT_URL);
  });

  it('should not register notifications client again if previously connected', async () => {
    registerScriptSpy.and.callFake(async () => {
      createNotificationsClient();
    });

    await BBOmnibarPushNotifications.connect(createTestConnectArgs());
    await BBOmnibarPushNotifications.connect(createTestConnectArgs());

    expect(registerScriptSpy).toHaveBeenCalledTimes(1);
  });

  it('should pass a function to get a token to notifications init', async () => {
    let tokenCallback: () => void;

    initSpy
      .and
      .callFake((args: { tokenCallback: typeof tokenCallback }) => tokenCallback = args.tokenCallback);

    createNotificationsClient();

    await BBOmnibarPushNotifications.connect(createTestConnectArgs());

    tokenCallback();

    expect(getTokenSpy).toHaveBeenCalled();
  });

  it('should pass updated notifications to notifications client', async () => {
    createNotificationsClient();

    await BBOmnibarPushNotifications.connect(createTestConnectArgs());

    const testNotifications = [
      {
        isRead: true,
        notificationId: '1'
      }
    ];

    BBOmnibarPushNotifications.updateNotifications(testNotifications);

    expect(updateNotificationsSpy).toHaveBeenCalledWith(testNotifications);
  });

  it('should destroy the notifications client on disconnect', async () => {
    createNotificationsClient();

    await BBOmnibarPushNotifications.connect(createTestConnectArgs());

    await BBOmnibarPushNotifications.disconnect();

    expect(destroySpy).toHaveBeenCalled();
  });

  it('should listen for push notifications if the required entitlement is in an array in the JWT', async () => {
    createNotificationsClient();

    getTokenSpy
      .and
      .returnValue(Promise.resolve(testTokenWithNotificationEntitlement));

    const args = createTestConnectArgs();
    args.svcId = 'fenxt';

    await BBOmnibarPushNotifications.connect(args);

    expect(addListenerSpy).toHaveBeenCalledWith(args.notificationsCallback);

    expect(toastContainerInitSpy).toHaveBeenCalledWith(
      {
        envId: args.envId,
        leId: args.leId,
        navigateCallback: args.handleNavigate,
        navigateUrlCallback: args.handleNavigateUrl,
        openMenuCallback: args.openPushNotificationsMenu,
        svcId: args.svcId,
        url: BBAuthInterop.getCurrentUrl()
      }
    );
  });

  it('should not connect to push notifications if the required entitlement is missing', async () => {
    createNotificationsClient();

    getTokenSpy
      .and
      .returnValue(Promise.resolve(testTokenWithoutNotificationEntitlement));

    const args = createTestConnectArgs();
    args.svcId = 'fenxt';

    await BBOmnibarPushNotifications.connect(args);

    expect(addListenerSpy).not.toHaveBeenCalled();
  });

  it('should disable push notifications for a given service ID when the user is logged out', async () => {
    createNotificationsClient();

    getTokenSpy
      .and
      .returnValue(Promise.reject('The user is not logged in'));

    const args = createTestConnectArgs();
    args.svcId = 'fenxt';

    await BBOmnibarPushNotifications.connect(args);

    const enabled = await BBOmnibarPushNotifications.pushNotificationsEnabled();

    expect(enabled).toBe(false);
  });

  it('should not error when disconnecting without connecting', async () => {
    await BBOmnibarPushNotifications.disconnect();
  });

  it('should disable push notifications when not connected', async () => {
    const enabled = await BBOmnibarPushNotifications.pushNotificationsEnabled();

    expect(enabled).toBe(false);
  });

  it('should listen for global config changes if vertical nav is enabled', async () => {
    createNotificationsClient();

    const args = createTestConnectArgs();
    args.showVerticalNav = true;

    await BBOmnibarPushNotifications.connect(args);

    expect(addCustomMessageListenerSpy).toHaveBeenCalledWith({
      callback: args.customMessageCallback,
      customMessageType: 'ui-config-global-settings-update'
    });
  });

  it('should respect the notification settings for a given service ID', async () => {
    await testSvcId('renxt', false, true);
    await testSvcId('fenxt', true, true);
    await testSvcId('skydev', false, true);
    await testSvcId('skydevhome', false, true);
    await testSvcId('marketplace', false, true);
    await testSvcId('skyux', false, true);
    await testSvcId('other', false, false);
    await testSvcId('faith', true, true);
    await testSvcId('tcs', true, true);
    await testSvcId('chrch', false, true);
    await testSvcId('merchservices', false, true);
    await testSvcId('gsrch', true, true);
  });

});
