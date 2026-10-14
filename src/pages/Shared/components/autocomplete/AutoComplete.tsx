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
          onQueryChange?.(`${beforeOperator}${operator}${key}:${val}`);
        } else {
          // Completing a key
          onQueryChange?.(`${beforeOperator}${operator}${val}:`);
        }
      } else {
        // No operator, handle single token
        const hasColon = input.includes(':');
        if (hasColon) {
          // Completing a value
          const colonIndex = input.indexOf(':');
          const key = input.slice(0, colonIndex);
          onQueryChange?.(`${key}:${val}`);
        } else {
          // Completing a key
          if (onPick) {
            onPick(`${val}:`);
          } else {
            onQueryChange?.(replaceLastToken(input, `${val}:`));
          }
        }
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
