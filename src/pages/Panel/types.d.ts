declare module '*.svg' {
  import * as React from 'react';

  const ReactComponent: React.FunctionComponent<React.SVGProps<SVGSVGElement> & { title?: string }>;

  export default ReactComponent;
}

declare module '*.png' {
  const value: any;
  export = value;
}

interface RouterLinkComponentProps {
  target: string;
  activeRoute: string;
  label: string;
  clickHandler: () => void;
  icon: OverridableComponent<SvgIconTypeMap<{}, 'svg'>> & {
    muiName: string;
  };
}

interface NavBarComponentProps {
  tabInfo?: any;
  pbjsNameSpace: string;
  handlePbjsNamespaceChange?: () => void;
  downloading?: 'true' | 'false' | 'error';
  refresh: () => void;
}

interface RoutesComponentProps {
  tabInfo: any;
  pbjsNameSpace: string;
}

interface NoPrebidCardComponentProps {
  refreshFun: MouseEventHandler<any>;
}
