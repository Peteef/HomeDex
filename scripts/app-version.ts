import { execFileSync } from 'node:child_process';

// The version the UI is built with (vite.config.ts). CI sets APP_VERSION for releases and pull
// request previews; any other build is based on the last version tag in its history, so 1.4.1 plus
// local changes reads 1.4.1-dev. Without git or a version tag (as in a Docker build), it is 0.0.0-dev.
const TAG_PREFIX = 'v';
const VERSION_TAGS = `${TAG_PREFIX}[0-9]*`;
const NO_VERSION = '0.0.0';
const DEV_SUFFIX = '-dev';

const lastVersionTag = (): string | null => {
  try {
    const tag = execFileSync('git', ['describe', '--tags', '--abbrev=0', '--match', VERSION_TAGS], {
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore'],
    });

    return tag.trim();
  } catch {
    return null;
  }
};

export const appVersion = (env: NodeJS.ProcessEnv = process.env): string => {
  if (env.APP_VERSION) {
    return env.APP_VERSION;
  }

  const tag = lastVersionTag();
  const base = tag === null ? NO_VERSION : tag.slice(TAG_PREFIX.length);
  return `${base}${DEV_SUFFIX}`;
};
