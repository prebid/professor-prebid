import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { RenderKeyValueComponent } from './RenderKeyValueComponent';

describe('RenderKeyValueComponent', () => {
  it('returns null if value is empty or undefined', () => {
    const { container: c1 } = render(<RenderKeyValueComponent label="test" value={null} expanded={false} columns={[12, 6]} />);
    expect(c1.firstChild).toBeNull();

    const { container: c2 } = render(<RenderKeyValueComponent label="test" value={{}} expanded={false} columns={[12, 6]} />);
    expect(c2.firstChild).toBeNull();
  });

  it('renders primitive text values', () => {
    render(<RenderKeyValueComponent label="Status" value="Active" expanded={false} columns={[12, 6]} />);
    expect(screen.getByText(/Status:/)).toBeTruthy();
    expect(screen.getByText(/Active/)).toBeTruthy();
  });

  it('renders boolean values', () => {
    render(<RenderKeyValueComponent label="Enabled" value={true} expanded={true} columns={[12, 6]} />);
    expect(screen.getByText(/Enabled:/)).toBeTruthy();
    expect(screen.getByText(/true/)).toBeTruthy();
  });

  it('renders valid React element values', () => {
    render(<RenderKeyValueComponent label="Element" value={<span>Custom Element</span>} expanded={false} columns={[12, 6]} />);
    expect(screen.getByText('Custom Element')).toBeTruthy();
  });

  it('renders non-empty object using JSONViewerComponent', () => {
    const { container } = render(<RenderKeyValueComponent label="Config" value={{ key: 'val' }} expanded={false} columns={[12, 6]} />);
    expect(screen.getByText(/Config:/)).toBeTruthy();
    expect(container.querySelector('div')).toBeTruthy();
  });
});
