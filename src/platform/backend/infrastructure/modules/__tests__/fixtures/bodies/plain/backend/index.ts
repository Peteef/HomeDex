import type { RegisterModule } from '#platform/backend';

export const register: RegisterModule = ({ router }) => {
  router.post('/', (req, res) => {
    res.json({ received: JSON.stringify(req.body).length });
  });
};
