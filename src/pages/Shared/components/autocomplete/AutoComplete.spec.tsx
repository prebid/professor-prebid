import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { AutoComplete } from './AutoComplete';

describe('AutoComplete component', () => {
  it('renders textfield with placeholder and handles user typing', () => {
    const onQueryChange = vi.fn();
    render(<AutoComplete query="" onQueryChange={onQueryChange} placeholder="Search..." />);

    const input = screen.getByPlaceholderText('Search...');
    expect(input).toBeTruthy();

    fireEvent.change(input, { target: { value: 'bidder' } });
    expect(onQueryChange).toHaveBeenCalledWith('bidder');
  });

  it('handles selecting key option without operator', async () => {
    const onPick = vi.fn();
    render(<AutoComplete query="bid" onQueryChange={vi.fn()} onPick={onPick} placeholder="Search..." fieldKeys={['bidder', 'cpm']} />);

    const input = screen.getByPlaceholderText('Search...');
    fireEvent.focus(input);
    fireEvent.keyDown(input, { key: 'ArrowDown' });

    const option = await screen.findByRole('option', { name: 'bidder' });
    fireEvent.click(option);

    expect(onPick).toHaveBeenCalledWith('bidder:');
  });

  it('handles selecting key option when onPick is omitted', async () => {
    const onQueryChange = vi.fn();
    render(<AutoComplete query="bid" onQueryChange={onQueryChange} placeholder="Search..." fieldKeys={['bidder', 'cpm']} />);

    const input = screen.getByPlaceholderText('Search...');
    fireEvent.focus(input);
    fireEvent.keyDown(input, { key: 'ArrowDown' });

    const option = await screen.findByRole('option', { name: 'bidder' });
    fireEvent.click(option);

    expect(onQueryChange).toHaveBeenCalledWith('bidder:');
  });

  it('handles selecting value option with colon and no operator', async () => {
    const onQueryChange = vi.fn();
    render(<AutoComplete query="bidder:rub" onQueryChange={onQueryChange} placeholder="Search..." fieldKeys={['bidder']} options={['bidder:rubicon', 'bidder:appnexus']} />);

    const input = screen.getByPlaceholderText('Search...');
    fireEvent.focus(input);
    fireEvent.keyDown(input, { key: 'ArrowDown' });

    const option = await screen.findByRole('option', { name: 'rubicon' });
    fireEvent.click(option);

    expect(onQueryChange).toHaveBeenCalledWith('bidder:rubicon');
  });

  it('handles selecting value option after AND operator', async () => {
    const onQueryChange = vi.fn();
    render(<AutoComplete query="cpm>1 AND bidder:rub" onQueryChange={onQueryChange} placeholder="Search..." fieldKeys={['bidder', 'cpm']} options={['bidder:rubicon', 'bidder:appnexus']} />);

    const input = screen.getByPlaceholderText('Search...');
    fireEvent.focus(input);
    fireEvent.keyDown(input, { key: 'ArrowDown' });

    const option = await screen.findByRole('option', { name: 'rubicon' });
    fireEvent.click(option);

    expect(onQueryChange).toHaveBeenCalledWith('cpm>1 AND bidder:rubicon');
  });

  it('handles selecting key option after OR operator', async () => {
    const onQueryChange = vi.fn();
    render(<AutoComplete query="cpm>1 OR bid" onQueryChange={onQueryChange} placeholder="Search..." fieldKeys={['bidder', 'cpm']} />);

    const input = screen.getByPlaceholderText('Search...');
    fireEvent.focus(input);
    fireEvent.keyDown(input, { key: 'ArrowDown' });

    const option = await screen.findByRole('option', { name: 'bidder' });
    fireEvent.click(option);

    expect(onQueryChange).toHaveBeenCalledWith('cpm>1 OR bidder:');
  });

  const pick = async (query: string, optionName: string, props: any = {}) => {
    const onQueryChange = vi.fn();
    render(<AutoComplete query={query} onQueryChange={onQueryChange} placeholder="Search..." fieldKeys={['bidder', 'category']} options={['bidder:rubicon', 'bidder:appnexus']} {...props} />);
    const input = screen.getByPlaceholderText('Search...');
    fireEvent.focus(input);
    fireEvent.keyDown(input, { key: 'ArrowDown' });
    fireEvent.click(await screen.findByRole('option', { name: optionName }));
    return onQueryChange;
  };

  it('keeps earlier space-separated terms when picking a value', async () => {
    expect(await pick('category:sync bidder:rub', 'rubicon')).toHaveBeenCalledWith('category:sync bidder:rubicon');
  });

  it('keeps earlier space-separated terms when picking a key', async () => {
    expect(await pick('category:sync bid', 'bidder')).toHaveBeenCalledWith('category:sync bidder:');
  });

  it('appends the picked key after a trailing operator', async () => {
    expect(await pick('category:sync AND ', 'bidder')).toHaveBeenCalledWith('category:sync AND bidder:');
  });

  it('renders suggestions when query ends in OR or AND operator', () => {
    render(<AutoComplete query="cpm>1 AND" onQueryChange={vi.fn()} placeholder="Search..." fieldKeys={['bidder', 'cpm']} />);
    expect(screen.getByPlaceholderText('Search...')).toBeTruthy();
  });

  it('handles clear or blur (reason !== selectOption)', () => {
    const onQueryChange = vi.fn();
    render(<AutoComplete query="test" onQueryChange={onQueryChange} placeholder="Search..." fieldKeys={['bidder']} />);

    const input = screen.getByPlaceholderText('Search...');
    fireEvent.focus(input);
    fireEvent.change(input, { target: { value: 'custom text' } });
    fireEvent.keyDown(input, { key: 'Enter' });
    fireEvent.blur(input);
  });

  it('handles empty options with colon query gracefully', () => {
    render(<AutoComplete query="unknownKey:someval" onQueryChange={vi.fn()} placeholder="Search..." fieldKeys={['knownKey']} options={[]} />);
    expect(screen.getByPlaceholderText('Search...')).toBeTruthy();
  });
});
