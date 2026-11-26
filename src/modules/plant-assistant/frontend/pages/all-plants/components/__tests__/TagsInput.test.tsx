import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import type { TagsInputProps } from '../TagsInput.tsx';
import { TagsInput } from '../TagsInput.tsx';

const renderInput = (props: Partial<TagsInputProps> = {}) => {
  const handlers = {
    onDraftChange: vi.fn(),
    onAdd: vi.fn(),
    onRemove: vi.fn(),
  };

  render(
    <TagsInput
      tags={['Living room', 'Shade']}
      draft="Bookcase"
      note={null}
      suggestions={['Bookcase', 'Kitchen']}
      {...handlers}
      {...props}
    />,
  );

  return handlers;
};

const field = () => screen.getByRole('combobox', { name: 'New tag' });

describe('TagsInput', () => {
  it('should show the added tags, each with its own remove button', () => {
    // When
    renderInput();

    // Then
    expect(screen.getByRole('group', { name: 'Tags' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Remove Living room' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Remove Shade' })).toBeInTheDocument();
  });

  it('should suggest the tags in use', () => {
    // When
    renderInput();

    // Then
    const suggestions = document.getElementById(field().getAttribute('list') ?? '');

    expect(
      [...(suggestions?.querySelectorAll('option') ?? [])].map((option) => option.value),
    ).toEqual(['Bookcase', 'Kitchen']);
  });

  it('should pass on what is typed', () => {
    // Given
    const { onDraftChange } = renderInput();

    // When
    fireEvent.change(field(), { target: { value: 'Bookcase 2' } });

    // Then
    expect(onDraftChange).toHaveBeenCalledWith('Bookcase 2');
  });

  it('should add the tag with the button', () => {
    // Given
    const { onAdd } = renderInput();

    // When
    fireEvent.click(screen.getByRole('button', { name: 'Add' }));

    // Then
    expect(onAdd).toHaveBeenCalledOnce();
  });

  it('should add the tag with Enter instead of submitting the form', () => {
    // Given
    const onSubmit = vi.fn();
    const onAdd = vi.fn();

    render(
      <form onSubmit={onSubmit}>
        <TagsInput
          tags={[]}
          draft="Bookcase"
          note={null}
          suggestions={[]}
          onDraftChange={vi.fn()}
          onAdd={onAdd}
          onRemove={vi.fn()}
        />
      </form>,
    );

    // When
    const notCancelled = fireEvent.keyDown(field(), { key: 'Enter' });

    // Then
    expect(onAdd).toHaveBeenCalledOnce();
    expect(notCancelled).toBe(false);
  });

  it('should remove a tag', () => {
    // Given
    const { onRemove } = renderInput();

    // When
    fireEvent.click(screen.getByRole('button', { name: 'Remove Shade' }));

    // Then
    expect(onRemove).toHaveBeenCalledWith('Shade');
  });

  it('should say why a tag was not added', () => {
    // When
    renderInput({ note: 'tagDuplicate' });

    // Then
    expect(screen.getByRole('status')).toHaveTextContent('This tag is already there.');
  });
});
