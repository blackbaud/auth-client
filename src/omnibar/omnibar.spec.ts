import { BBOmnibar } from './omnibar';
import { BBOmnibarExperimental } from './omnibar-experimental';

import { BBOmnibarScriptLoader } from './omnibar-script-loader';

describe('Omnibar', () => {

  let registerScriptSpy: jasmine.Spy;
  let fakeAuth: any;

  beforeAll(() => {
    registerScriptSpy = spyOn(
      BBOmnibarScriptLoader,
      'registerScript'
    ).and.callFake(() => {
      (window as any).BBAUTH = fakeAuth;

      return Promise.resolve();
    });
  });

  beforeEach(() => {
    registerScriptSpy.calls.reset();

    fakeAuth = {
      Omnibar: {
        load: (omnibarEl: any, config: any) => {
          config.afterLoad();
        }
      }
    };
  });

  afterEach(() => {
    registerScriptSpy.calls.reset();
  });

  it('should register the required JavaScript libraries', (done) => {
    BBOmnibar.load({
      serviceName: 'test'
    }).then(() => {
      expect(registerScriptSpy.calls.argsFor(0)).toEqual(
        ['https://cdnjs.cloudflare.com/ajax/libs/jquery/2.1.0/jquery.js']
      );

      expect(registerScriptSpy.calls.argsFor(1)).toEqual(
        ['https://cdnjs.cloudflare.com/ajax/libs/easyXDM/2.4.17.1/easyXDM.min.js']
      );

      expect(registerScriptSpy.calls.argsFor(2)).toEqual(
        ['https://signin.blackbaud.com/Omnibar.min.js']
      );

      done();
    });
  });

  it('should not register jQuery if a higher or equal version is already registered', (done) => {
    // defining a jQuery verion
    (window as any).jQuery = {
      fn: {
          jquery: '3.2.1'
        }
    };

    BBOmnibar.load({
      serviceName: 'test'
    }).then(() => {
      expect(registerScriptSpy.calls.argsFor(0)).toEqual(
        ['https://cdnjs.cloudflare.com/ajax/libs/easyXDM/2.4.17.1/easyXDM.min.js']
      );

      expect(registerScriptSpy.calls.argsFor(1)).toEqual(
        ['https://signin.blackbaud.com/Omnibar.min.js']
      );

      done();
    });
  });

  it('should add the required omnibar elements to the page', (done) => {
    BBOmnibar.load({
      serviceName: 'test'
    }).then(() => {
      expect(document.querySelectorAll('.bb-omnibar-height-padding')).not.toBeNull();

      done();
    });
  });

  it('should register jQuery if current version is less than the minimum version', (done) => {
    // defining a jQuery version
    (window as any).jQuery = {
      fn: {
          jquery: '1.10.0'
        }
    };

    BBOmnibar.load({
      serviceName: 'test'
    }).then(() => {
      expect(registerScriptSpy.calls.argsFor(0)).toEqual(
        ['https://cdnjs.cloudflare.com/ajax/libs/jquery/2.1.0/jquery.js']
      );

      expect(registerScriptSpy.calls.argsFor(1)).toEqual(
        ['https://cdnjs.cloudflare.com/ajax/libs/easyXDM/2.4.17.1/easyXDM.min.js']
      );

      expect(registerScriptSpy.calls.argsFor(2)).toEqual(
        ['https://signin.blackbaud.com/Omnibar.min.js']
      );

      done();
    });
  });

  it('should add the required omnibar elements to the page', (done) => {
    BBOmnibar.load({
      serviceName: 'test'
    }).then(() => {
      expect(document.querySelectorAll('.bb-omnibar-height-padding')).not.toBeNull();

      done();
    });
  });

  it('should pass the expected config to the base omnibar load method', (done) => {
    const omnibarLoadSpy = spyOn(fakeAuth.Omnibar, 'load').and.callThrough();

    BBOmnibar.load({
      serviceName: 'test'
    }).then(() => {
      expect(omnibarLoadSpy).toHaveBeenCalledWith(
        document.body.querySelector('[data-omnibar-el]'),
        {
          'afterLoad': jasmine.any(Function),
          'serviceName': 'test',
          'z-index': 1000
        }
      );

      done();
    });
  });

  it('should support an undefined config', (done) => {
    const omnibarLoadSpy = spyOn(fakeAuth.Omnibar, 'load').and.callThrough();

    BBOmnibar.load(undefined).then(() => {
      expect(omnibarLoadSpy).toHaveBeenCalledWith(
        document.body.querySelector('[data-omnibar-el]'),
        {
          'afterLoad': jasmine.any(Function),
          'z-index': 1000
        }
      );

      done();
    });
  });

  it('should load the exerimental omnibar is specified in the config', (done) => {
    const experimentalLoadSpy = spyOn(BBOmnibarExperimental, 'load')
      .and.callFake(() => {
        return Promise.resolve();
      });

    BBOmnibar.load({
      experimental: true
    }).then(() => {
      expect(experimentalLoadSpy).toHaveBeenCalled();
      expect(registerScriptSpy).not.toHaveBeenCalled();
      done();
    });
  });

});
