import type Database from 'better-sqlite3';
import { beforeEach, describe, expect, it } from 'vitest';
import {
  createTestDatabase,
  createTestUser,
} from '../../../../infrastructure/__tests__/helpers.ts';
import { pinRepository } from '../pinRepository.ts';
import { tileRepository } from '../tileRepository.ts';
import type { LinkTileRecord, TileRepository } from '../tileRepository.ts';

const NOW = 1_000;
const LATER = 2_000;

const link: LinkTileRecord = {
  texts: { en: { title: 'Finances', description: null } },
  icon: 'wallet',
  url: 'https://docs.example.com/finances',
  scope: 'shared',
};

describe('tileRepository', () => {
  let db: Database.Database;
  let tiles: TileRepository;
  let ash: number;
  let misty: number;

  const userIdOf = (username: string): number =>
    (db.prepare('SELECT id FROM users WHERE username = ?').get(username) as { id: number }).id;

  const countOf = (table: string): number =>
    (db.prepare(`SELECT COUNT(*) AS n FROM ${table}`).get() as { n: number }).n;

  const moduleTile = (): unknown =>
    db.prepare("SELECT id, dex_no, icon, updated_at FROM tiles WHERE module_id = 'notes'").get();

  beforeEach(async () => {
    db = createTestDatabase();
    tiles = tileRepository(db);
    await createTestUser(db, 'ash');
    await createTestUser(db, 'misty');
    ash = userIdOf('ash');
    misty = userIdOf('misty');
  });

  describe('insertLink', () => {
    it('should return the new id and give Dex numbers in order when tiles are added', () => {
      // When
      const ids = [1, 2, 3].map(() => tiles.insertLink(link, ash, NOW));

      // Then
      const dexNumbers = ids.map((id) => tiles.findForUser(id, ash)?.dex_no);
      expect(dexNumbers).toEqual([1, 2, 3]);
    });

    it('should store the text of every language when several are given', () => {
      // Given
      const texts = {
        en: { title: 'Finances', description: 'Monthly spending' },
        pl: { title: 'Finanse', description: null },
      };

      // When
      const id = tiles.insertLink({ ...link, texts }, ash, NOW);

      // Then
      expect(tiles.findForUser(id, ash)?.texts).toEqual(texts);
    });
  });

  describe('syncModule', () => {
    it('should add a shared module tile with the next Dex number when the module is new', () => {
      // Given
      tiles.insertLink(link, ash, NOW);

      // When
      tiles.syncModule({ moduleId: 'notes', icon: 'notes' }, NOW);

      // Then
      const row = db.prepare("SELECT * FROM tiles WHERE module_id = 'notes'").get();

      expect(row).toMatchObject({
        dex_no: 2,
        kind: 'module',
        icon: 'notes',
        scope: 'shared',
        owner_id: null,
      });
    });

    it('should change nothing when the icon is the same', () => {
      // Given
      tiles.syncModule({ moduleId: 'notes', icon: 'notes' }, NOW);
      const before = moduleTile();

      // When
      tiles.syncModule({ moduleId: 'notes', icon: 'notes' }, LATER);

      // Then
      expect(moduleTile()).toEqual(before);
    });

    it('should update the icon and the update time and keep the id and Dex number when the icon changes', () => {
      // Given
      tiles.syncModule({ moduleId: 'notes', icon: 'notes' }, NOW);
      const before = moduleTile() as { id: number; dex_no: number };

      // When
      tiles.syncModule({ moduleId: 'notes', icon: 'cart' }, LATER);

      // Then
      expect(moduleTile()).toEqual({
        id: before.id,
        dex_no: before.dex_no,
        icon: 'cart',
        updated_at: LATER,
      });
    });
  });

  describe('findForUser', () => {
    it('should return a shared tile when another user asks for it', () => {
      // Given
      const id = tiles.insertLink(link, ash, NOW);

      // When
      const row = tiles.findForUser(id, misty);

      // Then
      expect(row?.id).toBe(id);
    });

    it('should return a personal tile only when its owner asks for it', () => {
      // Given
      const id = tiles.insertLink({ ...link, scope: 'personal' }, ash, NOW);

      // When
      const forOwner = tiles.findForUser(id, ash);
      const forOther = tiles.findForUser(id, misty);

      // Then
      expect(forOwner?.id).toBe(id);
      expect(forOther).toBeUndefined();
    });

    it('should report the pin of the asking user when another user pinned the tile', () => {
      // Given
      const id = tiles.insertLink(link, ash, NOW);
      pinRepository(db).pin(ash, id, NOW);

      // When
      const forAsh = tiles.findForUser(id, ash);
      const forMisty = tiles.findForUser(id, misty);

      // Then
      expect(forAsh?.pinned).toBe(1);
      expect(forMisty?.pinned).toBe(0);
    });

    it('should report the owner as archived when the owner is archived', () => {
      // Given
      const id = tiles.insertLink(link, ash, NOW);
      db.prepare('UPDATE users SET archived_at = ? WHERE id = ?').run(LATER, ash);

      // When
      const row = tiles.findForUser(id, misty);

      // Then
      expect(row?.owner_archived).toBe(1);
    });
  });

  describe('listForUser', () => {
    it('should put pinned tiles first and then sort by Dex number when some are pinned', () => {
      // Given
      const first = tiles.insertLink(link, ash, NOW);
      const second = tiles.insertLink(link, ash, NOW);
      const third = tiles.insertLink(link, ash, NOW);
      pinRepository(db).pin(ash, third, NOW);

      // When
      const ids = tiles.listForUser(ash).map((row) => row.id);

      // Then
      expect(ids).toEqual([third, first, second]);
    });

    it("should leave out other users' personal tiles and attach each tile's own texts when listing", () => {
      // Given
      const shared = tiles.insertLink(link, ash, NOW);

      const own = tiles.insertLink(
        { ...link, texts: { en: { title: 'Gym', description: null } }, scope: 'personal' },
        misty,
        NOW,
      );

      tiles.insertLink(
        { ...link, texts: { en: { title: 'Diary', description: null } }, scope: 'personal' },
        ash,
        NOW,
      );

      // When
      const rows = tiles.listForUser(misty);

      // Then
      expect(rows.map((row) => [row.id, row.texts])).toEqual([
        [shared, { en: { title: 'Finances', description: null } }],
        [own, { en: { title: 'Gym', description: null } }],
      ]);
    });
  });

  describe('updateLink', () => {
    it('should replace the icon, URL, scope and texts and drop a language that is no longer given', () => {
      // Given
      const id = tiles.insertLink(
        {
          ...link,
          texts: {
            en: { title: 'Finances', description: null },
            pl: { title: 'Finanse', description: null },
          },
          scope: 'personal',
        },
        ash,
        NOW,
      );

      // When
      tiles.updateLink(
        id,
        {
          texts: { en: { title: 'Budget', description: 'Monthly spending' } },
          icon: 'cart',
          url: 'https://docs.example.com/budget',
          scope: 'shared',
        },
        LATER,
      );

      // Then
      const row = tiles.findForUser(id, ash);
      expect(row?.texts).toEqual({ en: { title: 'Budget', description: 'Monthly spending' } });

      expect(row).toMatchObject({
        icon: 'cart',
        url: 'https://docs.example.com/budget',
        scope: 'shared',
        updated_at: LATER,
      });
    });
  });

  describe('delete', () => {
    it('should remove the tile with its texts and pins when the tile is deleted', () => {
      // Given
      const id = tiles.insertLink(link, ash, NOW);
      pinRepository(db).pin(ash, id, NOW);

      // When
      tiles.delete(id);

      // Then
      expect(countOf('tiles')).toBe(0);
      expect(countOf('tile_texts')).toBe(0);
      expect(countOf('pins')).toBe(0);
    });
  });
});
