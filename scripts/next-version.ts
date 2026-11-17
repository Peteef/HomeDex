import semver from 'semver';
import { z } from 'zod';

// The versions of merges to master, for the version job in ci.yml. Each merge bumps the version of
// the merge before it by its own release:* label, so a merge's version never depends on which CI
// run computes it. Prints the job's outputs: the version of the last merge, whether it becomes a
// GitHub Release (only minor and major bumps do), and every merge with its version.
const USAGE =
  'Usage: node scripts/next-version.ts <last version tag, empty for none> <merges as a JSON array>';

const EXIT_FAILURE = 1;
const FIRST_BASE = '0.0.0';

const LABEL_BUMPS = [
  ['release:major', 'major'],
  ['release:minor', 'minor'],
] as const;

const DEFAULT_BUMP = 'patch';
const RELEASED_BUMPS: readonly Bump[] = ['major', 'minor'];

type Bump = 'major' | 'minor' | 'patch';

interface VersionedMerge {
  sha: string;
  version: string;
  release: boolean;
}

const mergesSchema = z.array(
  z.object({
    sha: z.string(),
    labels: z.array(z.string()),
  }),
);

const bumpOf = (labels: string[]): Bump =>
  LABEL_BUMPS.find(([label]) => labels.includes(label))?.[1] ?? DEFAULT_BUMP;

const baseOf = (lastTag: string): string => {
  const base = lastTag === '' ? FIRST_BASE : semver.valid(lastTag);

  if (base === null) {
    throw new Error(`"${lastTag}" is not a version tag`);
  }

  return base;
};

const run = (): void => {
  const [lastTag, mergesJson, ...rest] = process.argv.slice(2);

  if (lastTag === undefined || mergesJson === undefined || rest.length > 0) {
    throw new Error(USAGE);
  }

  const versioned: VersionedMerge[] = [];
  let version = baseOf(lastTag);

  for (const { sha, labels } of mergesSchema.parse(JSON.parse(mergesJson))) {
    const bump = bumpOf(labels);
    version = semver.inc(version, bump) ?? version;
    versioned.push({ sha, version, release: RELEASED_BUMPS.includes(bump) });
  }

  const last = versioned.at(-1);

  if (last === undefined) {
    throw new Error('No merges to version');
  }

  console.log(`version=${last.version}`);
  console.log(`release=${String(last.release)}`);
  console.log(`merges=${JSON.stringify(versioned)}`);
};

try {
  run();
} catch (error) {
  console.error(`Next version: ${error instanceof Error ? error.message : String(error)}`);

  process.exitCode = EXIT_FAILURE;
}
