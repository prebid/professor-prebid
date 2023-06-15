import React from 'react';
import ReactJson, { OnCopyProps } from 'react-json-view';

const JSONViewerComponent = ({
  src = null,
  name = false,
  collapsed = 3,
  displayObjectSize = false,
  displayDataTypes = false,
  sortKeys = false,
  quotesOnKeys = false,
  indentWidth = 2,
  collapseStringsAfterLength = 100,
  style,
}: IJSONViewerComponentProps): JSX.Element => {
  const handleCopy = (copy: OnCopyProps) => {
    navigator.clipboard.writeText(JSON.stringify(copy.src, null, '\t'));
  };
  return (
    <ReactJson
      src={src}
      name={name}
      collapsed={collapsed}
      enableClipboard={handleCopy}
      displayObjectSize={displayObjectSize}
      displayDataTypes={displayDataTypes}
      sortKeys={sortKeys}
      quotesOnKeys={quotesOnKeys}
      indentWidth={indentWidth}
      collapseStringsAfterLength={collapseStringsAfterLength}
      style={{ fontSize: '12px', fontFamily: 'roboto', padding: '15px', ...style }}
    />
  );
};

interface IJSONViewerComponentProps {
  src: Object;
  name?: string | false;
  collapsed?: number | boolean;
  displayObjectSize?: boolean;
  displayDataTypes?: boolean;
  sortKeys?: boolean;
  quotesOnKeys?: boolean;
  indentWidth?: number;
  collapseStringsAfterLength?: number | false;
  style?: Object;
}

export default JSONViewerComponent;
