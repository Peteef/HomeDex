export const TILE_TITLE_MAX_LENGTH = 60;
export const TILE_DESCRIPTION_MAX_LENGTH = 140;
export const TILE_URL_MAX_LENGTH = 2048;

const WEB_PROTOCOLS = ['http:', 'https:'];

export const isWebUrl = (value: string): boolean =>
  URL.canParse(value) && WEB_PROTOCOLS.includes(new URL(value).protocol);
