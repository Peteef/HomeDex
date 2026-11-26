import type { RegisterModule } from '#platform/backend';

const WAITING = 3;

export const register: RegisterModule = ({ setTileBadge }) => {
  setTileBadge(() => WAITING);
};
