import type { ComponentType, LazyExoticComponent } from 'react';

export interface ModulePage {
  id: string;
  route: string;
  Page: LazyExoticComponent<ComponentType>;
}
