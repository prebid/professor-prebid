import * as React from "react";
import TreeView from '@mui/lab/TreeView';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import TreeItem from '@mui/lab/TreeItem';

const getTreeItemsFromData = (treeItems: TreeItemData) => {
  return Object.keys(treeItems).map((key: any) => {
    const treeItemData = treeItems[key];
    let children;
    if (typeof (treeItemData) === 'object') {
      children = getTreeItemsFromData(treeItemData);
    }
    return (
      <TreeItem key={key} nodeId={key} label={`${key}: ${children ? '' : treeItemData} `} children={children} />
    );
  });
};

const DataTreeView = ({ treeItems }: DataTreeViewProps) => {
  return (
    <TreeView defaultCollapseIcon={<ExpandMoreIcon />} defaultExpandIcon={<ChevronRightIcon />}>
      {getTreeItemsFromData(treeItems)}
    </TreeView>
  );
}
export default DataTreeView;

interface TreeItemData {
  [key: string]: any;
}

interface DataTreeViewProps {
  treeItems: TreeItemData[];
}