import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import TabPanel from './TabPanel';

describe('TabPanel', () => {
  it('renders children when value equals index', () => {
    render(
      <TabPanel value={0} index={0}>
        Panel Content
      </TabPanel>
    );
    expect(screen.getByText('Panel Content')).toBeTruthy();
  });

  it('hides content when value does not equal index', () => {
    render(
      <TabPanel value={1} index={0}>
        Panel Content
      </TabPanel>
    );
    expect(screen.queryByText('Panel Content')).toBeNull();
  });
});
