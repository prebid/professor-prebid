import React, { useState } from 'react';
import { Box, IconButton, Tooltip, useTheme } from '@mui/material';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import CheckIcon from '@mui/icons-material/Check';

const getType = (value: any) => {
  if (value === null) return 'null';
  if (Array.isArray(value)) return 'array';
  return typeof value;
};

const JsonNode = ({ keyName, value, depth, collapsedDepth, isLast, indentWidth, collapseStringsAfterLength, sortKeys, isRoot }: any) => {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';

  const syntaxColors = {
    key: isDark ? '#9cdcfe' : '#0451a5',
    string: isDark ? '#ce9178' : '#a31515',
    number: isDark ? '#b5cea8' : '#098658',
    boolean: isDark ? '#569cd6' : '#0000ff',
    null: isDark ? '#569cd6' : '#0000ff',
    bracket: isDark ? '#d4d4d4' : '#333333',
  };

  const type = getType(value);
  const isComplex = type === 'object' || type === 'array';

  const isInitiallyCollapsed = typeof collapsedDepth === 'boolean' ? collapsedDepth : depth >= (collapsedDepth ?? 3);

  const [expanded, setExpanded] = useState(!isInitiallyCollapsed);

  const toggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    setExpanded(!expanded);
  };

  const indentPx = isRoot ? 0 : indentWidth * 8;
  const paddingLeft = `${indentPx}px`;

  const renderValue = () => {
    if (type === 'string') {
      let str = value as string;
      if (collapseStringsAfterLength && str.length > collapseStringsAfterLength) {
        str = str.substring(0, collapseStringsAfterLength) + '...';
      }
      return <span style={{ color: syntaxColors.string }}>"{str}"</span>;
    }
    if (type === 'number') {
      return <span style={{ color: syntaxColors.number }}>{value}</span>;
    }
    if (type === 'boolean') {
      return <span style={{ color: syntaxColors.boolean }}>{value ? 'true' : 'false'}</span>;
    }
    if (type === 'null') {
      return <span style={{ color: syntaxColors.null }}>null</span>;
    }
    return null;
  };

  if (!isComplex) {
    return (
      <div style={{ paddingLeft, lineHeight: '1.5', fontFamily: 'monospace' }}>
        {keyName !== undefined && <span style={{ color: syntaxColors.key }}>"{keyName}"</span>}
        {keyName !== undefined && <span style={{ color: syntaxColors.bracket }}>: </span>}
        {renderValue()}
        {!isLast && <span style={{ color: syntaxColors.bracket }}>,</span>}
      </div>
    );
  }

  const isArray = type === 'array';
  const openBracket = isArray ? '[' : '{';
  const closeBracket = isArray ? ']' : '}';

  let childrenEntries = isArray ? Array.from(value) : Object.entries(value);

  if (sortKeys && !isArray) {
    childrenEntries = (childrenEntries as [string, any][]).sort((a, b) => a[0].localeCompare(b[0]));
  }

  const isEmpty = childrenEntries.length === 0;

  return (
    <div style={{ paddingLeft, lineHeight: '1.5', fontFamily: 'monospace' }}>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          cursor: isEmpty ? 'default' : 'pointer',
          userSelect: 'none',
        }}
        onClick={isEmpty ? undefined : toggle}
      >
        <div
          style={{
            width: 16,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginLeft: isRoot ? 0 : -16,
          }}
        >
          {!isEmpty && (expanded ? <ExpandMoreIcon style={{ fontSize: 16, color: syntaxColors.bracket }} /> : <ChevronRightIcon style={{ fontSize: 16, color: syntaxColors.bracket }} />)}
        </div>

        {keyName !== undefined && <span style={{ color: syntaxColors.key }}>"{keyName}"</span>}
        {keyName !== undefined && <span style={{ color: syntaxColors.bracket }}>: </span>}
        <span style={{ color: syntaxColors.bracket }}>
          {openBracket}
          {!expanded && !isEmpty && ` ... ${closeBracket}${!isLast ? ',' : ''}`}
          {isEmpty && `${closeBracket}${!isLast ? ',' : ''}`}
        </span>
      </div>

      {expanded && !isEmpty && (
        <div>
          {isArray
            ? (childrenEntries as any[]).map((val, idx) => (
                <JsonNode
                  key={idx}
                  value={val}
                  depth={depth + 1}
                  collapsedDepth={collapsedDepth}
                  isLast={idx === childrenEntries.length - 1}
                  indentWidth={indentWidth}
                  collapseStringsAfterLength={collapseStringsAfterLength}
                  sortKeys={sortKeys}
                  isRoot={false}
                />
              ))
            : (childrenEntries as [string, any][]).map(([k, v], idx) => (
                <JsonNode
                  key={k}
                  keyName={k}
                  value={v}
                  depth={depth + 1}
                  collapsedDepth={collapsedDepth}
                  isLast={idx === childrenEntries.length - 1}
                  indentWidth={indentWidth}
                  collapseStringsAfterLength={collapseStringsAfterLength}
                  sortKeys={sortKeys}
                  isRoot={false}
                />
              ))}
          <div style={{ paddingLeft: isRoot ? '16px' : 0, color: syntaxColors.bracket }}>
            {closeBracket}
            {!isLast ? ',' : ''}
          </div>
        </div>
      )}
    </div>
  );
};

export interface IJSONViewerComponentProps {
  src: any;
  name?: string | false | null;
  collapsed?: number | boolean;
  displayObjectSize?: boolean;
  displayDataTypes?: boolean;
  sortKeys?: boolean;
  quotesOnKeys?: boolean;
  indentWidth?: number;
  collapseStringsAfterLength?: number | undefined;
  style?: React.CSSProperties;
}

const JSONViewerComponent = ({ src = null, name = null, collapsed = 3, displayObjectSize = false, displayDataTypes = false, sortKeys = false, indentWidth = 2, collapseStringsAfterLength = 100, style }: IJSONViewerComponentProps): JSX.Element => {
  const [copied, setCopied] = useState(false);
  const theme = useTheme();

  const isDark = theme.palette.mode === 'dark';
  const bgColor = isDark ? 'transparent' : 'transparent';

  const handleCopy = () => {
    try {
      navigator.clipboard.writeText(JSON.stringify(src, null, indentWidth));
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (e) {
      console.error('Failed to copy JSON', e);
    }
  };

  return (
    <Box
      style={{
        position: 'relative',
        fontSize: '12px',
        fontFamily: 'roboto, sans-serif',
        padding: '15px',
        backgroundColor: bgColor,
        borderRadius: '4px',
        overflowX: 'auto',
        ...style,
      }}
    >
      <Box style={{ position: 'absolute', top: 8, right: 8, zIndex: 1 }}>
        <Tooltip title={copied ? 'Copied!' : 'Copy JSON'}>
          <IconButton onClick={handleCopy} size="small" style={{ opacity: 0.7 }}>
            {copied ? <CheckIcon fontSize="small" color="success" /> : <ContentCopyIcon fontSize="small" />}
          </IconButton>
        </Tooltip>
      </Box>
      <Box style={{ paddingRight: 40, overflowX: 'auto', minWidth: 'fit-content' }}>
        <JsonNode
          keyName={name !== false && name !== null && name !== '' ? String(name) : undefined}
          value={src}
          depth={0}
          collapsedDepth={collapsed}
          isLast={true}
          indentWidth={indentWidth}
          collapseStringsAfterLength={collapseStringsAfterLength}
          sortKeys={sortKeys}
          isRoot={true}
        />
      </Box>
    </Box>
  );
};

export default JSONViewerComponent;
