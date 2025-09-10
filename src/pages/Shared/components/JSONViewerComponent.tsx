import React from 'react';
import ReactJson from '@uiw/react-json-view';

const JSONViewerComponent = ({
  src = null,
  name = '',
  collapsed = 3,
  displayObjectSize = false,
  displayDataTypes = false,
  sortKeys = false,
  // quotesOnKeys = false,
  indentWidth = 2,
  collapseStringsAfterLength = 100,
  style,
}: IJSONViewerComponentProps): JSX.Element => {
  return (
    <ReactJson
      value={src}
      keyName={String(name)}
      collapsed={collapsed}
      enableClipboard={true}
      displayObjectSize={displayObjectSize}
      displayDataTypes={displayDataTypes}
      objectSortKeys={sortKeys}
      // quotesOnKeys={quotesOnKeys}
      indentWidth={indentWidth}
      stringEllipsis={collapseStringsAfterLength}
      style={{ fontSize: '12px', fontFamily: 'roboto', padding: '15px', ...style }}
    />
  );
};

interface IJSONViewerComponentProps {
  src: Object;
  name?: string;
  collapsed?: number | boolean;
  displayObjectSize?: boolean;
  displayDataTypes?: boolean;
  sortKeys?: boolean;
  quotesOnKeys?: boolean;
  indentWidth?: number;
  collapseStringsAfterLength?: number | undefined;
  style?: Object;
}

export default JSONViewerComponent;
