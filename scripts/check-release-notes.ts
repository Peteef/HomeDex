import { z } from 'zod';

// The release-notes check in release-labels.yml: a release:minor or release:major pull request
// opens a GitHub Release with its "## Release notes" section, so that section must be filled and
// start with a ### heading (docs/releases.md). Comments are ignored, as in release-highlights.yml.
// It also fails when a pull request carries more than one release:* label.
const USAGE =
  'Usage: node scripts/check-release-notes.ts <labels as a JSON array> <pull request body>';

const EXIT_FAILURE = 1;

const RELEASE_LABEL_PREFIX = 'release:';
const RELEASE_LABELS = ['release:minor', 'release:major'];
const SECTION_HEADING = '## Release notes';
const NOTES_HEADING = /^### \S/;
const COMMENT = /<!--.*?-->/gs;
const LEVEL_TWO_PREFIX = '## ';

const labelsSchema = z.array(z.string());

const releaseNotesOf = (body: string): string => {
  const lines = body.replace(COMMENT, '').split(/\r?\n/);
  const start = lines.findIndex((line) => line.trim() === SECTION_HEADING);

  if (start === -1) {
    return '';
  }

  const rest = lines.slice(start + 1);
  const end = rest.findIndex((line) => line.startsWith(LEVEL_TWO_PREFIX));
  return (end === -1 ? rest : rest.slice(0, end)).join('\n').trim();
};

const run = (): void => {
  const [labelsJson, body, ...rest] = process.argv.slice(2);

  if (labelsJson === undefined || body === undefined || rest.length > 0) {
    throw new Error(USAGE);
  }

  const labels = labelsSchema.parse(JSON.parse(labelsJson));
  const releaseLabels = labels.filter((label) => label.startsWith(RELEASE_LABEL_PREFIX));

  if (releaseLabels.length > 1) {
    throw new Error(`keep one release:* label and remove the others: ${releaseLabels.join(', ')}`);
  }

  if (!labels.some((label) => RELEASE_LABELS.includes(label))) {
    console.log('Not a minor or major release: no release notes needed.');
    return;
  }

  const notes = releaseNotesOf(body);

  if (notes === '') {
    throw new Error(`a minor or major release needs its "${SECTION_HEADING}" section filled`);
  }

  if (!NOTES_HEADING.test(notes)) {
    throw new Error(`the "${SECTION_HEADING}" section must start with a ### heading`);
  }

  console.log('Release notes found.');
};

try {
  run();
} catch (error) {
  console.error(`Release notes: ${error instanceof Error ? error.message : String(error)}`);
  console.error('See docs/releases.md for the format.');

  process.exitCode = EXIT_FAILURE;
}
