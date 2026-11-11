import type Database from 'better-sqlite3';
import { beforeEach, describe, expect, it } from 'vitest';
import {
  createTestDatabase,
  TEST_PASSWORD,
  testServices,
} from '../../../infrastructure/__tests__/helpers.ts';
import type { NewLinkTile } from '../index.ts';
import { TileError, tilesService } from '../index.ts';
import type { TilesService } from '../index.ts';

const CREATED_AT = Date.UTC(2026, 0, 1);

const linkTile = (overrides: Partial<NewLinkTile> = {}): NewLinkTile => ({
  title: 'Budget',
  url: 'https://docs.example.com/budget',
  icon: 'wallet',
  scope: 'shared',
  ...overrides,
});

describe('tiles service', () => {
  let db: Database.Database;
  let tiles: TilesService;
  let ash: number;
  let misty: number;

  const titlesFor = (userId: number): string[] => tiles.list(userId).map(({ title }) => title);

  const tileError = (action: () => unknown): TileError => {
    try {
      action();
    } catch (error) {
      if (error instanceof TileError) {
        return error;
      }

      throw error;
    }

    throw new Error('Expected a TileError');
  };

  const insertModuleTile = (): number =>
    (
      db
        .prepare(
          `INSERT INTO tiles (dex_no, kind, title, icon, module_id, scope, created_at, updated_at)
           VALUES ((SELECT COALESCE(MAX(dex_no), 0) + 1 FROM tiles), 'module', 'Shopping list',
             'cart', 'shopping-list', 'shared', 0, 0)
           RETURNING id`,
        )
        .get() as { id: number }
    ).id;

  beforeEach(async () => {
    db = createTestDatabase();
    tiles = tilesService(db, { now: () => CREATED_AT });
    const { accounts } = testServices(db);
    ash = (await accounts.create('Ash', TEST_PASSWORD)).id;
    misty = (await accounts.create('Misty', TEST_PASSWORD)).id;
  });

  describe('create', () => {
    it('should create a link tile that its creator can edit', () => {
      // When
      const tile = tiles.create(ash, linkTile({ description: 'Monthly costs' }));

      // Then
      expect(tile).toEqual({
        id: expect.any(Number) as number,
        dexNo: 1,
        kind: 'link',
        title: 'Budget',
        description: 'Monthly costs',
        icon: 'wallet',
        url: 'https://docs.example.com/budget',
        moduleId: null,
        scope: 'shared',
        pinned: false,
        editable: true,
      });
    });

    it('should give each new tile the next Dex number', () => {
      // When
      const first = tiles.create(ash, linkTile());
      const second = tiles.create(misty, linkTile({ scope: 'personal' }));

      // Then
      expect([first.dexNo, second.dexNo]).toEqual([1, 2]);
    });

    it('should trim the title and store a blank description as null', () => {
      // When
      const tile = tiles.create(ash, linkTile({ title: '  Budget  ', description: '   ' }));

      // Then
      expect(tile.title).toBe('Budget');
      expect(tile.description).toBeNull();
    });

    it('should store a missing description as null', () => {
      // When
      const tile = tiles.create(ash, linkTile());

      // Then
      expect(tile.description).toBeNull();
    });

    it.each([
      'javascript:alert(1)',
      'file:///budget.xlsx',
      'ftp://files.example.com/budget',
      'not a url',
      '',
    ])('should reject the tile when the URL is %j', (url) => {
      // When
      const error = tileError(() => tiles.create(ash, linkTile({ url })));

      // Then
      expect(error.code).toBe('invalid');
      expect(error.message).toBe('URL must be a web address starting with http:// or https://');
    });

    it('should accept an http URL', () => {
      // When
      const tile = tiles.create(ash, linkTile({ url: 'http://nas.local:5000/files' }));

      // Then
      expect(tile.url).toBe('http://nas.local:5000/files');
    });

    it('should reject the tile when the URL is too long', () => {
      // When
      const error = tileError(() =>
        tiles.create(ash, linkTile({ url: `https://example.com/${'a'.repeat(2048)}` })),
      );

      // Then
      expect(error.message).toBe('URL must be at most 2048 characters');
    });

    it('should reject the tile when the icon is unknown', () => {
      // When
      const error = tileError(() => tiles.create(ash, linkTile({ icon: 'pikachu' })));

      // Then
      expect(error.code).toBe('invalid');
      expect(error.message).toBe('Unknown icon');
    });

    it('should reject the tile when the title is blank', () => {
      // When
      const error = tileError(() => tiles.create(ash, linkTile({ title: '   ' })));

      // Then
      expect(error.message).toBe('Title is required');
    });

    it('should reject the tile when the title is too long', () => {
      // When
      const error = tileError(() => tiles.create(ash, linkTile({ title: 'a'.repeat(61) })));

      // Then
      expect(error.message).toBe('Title must be at most 60 characters');
    });

    it('should reject the tile when the description is too long', () => {
      // When
      const error = tileError(() => tiles.create(ash, linkTile({ description: 'a'.repeat(141) })));

      // Then
      expect(error.message).toBe('Description must be at most 140 characters');
    });
  });

  describe('list', () => {
    it('should show shared tiles and only the own personal tiles', () => {
      // Given
      tiles.create(ash, linkTile({ title: 'Shared by Ash' }));
      tiles.create(ash, linkTile({ title: 'Ash only', scope: 'personal' }));
      tiles.create(misty, linkTile({ title: 'Misty only', scope: 'personal' }));

      // When / Then
      expect(titlesFor(ash)).toEqual(['Ash only', 'Shared by Ash']);
      expect(titlesFor(misty)).toEqual(['Misty only', 'Shared by Ash']);
    });

    it('should sort pinned tiles first, then by title ignoring case and accents', () => {
      // Given
      tiles.create(ash, linkTile({ title: 'banana' }));
      tiles.create(ash, linkTile({ title: 'Éclair' }));
      const cherry = tiles.create(ash, linkTile({ title: 'Cherry' }));
      tiles.create(ash, linkTile({ title: 'apple' }));
      const zucchini = tiles.create(ash, linkTile({ title: 'Zucchini' }));
      tiles.pin(ash, zucchini.id);
      tiles.pin(ash, cherry.id);

      // When / Then
      expect(titlesFor(ash)).toEqual(['Cherry', 'Zucchini', 'apple', 'banana', 'Éclair']);
    });

    it('should order tiles with the same title by Dex number', () => {
      // Given
      tiles.create(ash, linkTile({ title: 'Notes', icon: 'notes' }));
      tiles.create(ash, linkTile({ title: 'notes', icon: 'book' }));

      // When / Then
      expect(tiles.list(ash).map(({ dexNo }) => dexNo)).toEqual([1, 2]);
    });

    it('should mark only the tiles the user may change as editable', () => {
      // Given
      tiles.create(ash, linkTile({ title: 'From Ash' }));
      tiles.create(misty, linkTile({ title: 'From Misty' }));
      insertModuleTile();

      // When
      const editable = tiles.list(ash).map(({ title, editable }) => [title, editable]);

      // Then
      expect(editable).toEqual([
        ['From Ash', true],
        ['From Misty', false],
        ['Shopping list', false],
      ]);
    });

    it('should show module tiles to every user', () => {
      // Given
      insertModuleTile();

      // When
      const [tile] = tiles.list(misty);

      // Then
      expect(tile).toMatchObject({
        kind: 'module',
        moduleId: 'shopping-list',
        url: null,
        scope: 'shared',
      });
    });
  });

  describe('edit', () => {
    it('should change the given fields and keep the others', () => {
      // Given
      const tile = tiles.create(ash, linkTile({ description: 'Monthly costs' }));

      // When
      const edited = tiles.edit(ash, tile.id, { title: 'Finances', icon: 'bank' });

      // Then
      expect(edited).toMatchObject({
        title: 'Finances',
        icon: 'bank',
        description: 'Monthly costs',
        url: 'https://docs.example.com/budget',
        dexNo: tile.dexNo,
      });
    });

    it('should clear the description when it is set to null', () => {
      // Given
      const tile = tiles.create(ash, linkTile({ description: 'Monthly costs' }));

      // When
      const edited = tiles.edit(ash, tile.id, { description: null });

      // Then
      expect(edited.description).toBeNull();
    });

    it('should share the own personal tile', () => {
      // Given
      const tile = tiles.create(ash, linkTile({ scope: 'personal' }));

      // When
      const edited = tiles.edit(ash, tile.id, { scope: 'shared' });

      // Then
      expect(edited.scope).toBe('shared');
      expect(titlesFor(misty)).toEqual(['Budget']);
    });

    it('should reject making a shared tile personal', () => {
      // Given
      const tile = tiles.create(ash, linkTile());

      // When
      const error = tileError(() => tiles.edit(ash, tile.id, { scope: 'personal' }));

      // Then
      expect(error.code).toBe('invalid');
      expect(error.message).toBe('A shared tile cannot be made personal');
      expect(titlesFor(misty)).toEqual(['Budget']);
    });

    it('should validate the changes', () => {
      // Given
      const tile = tiles.create(ash, linkTile());

      // When
      const error = tileError(() => tiles.edit(ash, tile.id, { url: 'javascript:alert(1)' }));

      // Then
      expect(error.code).toBe('invalid');
      expect(tiles.list(ash)[0]?.url).toBe('https://docs.example.com/budget');
    });

    it('should forbid changing a shared tile of another user', () => {
      // Given
      const tile = tiles.create(ash, linkTile());

      // When
      const error = tileError(() => tiles.edit(misty, tile.id, { title: 'Mine now' }));

      // Then
      expect(error.code).toBe('forbidden');
      expect(titlesFor(ash)).toEqual(['Budget']);
    });

    it('should not find a personal tile of another user', () => {
      // Given
      const tile = tiles.create(ash, linkTile({ scope: 'personal' }));

      // When
      const error = tileError(() => tiles.edit(misty, tile.id, { title: 'Mine now' }));

      // Then
      expect(error.code).toBe('not_found');
    });

    it('should not find a tile that does not exist', () => {
      // When
      const error = tileError(() => tiles.edit(ash, 999, { title: 'Ghost' }));

      // Then
      expect(error.code).toBe('not_found');
    });

    it('should forbid changing a module tile', () => {
      // Given
      const id = insertModuleTile();

      // When
      const error = tileError(() => tiles.edit(ash, id, { title: 'Groceries' }));

      // Then
      expect(error.code).toBe('forbidden');
    });

    describe('when the creator is archived', () => {
      beforeEach(() => {
        tiles.create(ash, linkTile());
        tiles.create(ash, linkTile({ title: 'Diary', scope: 'personal' }));
        testServices(db).accounts.archive('Ash');
      });

      const sharedTileId = (): number => tiles.list(misty)[0]?.id ?? 0;

      it('should let anyone change the shared tile', () => {
        // When
        const edited = tiles.edit(misty, sharedTileId(), { title: 'Family budget' });

        // Then
        expect(edited).toMatchObject({ title: 'Family budget', editable: true });
      });

      it('should let anyone delete the shared tile', () => {
        // When
        tiles.remove(misty, sharedTileId());

        // Then
        expect(titlesFor(misty)).toEqual([]);
      });

      it('should lock the shared tile again when the creator is restored', () => {
        // When
        testServices(db).accounts.restore('Ash');

        // Then
        expect(tiles.list(misty)[0]?.editable).toBe(false);
      });

      it('should keep the personal tiles hidden', () => {
        // When / Then
        expect(titlesFor(misty)).toEqual(['Budget']);
      });
    });
  });

  describe('remove', () => {
    it('should delete the own tile with its pins', () => {
      // Given
      const tile = tiles.create(ash, linkTile());
      tiles.pin(misty, tile.id);

      // When
      tiles.remove(ash, tile.id);

      // Then
      expect(titlesFor(ash)).toEqual([]);
      expect(db.prepare('SELECT COUNT(*) AS n FROM pins').get()).toEqual({ n: 0 });
    });

    it('should forbid deleting a shared tile of another user', () => {
      // Given
      const tile = tiles.create(ash, linkTile());

      // When
      const error = tileError(() => {
        tiles.remove(misty, tile.id);
      });

      // Then
      expect(error.code).toBe('forbidden');
      expect(titlesFor(ash)).toEqual(['Budget']);
    });

    it('should not find a personal tile of another user', () => {
      // Given
      const tile = tiles.create(ash, linkTile({ scope: 'personal' }));

      // When
      const error = tileError(() => {
        tiles.remove(misty, tile.id);
      });

      // Then
      expect(error.code).toBe('not_found');
      expect(titlesFor(ash)).toEqual(['Budget']);
    });

    it('should forbid deleting a module tile', () => {
      // Given
      const id = insertModuleTile();

      // When
      const error = tileError(() => {
        tiles.remove(ash, id);
      });

      // Then
      expect(error.code).toBe('forbidden');
    });
  });

  describe('pin', () => {
    it('should pin a tile for the user only', () => {
      // Given
      const tile = tiles.create(ash, linkTile());

      // When
      tiles.pin(ash, tile.id);

      // Then
      expect(tiles.list(ash)[0]?.pinned).toBe(true);
      expect(tiles.list(misty)[0]?.pinned).toBe(false);
    });

    it('should keep the tile pinned when it is pinned twice', () => {
      // Given
      const tile = tiles.create(ash, linkTile());
      tiles.pin(ash, tile.id);

      // When
      tiles.pin(ash, tile.id);

      // Then
      expect(tiles.list(ash)[0]?.pinned).toBe(true);
    });

    it('should let a user pin a shared tile of another user', () => {
      // Given
      const tile = tiles.create(ash, linkTile());

      // When
      tiles.pin(misty, tile.id);

      // Then
      expect(tiles.list(misty)[0]?.pinned).toBe(true);
    });

    it('should not find a personal tile of another user', () => {
      // Given
      const tile = tiles.create(ash, linkTile({ scope: 'personal' }));

      // When
      const error = tileError(() => {
        tiles.pin(misty, tile.id);
      });

      // Then
      expect(error.code).toBe('not_found');
    });
  });

  describe('unpin', () => {
    it('should unpin the tile for the user only', () => {
      // Given
      const tile = tiles.create(ash, linkTile());
      tiles.pin(ash, tile.id);
      tiles.pin(misty, tile.id);

      // When
      tiles.unpin(ash, tile.id);

      // Then
      expect(tiles.list(ash)[0]?.pinned).toBe(false);
      expect(tiles.list(misty)[0]?.pinned).toBe(true);
    });

    it('should do nothing when the tile is not pinned', () => {
      // Given
      const tile = tiles.create(ash, linkTile());

      // When
      tiles.unpin(ash, tile.id);

      // Then
      expect(tiles.list(ash)[0]?.pinned).toBe(false);
    });

    it('should not find a personal tile of another user', () => {
      // Given
      const tile = tiles.create(ash, linkTile({ scope: 'personal' }));

      // When
      const error = tileError(() => {
        tiles.unpin(misty, tile.id);
      });

      // Then
      expect(error.code).toBe('not_found');
    });
  });
});
