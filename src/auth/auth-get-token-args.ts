export interface BBAuthGetTokenArgs {
  envId?: string;

  leId?: string;

  permissionScope?: string;

  forceNewToken?: boolean;

  disableRedirect?: boolean;

  svcId?: string;
}
