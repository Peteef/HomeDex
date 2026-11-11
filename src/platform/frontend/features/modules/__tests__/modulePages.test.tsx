import { render, screen } from '@testing-library/react';
import { Suspense } from 'react';
import { describe, expect, it } from 'vitest';
import type { ModuleManifest } from '../../../../shared/manifest/manifestSchema.ts';
import { modulePages } from '../internal/modulePages.ts';

const manifestOf = (id: string, enabled = true): ModuleManifest => ({
  id,
  name: id,
  icon: 'star',
  route: `/m/${id}`,
  enabled,
});

const pageSaying = (text: string) => () => Promise.resolve({ default: () => <h1>{text}</h1> });

describe('modulePages', () => {
  it('should give each enabled module with a page its route', () => {
    // Given
    const manifests = {
      '/src/modules/notes/manifest.ts': manifestOf('notes'),
      '/src/modules/clock/manifest.ts': manifestOf('clock'),
    };

    const entries = {
      '/src/modules/notes/frontend/index.tsx': pageSaying('Notes'),
      '/src/modules/clock/frontend/index.tsx': pageSaying('Clock'),
    };

    // When
    const pages = modulePages(manifests, entries);

    // Then
    expect(pages.map(({ id }) => id)).toEqual(['notes', 'clock']);
    expect(pages.map(({ route }) => route)).toEqual(['/m/notes', '/m/clock']);
  });

  it('should leave out a disabled module', () => {
    // Given
    const manifests = { '/src/modules/notes/manifest.ts': manifestOf('notes', false) };
    const entries = { '/src/modules/notes/frontend/index.tsx': pageSaying('Notes') };

    // When / Then
    expect(modulePages(manifests, entries)).toEqual([]);
  });

  it('should leave out a module without a page', () => {
    // Given
    const manifests = { '/src/modules/notes/manifest.ts': manifestOf('notes') };

    // When / Then
    expect(modulePages(manifests, {})).toEqual([]);
  });

  it("should load a module's page when it is first rendered", async () => {
    // Given
    const [notes] = modulePages(
      { '/src/modules/notes/manifest.ts': manifestOf('notes') },
      { '/src/modules/notes/frontend/index.tsx': pageSaying('Notes') },
    );

    const Page = notes?.Page ?? (() => null);

    // When
    render(
      <Suspense fallback={<p>Loading</p>}>
        <Page />
      </Suspense>,
    );

    // Then
    expect(await screen.findByRole('heading', { name: 'Notes' })).toBeInTheDocument();
  });
});
