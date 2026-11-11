import type { ResourceKey } from 'i18next';
import type { ComponentType, LazyExoticComponent } from 'react';

export interface ModulePage {
  id: string;
  route: string;
  Page: LazyExoticComponent<ComponentType>;
}

export interface ModuleTranslation {
  namespace: string;
  language: string;
  messages: ResourceKey;
}
