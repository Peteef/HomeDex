import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { AddItemForm } from '../AddItemForm.tsx';
import type { AddItemFormProps } from '../AddItemForm.tsx';

const renderForm = (overrides: Partial<AddItemFormProps> = {}) => {
  const props: AddItemFormProps = {
    adding: false,
    failed: false,
    onAdd: vi.fn(),
    ...overrides,
  };

  render(<AddItemForm {...props} />);
  return props;
};

const itemField = () => screen.getByRole('textbox', { name: 'Item' });
const amountField = () => screen.getByRole('textbox', { name: 'Amount (optional)' });

const type = (item: string, amount = '') => {
  fireEvent.change(itemField(), { target: { value: item } });
  fireEvent.change(amountField(), { target: { value: amount } });
};

const submit = () => {
  fireEvent.click(screen.getByRole('button', { name: 'Add' }));
};

describe('AddItemForm', () => {
  it('should add the item with its amount', () => {
    // Given
    const { onAdd } = renderForm();
    type('Milk', '2 l');

    // When
    submit();

    // Then
    expect(onAdd).toHaveBeenCalledWith({ text: 'Milk', amount: '2 l' }, expect.any(Function));
  });

  it('should leave out a blank amount', () => {
    // Given
    const { onAdd } = renderForm();
    type('Milk', '  ');

    // When
    submit();

    // Then
    expect(onAdd).toHaveBeenCalledWith({ text: 'Milk' }, expect.any(Function));
  });

  it('should add nothing when the item is blank', () => {
    // Given
    const { onAdd } = renderForm();
    type('   ', '2');

    // When
    submit();

    // Then
    expect(onAdd).not.toHaveBeenCalled();
  });

  it('should clear the form and focus the item once the item is added', () => {
    // Given
    const onAdd = vi.fn((_item: unknown, onAdded: () => void) => {
      onAdded();
    });

    renderForm({ onAdd });
    type('Milk', '2 l');

    // When
    submit();

    // Then
    expect(itemField()).toHaveValue('');
    expect(amountField()).toHaveValue('');
    expect(itemField()).toHaveFocus();
  });

  it('should keep what was typed until the item is added', () => {
    // Given
    renderForm();
    type('Milk', '2 l');

    // When
    submit();

    // Then
    expect(itemField()).toHaveValue('Milk');
    expect(amountField()).toHaveValue('2 l');
  });

  it('should disable adding while an item is being added', () => {
    // When
    renderForm({ adding: true });

    // Then
    expect(screen.getByRole('button', { name: 'Add' })).toBeDisabled();
  });

  it('should say so when adding failed', () => {
    // When
    renderForm({ failed: true });

    // Then
    expect(screen.getByRole('alert')).toHaveTextContent("Can't add the item. Try again.");
  });
});
