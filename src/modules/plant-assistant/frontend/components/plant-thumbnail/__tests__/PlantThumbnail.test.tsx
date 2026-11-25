import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { PlantThumbnail } from '../PlantThumbnail.tsx';

describe('PlantThumbnail', () => {
  it('should show a placeholder when the plant has no photo', () => {
    // When
    const { container } = render(<PlantThumbnail photoUrl={null} size="small" />);

    // Then
    expect(container.querySelector('img')).not.toBeInTheDocument();
    expect(container.querySelector('svg')).toBeInTheDocument();
  });

  it('should show the photo without text of its own when there is one', () => {
    // When
    const { container } = render(<PlantThumbnail photoUrl="/fern.jpg" size="large" />);

    // Then
    const image = container.querySelector('img');
    expect(image).toHaveAttribute('src', '/fern.jpg');
    expect(image).toHaveAttribute('alt', '');
  });

  it('should show a large photo in 4:3', () => {
    // When
    const { container } = render(<PlantThumbnail photoUrl="/fern.jpg" size="large" />);

    // Then
    expect(container.firstChild).toHaveClass('aspect-[4/3]', 'w-full');
  });

  it('should keep a large placeholder low', () => {
    // When
    const { container } = render(<PlantThumbnail photoUrl={null} size="large" />);

    // Then
    expect(container.firstChild).toHaveClass('h-28', 'w-full');
  });
});
