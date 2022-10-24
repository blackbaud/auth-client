type fnStub = (..._: unknown[]) => unknown;

interface Window {
  BBAUTH?: {
    Omnibar: {
      load(omnibarEl: HTMLElement, config: unknown): void;
    };
  };
  BBHELP?: {
    HelpWidget: {
      open: () => void;
    };
  };
  BBNotificationsClient?: {
    BBNotifications: {
      init: fnStub;
      addListener: fnStub;
      addCustomMessageListener: fnStub;
      destroy: fnStub;
      updateNotifications: fnStub;
    };
  };
  jQuery?:
    | fnStub
    | {
        fn: {
          jquery: string;
        };
      };
}
