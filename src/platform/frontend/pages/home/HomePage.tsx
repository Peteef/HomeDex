import { LogOut } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import type { KeyboardEvent } from 'react';
import { useNavigate } from 'react-router';
import { IconButton } from '../../components/icon-button/IconButton.tsx';
import { LanguageSelect } from '../../components/language-select/LanguageSelect.tsx';
import { Panel } from '../../components/panel/Panel.tsx';
import { TextInput } from '../../components/text-input/TextInput.tsx';
import { Wordmark } from '../../components/wordmark/Wordmark.tsx';
import { useCurrentUser, useLogout } from '../../features/auth/index.ts';
import { displayText, sortTiles, useTiles, useTogglePin } from '../../features/tiles/index.ts';
import type { Tile } from '../../features/tiles/index.ts';
import { useLanguage, useText } from '../../lib/i18n/index.ts';
import type { Language } from '../../lib/i18n/index.ts';
import { modulePath } from '../../routes.ts';
import { TileList } from './components/TileList.tsx';
import type { TileEntry } from './components/TileList.tsx';
import { findTiles, isBlankQuery } from './quickFind.ts';

const FINE_POINTER = '(pointer: fine)';
const NEW_TAB = '_blank';
const NEW_TAB_FEATURES = 'noopener,noreferrer';

const toEntry = (tile: Tile, language: Language): TileEntry => {
  const { title, description } = displayText(tile, language);
  const external = tile.url !== null;

  return {
    id: tile.id,
    dexNo: tile.dexNo,
    icon: tile.icon,
    title,
    ...(description === null ? {} : { description }),
    href: tile.url ?? modulePath(tile.moduleId ?? ''),
    external,
    pinned: tile.pinned,
  };
};

export const HomePage = () => {
  const text = useText('home');
  const { username } = useCurrentUser();
  const { language, languages, change } = useLanguage();
  const logout = useLogout();
  const tiles = useTiles();
  const togglePin = useTogglePin();
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const searchRef = useRef<HTMLInputElement>(null);
  const searching = !isBlankQuery(query);

  useEffect(() => {
    if (window.matchMedia(FINE_POINTER).matches) {
      searchRef.current?.focus();
    }
  }, []);

  const found =
    tiles.data === undefined
      ? undefined
      : findTiles(sortTiles(tiles.data, language), query, language);

  const open = ({ href, external }: TileEntry): void => {
    if (external) {
      window.open(href, NEW_TAB, NEW_TAB_FEATURES);
    } else {
      void navigate(href);
    }
  };

  const openBestMatch = (): void => {
    const [best] = found ?? [];

    if (searching && best !== undefined) {
      open(toEntry(best, language));
    }
  };

  const onSearchKey = (event: KeyboardEvent<HTMLInputElement>): void => {
    if (event.key === 'Enter') {
      event.preventDefault();
      openBestMatch();
    } else if (event.key === 'Escape') {
      event.preventDefault();
      setQuery('');
    }
  };

  return (
    <Panel className="flex flex-col gap-4">
      <div className="flex items-center justify-between gap-3">
        <Wordmark />
        <div className="flex items-center gap-2">
          <LanguageSelect languages={languages} value={language} onChange={change} />
          <IconButton
            icon={<LogOut size={20} />}
            label={text.signOut}
            disabled={logout.isPending}
            onClick={() => {
              logout.mutate();
            }}
          />
        </div>
      </div>
      <h1 className="text-3xl font-extrabold">{text.greeting({ username })}</h1>
      <TextInput
        ref={searchRef}
        label={text.search.label}
        hideLabel
        placeholder={text.search.placeholder}
        type="search"
        enterKeyHint="go"
        value={query}
        onChange={(event) => {
          setQuery(event.target.value);
        }}
        onKeyDown={onSearchKey}
      />
      <h2 className="text-dex-ink-muted text-xs font-extrabold tracking-[0.2em] uppercase">
        {searching ? text.results : text.allEntries}
      </h2>
      <TileList
        entries={found?.map((tile) => toEntry(tile, language))}
        failed={tiles.isError && tiles.data === undefined}
        query={searching ? query.trim() : ''}
        onRetry={() => {
          void tiles.refetch();
        }}
        onTogglePin={({ id, pinned }) => {
          togglePin.mutate({ id, pinned: !pinned });
        }}
      />
    </Panel>
  );
};
