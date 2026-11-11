import type { RegisterModule } from '#platform/backend';

export const register: RegisterModule = ({ router, storage, currentUser, logger }) => {
  router.get('/', (req, res) => {
    const { count } = storage.prepare('SELECT COUNT(*) AS count FROM notes_items').get() as {
      count: number;
    };

    logger.info('listed');
    res.json({ user: currentUser(req).username, count });
  });
};
