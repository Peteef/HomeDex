export const MAX_TILE_TITLE_LENGTH = 60;
export const MAX_TILE_DESCRIPTION_LENGTH = 140;
export const MAX_TILE_URL_LENGTH = 2048;

const WEB_PROTOCOLS = ['http:', 'https:'];

export const isWebUrl = (value: string): boolean =>
  URL.canParse(value) && WEB_PROTOCOLS.includes(new URL(value).protocol);
