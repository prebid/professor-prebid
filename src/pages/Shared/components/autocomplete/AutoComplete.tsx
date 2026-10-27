import { Autocomplete, TextField, Tooltip, IconButton, Paper, AutocompleteChangeReason, AutocompleteRenderInputParams } from '@mui/material';
import React, { useState } from 'react';
import HelpOutlineOutlinedIcon from '@mui/icons-material/HelpOutlineOutlined';
import { getAutocompleteOptions, replaceLastToken } from './utils';

type AutoCompleteProps = {
  query: string;
  onQueryChange: (v: string) => void;
  placeholder: string;
  fieldKeys?: string[];
  options?: string[];
  onPick?: (opt: string) => void;
  onDownloadFilteredBids?: () => void;
};

const getTooltipTitle = (fieldKeys: string[] = []) => {
  if (!fieldKeys || fieldKeys.length === 0) {
    return 'Query tips: Free text search or key:value · OR to combine';
  }
  const cleanKeys = fieldKeys.map((k) => k.replace(/:$/, ''));
  const sampleKey = cleanKeys[0] || 'key';
  const sampleSecondKey = cleanKeys[1];
  const hasNumeric = cleanKeys.some((k) => ['cpm', 'ttl', 'elapsedtime', 'width', 'height', 'timetorespond'].includes(k.toLowerCase()));
  const hasSize = cleanKeys.includes('size');

  const tips: string[] = ['key:value'];
  if (hasNumeric) {
    const numKey = cleanKeys.find((k) => ['cpm', 'elapsedtime', 'ttl'].includes(k.toLowerCase())) || 'cpm';
    tips.push(`${numKey}>1`);
  }
  if (hasSize) {
    tips.push('size:300x250');
  }
  tips.push('OR to combine');

  let example = `${sampleKey}:value`;
  if (sampleSecondKey) {
    example += ` OR ${sampleSecondKey}:value`;
  }

  return `Query tips: ${tips.join(' · ')}. e.g., ${example}`;
};

const renderInput = (params: AutocompleteRenderInputParams, placeholder: string, fieldKeys: string[] = []) => (
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
              <Tooltip title={getTooltipTitle(fieldKeys)} arrow>
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
);

export const AutoComplete = ({ query = '', onQueryChange, options = [], onPick, placeholder, fieldKeys = [] }: AutoCompleteProps) => {
  const [selectedValue, setSelectedValue] = useState<string | null>(null);

  const onChange = (_event: React.SyntheticEvent<Element, Event>, val: string, reason: AutocompleteChangeReason) => {
    if (reason === 'selectOption' && val != null) {
      const input = query || '';
      // Suggestions come from the last whitespace-separated term (getAutocompleteOptions), so a pick replaces only that term.
      const tokens = input.trim().split(/\s+/);
      const lastToken = tokens[tokens.length - 1] || '';
      const colonIndex = lastToken.indexOf(':');

      if (['and', 'or'].includes(lastToken.toLowerCase())) {
        // The query ends with an operator: start a new term with the picked key
        onQueryChange?.(`${input.trimEnd()} ${val}:`);
      } else if (colonIndex > -1) {
        // Completing a value: keep the last term's key
        onQueryChange?.(replaceLastToken(input, `${lastToken.slice(0, colonIndex)}:${val}`));
      } else if (onPick) {
        // Completing a key
        onPick(`${val}:`);
      } else {
        onQueryChange?.(replaceLastToken(input, `${val}:`));
      }
      setSelectedValue(null);
    } else {
      setSelectedValue(val as string | null);
    }
  };

  const localOptions = getAutocompleteOptions(query, fieldKeys, options);

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
      onInputChange={(_event, val, reason) => reason !== 'reset' && onQueryChange?.(val || '')}
      onChange={onChange}
      renderInput={(params) => renderInput(params, placeholder, fieldKeys)}
    />
  );
};
