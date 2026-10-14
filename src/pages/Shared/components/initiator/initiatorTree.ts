import { IClassifiedNetworkEntry } from './networkClassifier';

export interface INetworkTreeNode {
  id: string;
  entry: IClassifiedNetworkEntry;
  children: INetworkTreeNode[];
  relation: 'root' | 'redirect' | 'initiator';
  depth: number;
}

export const buildNetworkTree = (classifiedEntries: IClassifiedNetworkEntry[], rootFilter?: string): INetworkTreeNode[] => {
  if (!classifiedEntries || classifiedEntries.length === 0) return [];

  const entryMap = new Map<string, IClassifiedNetworkEntry>();
  const urlToEntries = new Map<string, IClassifiedNetworkEntry[]>();

  classifiedEntries.forEach((c) => {
    entryMap.set(c.entry.id, c);
    const list = urlToEntries.get(c.entry.url) || [];
    list.push(c);
    urlToEntries.set(c.entry.url, list);
  });

  const parentMap = new Map<string, { parentId: string; relation: 'redirect' | 'initiator' }>();

  classifiedEntries.forEach((current) => {
    if (current.entry.redirectURL) {
      const candidates = urlToEntries.get(current.entry.redirectURL) || [];
      const match = candidates.find((c) => c.entry.startedDateTime >= current.entry.startedDateTime && c.entry.id !== current.entry.id);
      if (match && !parentMap.has(match.entry.id)) {
        parentMap.set(match.entry.id, { parentId: current.entry.id, relation: 'redirect' });
      }
    }
  });

  classifiedEntries.forEach((current) => {
    if (parentMap.has(current.entry.id)) return;

    const initiatorUrl = current.entry.initiator?.url;
    if (initiatorUrl) {
      const candidates = urlToEntries.get(initiatorUrl) || [];
      const match = candidates.find((c) => c.entry.startedDateTime <= current.entry.startedDateTime && c.entry.id !== current.entry.id);
      if (match) {
        parentMap.set(current.entry.id, { parentId: match.entry.id, relation: 'initiator' });
        return;
      }
    }

    const stackFrames = current.entry.initiator?.stack?.callFrames;
    if (Array.isArray(stackFrames)) {
      for (const frame of stackFrames) {
        if (frame.url) {
          const candidates = urlToEntries.get(frame.url) || [];
          const match = candidates.find((c) => c.entry.startedDateTime <= current.entry.startedDateTime && c.entry.id !== current.entry.id);
          if (match) {
            parentMap.set(current.entry.id, { parentId: match.entry.id, relation: 'initiator' });
            break;
          }
        }
      }
    }
  });

  const nodeMap = new Map<string, INetworkTreeNode>();
  classifiedEntries.forEach((c) => {
    nodeMap.set(c.entry.id, {
      id: c.entry.id,
      entry: c,
      children: [],
      relation: 'root',
      depth: 0,
    });
  });

  const roots: INetworkTreeNode[] = [];

  const attachChildren = (parentId: string, childNode: INetworkTreeNode, relation: 'redirect' | 'initiator', currentDepth = 0) => {
    const parentNode = nodeMap.get(parentId);
    if (parentNode && parentNode.id !== childNode.id) {
      childNode.relation = relation;
      childNode.depth = currentDepth + 1;
      parentNode.children.push(childNode);

      childNode.children.forEach((grandChild) => {
        grandChild.depth = childNode.depth + 1;
      });
      return true;
    }
    return false;
  };

  classifiedEntries.forEach((c) => {
    const link = parentMap.get(c.entry.id);
    const node = nodeMap.get(c.entry.id)!;
    if (link) {
      const attached = attachChildren(link.parentId, node, link.relation);
      if (!attached) roots.push(node);
    } else {
      roots.push(node);
    }
  });

  if (rootFilter && rootFilter.trim().length > 0) {
    const filterLower = rootFilter.trim().toLowerCase();
    const matchingRoots: INetworkTreeNode[] = [];

    const searchSubtree = (node: INetworkTreeNode): boolean => {
      const match = node.entry.entry.url.toLowerCase().includes(filterLower) || node.entry.entry.host.toLowerCase().includes(filterLower) || node.entry.providerName.toLowerCase().includes(filterLower);
      if (match) {
        matchingRoots.push(node);
        return true;
      }
      for (const child of node.children) {
        if (searchSubtree(child)) return true;
      }
      return false;
    };

    roots.forEach((root) => searchSubtree(root));
    return matchingRoots;
  }

  return roots;
};
