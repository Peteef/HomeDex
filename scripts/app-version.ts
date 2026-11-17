import { execFileSync } from 'node:child_process';

// The version the UI is built with (vite.config.ts). CI sets APP_VERSION for releases and pull
// request previews; any other build is based on the last release tag in its history, so 1.4.1 plus
// local changes reads 1.4.1-dev. Without git or a release tag (as in a Docker build), it is 0.0.0-dev.
const TAG_PREFIX = 'v';
const RELEASE_TAGS = `${TAG_PREFIX}[0-9]*`;
const NO_RELEASE = '0.0.0';
const DEV_SUFFIX = '-dev';

const lastReleaseTag = (): string | null => {
  try {
    const tag = execFileSync('git', ['describe', '--tags', '--abbrev=0', '--match', RELEASE_TAGS], {
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

  const tag = lastReleaseTag();
  const base = tag === null ? NO_RELEASE : tag.slice(TAG_PREFIX.length);
  return `${base}${DEV_SUFFIX}`;
};
