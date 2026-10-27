import React from 'react';
import { render, screen, act } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { BoxWithoutLabel, BoxWithLabel, BoxWithLabelAndExpandAndJsonView } from './BoxWithLabel';

describe('BoxWithLabel components', () => {
  it('renders BoxWithoutLabel', () => {
    render(
      <BoxWithoutLabel>
        <span>Child</span>
      </BoxWithoutLabel>
    );
    expect(screen.getByText('Child')).toBeTruthy();
  });

  it('renders BoxWithLabel', () => {
    render(
      <BoxWithLabel label="Label">
        <span>Child</span>
      </BoxWithLabel>
    );
    expect(screen.getByText('Label')).toBeTruthy();
    expect(screen.getByText('Child')).toBeTruthy();
  });

  it('renders BoxWithLabelAndExpandAndJsonView and toggles state', () => {
    render(
      <BoxWithLabelAndExpandAndJsonView label="Custom Label" input={{ a: 1 }} expanded={true}>
        {({ expanded, jsonView, input }) => (
          <div>
            <span>{`Expanded:${expanded}`}</span>
            <span>{`JsonView:${jsonView}`}</span>
            <span>{JSON.stringify(input)}</span>
          </div>
        )}
      </BoxWithLabelAndExpandAndJsonView>
    );

    expect(screen.getByText('Expanded:true')).toBeTruthy();
    expect(screen.getByText('JsonView:false')).toBeTruthy();

    const buttons = screen.getAllByRole('button');
    // Click JsonView toggle button
    act(() => {
      buttons[0].click();
    });
    expect(screen.getByText('JsonView:true')).toBeTruthy();

    // Click Expand toggle button
    act(() => {
      buttons[1].click();
    });
    expect(screen.getByText('Expanded:false')).toBeTruthy();
    expect(screen.getByText('JsonView:false')).toBeTruthy();
  });
});
