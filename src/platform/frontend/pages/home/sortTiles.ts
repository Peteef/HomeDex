export const sortTiles = <T extends { title: string }>(
  tiles: readonly T[],
  isPinned: (tile: T) => boolean,
): T[] => {
  return [...tiles].sort((a, b) => {
    const pinnedFirst = Number(isPinned(b)) - Number(isPinned(a));
    return pinnedFirst || a.title.localeCompare(b.title, undefined, { sensitivity: 'base' });
  });
};
