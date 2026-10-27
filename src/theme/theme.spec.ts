import { describe, it, expect } from 'vitest';
import { theme } from './theme';

describe('theme', () => {
  it('creates theme with correct palette and breakpoints', () => {
    expect(theme.palette.primary.main).toBe('#438ED9');
    expect(theme.breakpoints.values.xs).toBe(220);
  });

  it('applies MuiGrid container style overrides when container is true', () => {
    const rootStyleFn = theme.components?.MuiGrid?.styleOverrides?.root as any;
    expect(rootStyleFn).toBeDefined();

    const containerResult = rootStyleFn({ ownerState: { container: true } });
    expect(containerResult).toEqual({ padding: '4px' });

    const nonContainerResult = rootStyleFn({ ownerState: { container: false } });
    expect(nonContainerResult).toEqual({});
  });
});
