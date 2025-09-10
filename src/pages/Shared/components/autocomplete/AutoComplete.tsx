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

  const keyOnlyOptions = (() => {
    const numericKeys = Array.from(NUMERIC_FIELD_KEYS);
    const allKeys = [...fieldKeys, ...numericKeys];
    return allKeys;
  })();

  const getOptionsForQuery = () => {
    const input = query || '';
    const last = input.split(/\s+/).pop() ?? '';
    const q = last.toLowerCase();

    // If no query or query is an operator, show key suggestions
    if (!q || ['or', 'and'].includes(q)) {
      return keyOnlyOptions;
    }

    const colon = q.indexOf(':');

    // If no colon, show keys that match the input
    if (colon < 0) {
      return keyOnlyOptions.filter((key) => key.toLowerCase().startsWith(q));
    }

    // If there's a colon, show values for that key
    const key = q.slice(0, colon);
    const val = q.slice(colon + 1);

    // Filter options to show only values for this key
    if (options && options.length) {
      const keyPrefix = `${key}:`;
      return options
        .filter((o) => String(o).toLowerCase().startsWith(keyPrefix))
        .map((o) => String(o).slice(keyPrefix.length)) // Remove the key: prefix
        .filter((value) => !val || value.toLowerCase().includes(val.toLowerCase()));
    }

    return [];
  };

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
          const tokens = query.split(/\s+/).filter((t) => t.length > 0);
          const lastToken = tokens[tokens.length - 1]?.toLowerCase() || '';
          const prevToken = tokens[tokens.length - 2]?.toLowerCase() || '';
          const endsWithSpace = query.endsWith(' ');

          // Check for operators or trailing space
          if (lastToken === 'or' || lastToken === 'and' || prevToken === 'or' || prevToken === 'and' || endsWithSpace) {
            // If we have an operator or space, append the selection
            const separator = endsWithSpace ? '' : ' ';

            // Check if we're completing a key (no colon in last token)
            const hasColon = lastToken.includes(':');
            if (!hasColon && !endsWithSpace) {
              // Adding a key, append with colon
              onQueryChange(`${query}${separator}${val}:`);
            } else {
              // Adding a value or after space
              onQueryChange(`${query}${separator}${val}`);
            }
          } else {
            // Handle the last token replacement
            const hasColon = lastToken.includes(':');
            if (hasColon) {
              // We're completing a value for a key:value pair
              const colonIndex = lastToken.indexOf(':');
              const key = lastToken.slice(0, colonIndex);
              const newQuery = tokens
                .slice(0, -1)
                .concat([`${key}:${val}`])
                .join(' ');
              onQueryChange(newQuery);
            } else {
              // We're selecting a key, replace with key:
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
