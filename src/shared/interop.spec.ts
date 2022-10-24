import { BBAuthInterop } from './interop';

describe('Interop', () => {
  function validateMethod(
    methodName:
      | 'messageIsFromOmnibar'
      | 'messageIsFromOmnibarVertical'
      | 'messageIsFromToastContainer',
    validSource: string
  ) {
    function validate(
      source: string,
      origin: string,
      expectedIsValid: boolean
    ) {
      const isValid = BBAuthInterop[methodName]({
        data: {
          source,
        },
        origin,
      });

      expect(isValid).toBe(expectedIsValid);
    }

    // Valid source, invalid origin
    validate(validSource, 'https://example.com', false);

    // Invalid source, valid origin
    validate('skyux-spa-foo', 'https://host.nxt.blackbaud.com', false);

    // Valid source, valid origin
    validate(validSource, 'https://host.nxt.blackbaud.com', true);
  }

  it('should validate that incoming messages originate from the omnibar', () => {
    validateMethod('messageIsFromOmnibar', 'skyux-spa-omnibar');
  });

  it('should validate that incoming messages originate from the vertical omnibar', () => {
    validateMethod(
      'messageIsFromOmnibarVertical',
      'skyux-spa-omnibar-vertical'
    );
  });

  it('should validate that incoming messages originate from the toast container', () => {
    validateMethod(
      'messageIsFromToastContainer',
      'skyux-spa-omnibar-toast-container'
    );
  });
});
