import type { RegisterModule } from '#platform/backend';

export const register: RegisterModule = ({ router }) => {
  router.get('/', (_req, res) => {
    res.json({});
  });
};
