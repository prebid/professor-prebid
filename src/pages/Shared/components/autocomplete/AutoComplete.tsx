import { Autocomplete, TextField, Tooltip, IconButton, Paper } from '@mui/material';
import React, { useState } from 'react';
import HelpOutlineOutlinedIcon from '@mui/icons-material/HelpOutlineOutlined';
import { NUMERIC_FIELD_KEYS } from './utils';

type AutoCompleteProps = {
  query: string;
  onQueryChange: (v: string) => void;
  placeholder: string;
  fieldKeys: string[];
  options?: string[];
  onPick?: (opt: string) => void;
  onDownloadFilteredBids?: () => void;
};

export const AutoComplete = ({ query, onQueryChange, options, onPick, placeholder, fieldKeys }: AutoCompleteProps) => {
  const [selectedValue, setSelectedValue] = useState<string | null>(null);

  const getOptionsForQuery = () => {
    const input = query || '';
    // Split only on ' AND ' or ' OR ' (case-insensitive)
    const last = input.split(/\s+(and|or)\s+/i).pop() ?? '';
    const queryLastToken = last.toLowerCase();

    // If no query or query is an operator, show key suggestions
    if (['or', 'and'].includes(queryLastToken)) {
      console.log('Showing keyOnlyOptions because query is empty or an operator:', queryLastToken);
      return keyOnlyOptions;
    }

    const colon = queryLastToken.indexOf(':');

    // If no colon, show keys that match the input
    if (colon < 0) {
      console.log('Filtering keyOnlyOptions for keys starting with:', queryLastToken);
      return keyOnlyOptions.filter((key) => key.toLowerCase().startsWith(queryLastToken));
    }

    // If there's a colon, show values for that key
    const key = queryLastToken.slice(0, colon);
    const val = queryLastToken.slice(colon + 1);

    // Filter options to show only values for this key
    if (options && options.length) {
      const keyPrefix = `${key}:`;
      const filtered = options
        .filter((option) => String(option).toLowerCase().startsWith(keyPrefix))
        .map((option) => String(option).slice(keyPrefix.length)) // Remove the key: prefix
        .filter((value) => !val || value.toLowerCase().includes(val.toLowerCase()))
        .filter((s) => s); // Remove empty strings
      console.log('Filtering options for key prefix:', { keyPrefix, val, options, filtered, queryLastToken });
      return filtered;
    }
  };

  const keyOnlyOptions = (() => {
    const numericKeys = Array.from(NUMERIC_FIELD_KEYS);
    const allKeys = new Set([...fieldKeys, ...numericKeys]);
    return Array.from(allKeys).sort((a, b) => a.localeCompare(b));
  })();

  const localOptions = getOptionsForQuery();
  return (
    <Autocomplete
      disableClearable
      fullWidth
      freeSolo
      size="small"
      options={localOptions}
      value={selectedValue}
      inputValue={query}
      isOptionEqualToValue={(o, v) => o === v}
      filterOptions={(opts) => opts}
      onInputChange={(_e, val, reason) => {
        if (reason !== 'reset') {
          onQueryChange(val || '');
        }
      }}
      onChange={(_e, val, reason) => {
        if (reason === 'selectOption' && val != null) {
          const input = query;

          // Find the last occurrence of AND or OR
          const lastAndIndex = input.toLowerCase().lastIndexOf(' and ');
          const lastOrIndex = input.toLowerCase().lastIndexOf(' or ');
          const lastOperatorIndex = Math.max(lastAndIndex, lastOrIndex);

          if (lastOperatorIndex > -1) {
            // We have an AND or OR operator
            const beforeOperator = input.substring(0, lastOperatorIndex);
            const operator = lastAndIndex > lastOrIndex ? ' AND ' : ' OR ';
            const afterOperator = input.substring(lastOperatorIndex + operator.length).trim();

            // Check if we're completing a key or value
            if (afterOperator.includes(':')) {
              // Completing a value
              const colonIndex = afterOperator.indexOf(':');
              const key = afterOperator.slice(0, colonIndex);
              onQueryChange(`${beforeOperator}${operator}${key}:${val}`);
            } else {
              // Completing a key
              onQueryChange(`${beforeOperator}${operator}${val}:`);
            }
          } else {
            // No operator, handle as before
            const hasColon = input.includes(':');
            if (hasColon) {
              // Completing a value
              const colonIndex = input.indexOf(':');
              const key = input.slice(0, colonIndex);
              onQueryChange(`${key}:${val}`);
            } else {
              // Completing a key
              onPick?.(`${val}:`);
            }
          }
          setSelectedValue(null);
        } else {
          setSelectedValue(val as string | null);
        }
      }}
      renderInput={(params) => (
        <Paper sx={{ borderRadius: '4px', pb: '2px' }}>
          <TextField
            {...params}
            placeholder={placeholder}
            variant="standard"
            slotProps={{
              input: {
                ...params.InputProps,
                disableUnderline: true,
                endAdornment: (
                  <>
                    <Tooltip title={'Query tips: key:value · cpm>1 · size:300x250 · OR to combine. e.g., bidder:criteo cpm>=0.5 | mediatype:video OR bidder:appnexus'} arrow>
                      <IconButton size="small" tabIndex={-1} sx={{ mr: 0.5 }}>
                        <HelpOutlineOutlinedIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    {params.InputProps?.endAdornment}
                  </>
                ),
              },
            }}
          />
        </Paper>
      )}
    />
  );
};
