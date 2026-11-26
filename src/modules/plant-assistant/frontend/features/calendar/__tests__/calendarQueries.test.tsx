import { fakeApi, ok, withProviders } from '#platform/frontend/testing';
import { renderHook, waitFor } from '@testing-library/react';
import type { ReactNode } from 'react';
import { describe, expect, it } from 'vitest';
import { useCalendarMonth } from '../index.ts';

const wrapper = ({ children }: { children: ReactNode }) => withProviders(children);

describe('useCalendarMonth', () => {
  it("should load today's month first, then the month asked for", async () => {
    // Given
    const api = fakeApi({
      'GET /api/m/plant-assistant/calendar': ok({
        today: '2026-11-20',
        month: '2026-11',
        weeks: [],
      }),
      'GET /api/m/plant-assistant/calendar?month=2026-12': ok({
        today: '2026-11-20',
        month: '2026-12',
        weeks: [],
      }),
    });

    const { result, rerender } = renderHook(({ month }) => useCalendarMonth(month), {
      wrapper,
      initialProps: { month: null as string | null },
    });

    await waitFor(() => {
      expect(result.current.data?.month).toBe('2026-11');
    });

    // When
    rerender({ month: '2026-12' });

    // Then
    await waitFor(() => {
      expect(result.current.data?.month).toBe('2026-12');
    });

    expect(api.calls).toHaveLength(2);
  });
});
