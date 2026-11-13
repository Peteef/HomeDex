import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { TileDialog } from '../TileDialog.tsx';
import type { TileDialogProps } from '../TileDialog.tsx';

const renderDialog = (mode: TileDialogProps['mode']) => {
  render(
    <TileDialog
      open
      mode={mode}
      values={{
        texts: [{ language: 'en', title: '', description: '' }],
        url: '',
        icon: 'link',
        scope: 'personal',
      }}
      errors={{ titles: {} }}
      flags={{ en: '🇬🇧', pl: '🇵🇱' }}
      missingLanguages={['pl']}
      scopeLocked={false}
      saving={false}
      onClose={vi.fn()}
      onTextChange={vi.fn()}
      onAddLanguage={vi.fn()}
      onRemoveLanguage={vi.fn()}
      onUrlChange={vi.fn()}
      onIconChange={vi.fn()}
      onScopeChange={vi.fn()}
      onSubmit={vi.fn()}
    />,
  );
};

describe('TileDialog', () => {
  it('should be titled for adding a tile', () => {
    // When
    renderDialog('add');

    // Then
    expect(screen.getByRole('dialog', { name: 'Add tile' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Save' })).toBeInTheDocument();
  });

  it('should be titled for editing a tile', () => {
    // When
    renderDialog('edit');

    // Then
    expect(screen.getByRole('dialog', { name: 'Edit tile' })).toBeInTheDocument();
  });
});
