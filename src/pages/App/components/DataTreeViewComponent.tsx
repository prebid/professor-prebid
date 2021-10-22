import * as React from "react";
import TreeView from '@mui/lab/TreeView';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import TreeItem from '@mui/lab/TreeItem';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import { makeStyles } from '@mui/styles';

const useStyles = makeStyles({
  root: {
    '& .node::before': {
      content: ">",
      color: 'black',
      display: 'inline-block',
      marginRight: '5px'
    },
    '& .nested': {
      display: 'none'
    },
    '& .active': {
      display: 'block'
    }
  },
});

const isArray = (value: any) => Array.isArray(value);

const isPrimative = (value: any) => {
  return typeof (value) === 'string' || typeof (value) === 'number' || typeof (value) === 'boolean'
}

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
// export default DataTreeView;

const Tree = ({ json }: any) => {
  const classes = useStyles();

  const processObject = (object: any) => (
    object && Object.keys(object).map((key, index) => {
      return (
        <ListItem key={key + index}>
          {buildNode(key)}
          <List className="nested" dense={true}>
            {isPrimative(object[key]) ? buildLeaf(object[key]) : isArray(object[key]) ? loopArray(object[key]) : processObject(object[key])}
          </List>
        </ListItem>
      )
    })
  )

  const loopArray = (array: any[]) => (
    array.map((value, key) =>
      <div key={key}>
        {isPrimative(value) ? buildLeaf(value) : isArray(value) ? loopArray(value) : processObject(value)}
      </div>
    )
  )

  const buildNode = (key: string) => (
    <span className="node" onClick={(e) => { toggle(e) }}>
      {key}
    </span>
  )

  const buildLeaf = (value: string) => (
    <ListItem className="leaf">
      {String(value)}
    </ListItem>
  )

  const toggle = (event: any) => {
    event.target.parentElement.querySelector(".nested").classList.toggle("active");
    event.target.classList.toggle("node-down");
  }

  return <>
    <List dense={true} className={classes.root}>
      {processObject(json)}
    </List>
  </>
}

export default Tree;

interface TreeItemData {
  [key: string]: any;
}

interface DataTreeViewProps {
  treeItems: TreeItemData[];
}