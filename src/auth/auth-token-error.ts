import { BBAuthTokenErrorCode } from './auth-token-error-code';

export interface BBAuthTokenError {
  code: BBAuthTokenErrorCode;

  message: string;
}
