export interface BBContextArgs {

  url?: string;

  leId?: string;

  leIdRequired?: boolean;

  envId?: string;

  envIdRequired?: boolean;

  svcId?: string;

  svcIdRequired?: boolean;

  invalidContextHandler?: () => {};

}
