import { BBAuthNavigator } from './navigator';

describe('Navigator', () => {
  let navigateSpy: jasmine.Spy;

  beforeAll(() => {
    navigateSpy = spyOn(BBAuthNavigator, 'navigate');
  });

  afterEach(() => {
    navigateSpy.calls.reset();
  });

  it('should add signin redirect parameters to the signin URL\'s query string', () => {
    BBAuthNavigator.redirectToSignin({
      a: '=',
      b: '&'
    });

    expect(navigateSpy).toHaveBeenCalledWith(
      'https://signin.blackbaud.com/signin/?redirectUrl=' +
        encodeURIComponent(location.href) +
        '&a=%3D&b=%26'
    );
  });
});
