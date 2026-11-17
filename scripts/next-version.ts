import semver from 'semver';
import { z } from 'zod';

// The version of a merge to master, for the release job in ci.yml: the last version tag bumped by
// the release:* labels of the pull requests merged since it. Prints the job's outputs: the version,
// and whether it becomes a GitHub Release, which only minor and major bumps do.
const USAGE = 'Usage: node scripts/next-version.ts <last version tag> <labels as a JSON array>';
const EXIT_FAILURE = 1;

const LABEL_BUMPS = [
  ['release:major', 'major'],
  ['release:minor', 'minor'],
] as const;

const DEFAULT_BUMP = 'patch';
const RELEASED_BUMPS: readonly Bump[] = ['major', 'minor'];

type Bump = 'major' | 'minor' | 'patch';

const labelsSchema = z.array(z.string());

const bumpOf = (labels: string[]): Bump =>
  LABEL_BUMPS.find(([label]) => labels.includes(label))?.[1] ?? DEFAULT_BUMP;

const nextVersion = (lastTag: string, bump: Bump): string => {
  const version = semver.inc(lastTag, bump);

  if (version === null) {
    throw new Error(`"${lastTag}" is not a version tag`);
  }

  return version;
};

const run = (): void => {
  const [lastTag, labelsJson, ...rest] = process.argv.slice(2);

  if (lastTag === undefined || labelsJson === undefined || rest.length > 0) {
    throw new Error(USAGE);
  }

  const bump = bumpOf(labelsSchema.parse(JSON.parse(labelsJson)));
  console.log(`version=${nextVersion(lastTag, bump)}`);
  console.log(`release=${String(RELEASED_BUMPS.includes(bump))}`);
};

try {
  run();
} catch (error) {
  console.error(`Next version: ${error instanceof Error ? error.message : String(error)}`);

  process.exitCode = EXIT_FAILURE;
}
