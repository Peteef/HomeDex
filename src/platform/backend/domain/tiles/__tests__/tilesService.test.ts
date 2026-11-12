import type Database from 'better-sqlite3';
import { beforeEach, describe, expect, it } from 'vitest';
import {
  createTestDatabase,
  TEST_PASSWORD,
  testServices,
} from '../../../infrastructure/__tests__/helpers.ts';
import type { NewLinkTile, TileEdit } from '../index.ts';
import { TileError, tilesService } from '../index.ts';
import type { TilesService } from '../index.ts';

const CREATED_AT = Date.UTC(2026, 0, 1);

const inEnglish = (title: string, description?: string | null): NewLinkTile['texts'] => ({
  en: description === undefined ? { title } : { title, description },
});

const linkTile = (overrides: Partial<NewLinkTile> = {}): NewLinkTile => ({
  texts: inEnglish('Budget'),
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

  const titlesFor = (userId: number): (string | undefined)[] =>
    tiles.list(userId).map(({ texts }) => texts.en?.title);

  const titleEdit = (title: string): TileEdit => ({ texts: inEnglish(title) });

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

  const SHOPPING_LIST = { moduleId: 'shopping-list', icon: 'cart' };

  const startWith = (enabledModuleIds: string[]): TilesService =>
    tilesService(db, { enabledModuleIds, now: () => CREATED_AT });

  const addModuleTile = (): number => {
    tiles.syncModuleTiles([SHOPPING_LIST]);
    return tiles.list(ash).find(({ moduleId }) => moduleId === 'shopping-list')?.id ?? 0;
  };

  beforeEach(async () => {
    db = createTestDatabase();
    tiles = startWith(['shopping-list']);
    const { accounts } = testServices(db);
    ash = (await accounts.create('Ash', TEST_PASSWORD)).id;
    misty = (await accounts.create('Misty', TEST_PASSWORD)).id;
  });

  describe('create', () => {
    it('should create a link tile that its creator can edit', () => {
      // When
      const tile = tiles.create(
        ash,
        linkTile({
          texts: {
            en: { title: 'Budget', description: 'Monthly costs' },
            pl: { title: 'Budżet', description: 'Miesięczne wydatki' },
          },
        }),
      );

      // Then
      expect(tile).toEqual({
        id: expect.any(Number) as number,
        dexNo: 1,
        kind: 'link',
        texts: {
          en: { title: 'Budget', description: 'Monthly costs' },
          pl: { title: 'Budżet', description: 'Miesięczne wydatki' },
        },
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

    it('should keep only the languages the text was written in', () => {
      // When
      const tile = tiles.create(ash, linkTile({ texts: { pl: { title: 'Budżet' } } }));

      // Then
      expect(tile.texts).toEqual({ pl: { title: 'Budżet', description: null } });
    });

    it('should trim the title and store a blank description as null', () => {
      // When
      const tile = tiles.create(ash, linkTile({ texts: inEnglish('  Budget  ', '   ') }));

      // Then
      expect(tile.texts).toEqual({ en: { title: 'Budget', description: null } });
    });

    it('should store a missing description as null', () => {
      // When
      const tile = tiles.create(ash, linkTile());

      // Then
      expect(tile.texts.en?.description).toBeNull();
    });

    it('should reject the tile when it has no text in any language', () => {
      // When
      const error = tileError(() => tiles.create(ash, linkTile({ texts: {} })));

      // Then
      expect(error.code).toBe('invalid');
      expect(error.message).toBe('A title in at least one language is required');
    });

    it('should reject the tile when a language is not supported', () => {
      // When
      const error = tileError(() =>
        tiles.create(
          ash,
          linkTile({ texts: { en: { title: 'Budget' }, de: { title: 'Budget' } } }),
        ),
      );

      // Then
      expect(error.code).toBe('invalid');
      expect(error.message).toBe('Unknown language');
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

    it('should reject the tile when the title of one language is blank', () => {
      // When
      const error = tileError(() =>
        tiles.create(ash, linkTile({ texts: { en: { title: 'Budget' }, pl: { title: '   ' } } })),
      );

      // Then
      expect(error.message).toBe('Title is required');
    });

    it('should reject the tile when the title is too long', () => {
      // When
      const error = tileError(() =>
        tiles.create(ash, linkTile({ texts: inEnglish('a'.repeat(61)) })),
      );

      // Then
      expect(error.message).toBe('Title must be at most 60 characters');
    });

    it('should reject the tile when the description is too long', () => {
      // When
      const error = tileError(() =>
        tiles.create(ash, linkTile({ texts: inEnglish('Budget', 'a'.repeat(141)) })),
      );

      // Then
      expect(error.message).toBe('Description must be at most 140 characters');
    });
  });

  describe('list', () => {
    it('should show shared tiles and only the own personal tiles', () => {
      // Given
      tiles.create(ash, linkTile({ texts: inEnglish('Shared by Ash') }));
      tiles.create(ash, linkTile({ texts: inEnglish('Ash only'), scope: 'personal' }));
      tiles.create(misty, linkTile({ texts: inEnglish('Misty only'), scope: 'personal' }));

      // When / Then
      expect(titlesFor(ash)).toEqual(['Shared by Ash', 'Ash only']);
      expect(titlesFor(misty)).toEqual(['Shared by Ash', 'Misty only']);
    });

    it('should list pinned tiles first, then by Dex number', () => {
      // Given
      tiles.create(ash, linkTile({ texts: inEnglish('Zucchini') }));
      const banana = tiles.create(ash, linkTile({ texts: inEnglish('banana') }));
      tiles.create(ash, linkTile({ texts: inEnglish('apple') }));
      const cherry = tiles.create(ash, linkTile({ texts: inEnglish('Cherry') }));
      tiles.pin(ash, cherry.id);
      tiles.pin(ash, banana.id);

      // When / Then
      expect(titlesFor(ash)).toEqual(['banana', 'Cherry', 'Zucchini', 'apple']);
    });

    it('should mark only the tiles the user may change as editable', () => {
      // Given
      tiles.create(ash, linkTile());
      tiles.create(misty, linkTile());
      addModuleTile();

      // When
      const editable = tiles.list(ash).map(({ dexNo, editable }) => [dexNo, editable]);

      // Then
      expect(editable).toEqual([
        [1, true],
        [2, false],
        [3, false],
      ]);
    });

    it('should show module tiles to every user, without text of their own', () => {
      // Given
      addModuleTile();

      // When
      const [tile] = tiles.list(misty);

      // Then
      expect(tile).toMatchObject({
        kind: 'module',
        texts: {},
        moduleId: 'shopping-list',
        url: null,
        scope: 'shared',
      });
    });
  });

  describe('when a module is not enabled', () => {
    let moduleTileId: number;

    beforeEach(() => {
      moduleTileId = addModuleTile();
      tiles.pin(ash, moduleTileId);
      tiles = startWith([]);
    });

    it('should hide its tile', () => {
      // When / Then
      expect(tiles.list(ash)).toEqual([]);
    });

    it('should show its tile again with the pin when the module is enabled again', () => {
      // When
      tiles = startWith(['shopping-list']);

      // Then
      expect(tiles.list(ash)).toMatchObject([{ id: moduleTileId, dexNo: 1, pinned: true }]);
    });

    it.each([
      [
        'pin',
        () => {
          tiles.pin(misty, moduleTileId);
        },
      ],
      [
        'unpin',
        () => {
          tiles.unpin(ash, moduleTileId);
        },
      ],
      ['edit', () => tiles.edit(ash, moduleTileId, { icon: 'star' })],
      [
        'remove',
        () => {
          tiles.remove(ash, moduleTileId);
        },
      ],
    ])('should not find its tile on %s', (_action, action) => {
      // When
      const error = tileError(action);

      // Then
      expect(error.code).toBe('not_found');
    });
  });

  describe('edit', () => {
    it('should change the given fields and keep the others', () => {
      // Given
      const tile = tiles.create(ash, linkTile({ texts: inEnglish('Budget', 'Monthly costs') }));

      // When
      const edited = tiles.edit(ash, tile.id, { icon: 'bank' });

      // Then
      expect(edited).toMatchObject({
        texts: { en: { title: 'Budget', description: 'Monthly costs' } },
        icon: 'bank',
        url: 'https://docs.example.com/budget',
        dexNo: tile.dexNo,
      });
    });

    it('should replace the text of every language', () => {
      // Given
      const tile = tiles.create(
        ash,
        linkTile({ texts: { en: { title: 'Budget' }, pl: { title: 'Budżet' } } }),
      );

      // When
      const edited = tiles.edit(ash, tile.id, {
        texts: { pl: { title: 'Finanse', description: 'Konta i rachunki' } },
      });

      // Then
      expect(edited.texts).toEqual({ pl: { title: 'Finanse', description: 'Konta i rachunki' } });
      expect(tiles.list(ash)[0]?.texts).toEqual(edited.texts);
    });

    it('should reject removing the text of every language', () => {
      // Given
      const tile = tiles.create(ash, linkTile());

      // When
      const error = tileError(() => tiles.edit(ash, tile.id, { texts: {} }));

      // Then
      expect(error.code).toBe('invalid');
      expect(titlesFor(ash)).toEqual(['Budget']);
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
      const error = tileError(() => tiles.edit(misty, tile.id, titleEdit('Mine now')));

      // Then
      expect(error.code).toBe('forbidden');
      expect(titlesFor(ash)).toEqual(['Budget']);
    });

    it('should not find a personal tile of another user', () => {
      // Given
      const tile = tiles.create(ash, linkTile({ scope: 'personal' }));

      // When
      const error = tileError(() => tiles.edit(misty, tile.id, titleEdit('Mine now')));

      // Then
      expect(error.code).toBe('not_found');
    });

    it('should not find a tile that does not exist', () => {
      // When
      const error = tileError(() => tiles.edit(ash, 999, titleEdit('Ghost')));

      // Then
      expect(error.code).toBe('not_found');
    });

    it('should forbid changing a module tile', () => {
      // Given
      const id = addModuleTile();

      // When
      const error = tileError(() => tiles.edit(ash, id, titleEdit('Groceries')));

      // Then
      expect(error.code).toBe('forbidden');
    });

    describe('when the creator is archived', () => {
      beforeEach(() => {
        tiles.create(ash, linkTile());
        tiles.create(ash, linkTile({ texts: inEnglish('Diary'), scope: 'personal' }));
        testServices(db).accounts.archive('Ash');
      });

      const sharedTileId = (): number => tiles.list(misty)[0]?.id ?? 0;

      it('should let anyone change the shared tile', () => {
        // When
        const edited = tiles.edit(misty, sharedTileId(), titleEdit('Family budget'));

        // Then
        expect(edited).toMatchObject({
          texts: { en: { title: 'Family budget' } },
          editable: true,
        });
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
    it('should delete the own tile with its texts and pins', () => {
      // Given
      const tile = tiles.create(ash, linkTile());
      tiles.pin(misty, tile.id);

      // When
      tiles.remove(ash, tile.id);

      // Then
      expect(titlesFor(ash)).toEqual([]);
      expect(db.prepare('SELECT COUNT(*) AS n FROM pins').get()).toEqual({ n: 0 });
      expect(db.prepare('SELECT COUNT(*) AS n FROM tile_texts').get()).toEqual({ n: 0 });
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
      const id = addModuleTile();

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

  describe('syncModuleTiles', () => {
    const moduleTiles = () =>
      tiles.list(ash).map(({ dexNo, kind, icon, moduleId, scope, texts }) => ({
        dexNo,
        kind,
        icon,
        moduleId,
        scope,
        texts,
      }));

    it('should add a shared module tile for each module with the next Dex numbers', () => {
      // Given
      tiles.create(ash, linkTile());
      tiles = startWith(['clock', 'notes']);

      // When
      tiles.syncModuleTiles([
        { moduleId: 'clock', icon: 'calendar' },
        { moduleId: 'notes', icon: 'notes' },
      ]);

      // Then
      expect(moduleTiles().slice(1)).toEqual([
        {
          dexNo: 2,
          kind: 'module',
          icon: 'calendar',
          moduleId: 'clock',
          scope: 'shared',
          texts: {},
        },
        {
          dexNo: 3,
          kind: 'module',
          icon: 'notes',
          moduleId: 'notes',
          scope: 'shared',
          texts: {},
        },
      ]);
    });

    it('should keep one tile with its Dex number and pins when a module is synced again', () => {
      // Given
      const id = addModuleTile();
      tiles.pin(misty, id);
      tiles.create(ash, linkTile());

      // When
      tiles.syncModuleTiles([SHOPPING_LIST]);

      // Then
      expect(tiles.list(misty).map(({ id, dexNo, pinned }) => [id, dexNo, pinned])).toEqual([
        [id, 1, true],
        [expect.any(Number), 2, false],
      ]);
    });

    it('should follow a changed icon of the manifest', () => {
      // Given
      addModuleTile();

      // When
      tiles.syncModuleTiles([{ moduleId: 'shopping-list', icon: 'star' }]);

      // Then
      expect(moduleTiles()).toMatchObject([{ dexNo: 1, icon: 'star' }]);
    });
  });
});
