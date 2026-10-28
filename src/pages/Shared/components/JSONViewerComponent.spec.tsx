import React from 'react';
import { render } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import JSONViewerComponent from './JSONViewerComponent';

describe('JSONViewerComponent', () => {
  it('renders JSON viewer with provided object', () => {
    const testData = { key: 'value' };
    const { container } = render(<JSONViewerComponent src={testData} name="testJson" />);
    expect(container).toBeTruthy();
  });
});
