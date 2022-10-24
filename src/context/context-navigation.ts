//#region imports

import { BBContextEnvironment } from './context-environment';

import { BBContextLegalEntity } from './context-legal-entity';

//#endregion

export interface BBContextNavigation {
  environments: BBContextEnvironment[];

  legalEntities?: BBContextLegalEntity[];
}
