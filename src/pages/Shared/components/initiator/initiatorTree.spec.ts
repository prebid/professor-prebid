import { describe, it, expect } from 'vitest';
import { buildNetworkTree } from './initiatorTree';
import { classifyRequest } from './networkClassifier';
import { IHarLogEntry } from '../../../Devtools/harLog';

describe('initiatorTree', () => {
  it('returns empty array when entries are empty', () => {
    expect(buildNetworkTree([])).toEqual([]);
  });

  it('builds flat root nodes when no relationships exist', () => {
    const e1: IHarLogEntry = {
      id: '1',
      url: 'https://a.com/pixel',
      host: 'a.com',
      pathname: '/pixel',
      method: 'GET',
      status: 200,
      startedDateTime: 1000,
      time: 10,
    };
    const e2: IHarLogEntry = {
      id: '2',
      url: 'https://b.com/bid',
      host: 'b.com',
      pathname: '/bid',
      method: 'POST',
      status: 200,
      startedDateTime: 1020,
      time: 15,
    };

    const classified = [classifyRequest(e1), classifyRequest(e2)];
    const tree = buildNetworkTree(classified);

    expect(tree.length).toBe(2);
    expect(tree[0].id).toBe('1');
    expect(tree[0].relation).toBe('root');
    expect(tree[0].children.length).toBe(0);
    expect(tree[1].id).toBe('2');
  });

  it('links HTTP redirects correctly', () => {
    const e1: IHarLogEntry = {
      id: '1',
      url: 'https://sync.example.com/start',
      host: 'sync.example.com',
      pathname: '/start',
      method: 'GET',
      status: 302,
      redirectURL: 'https://sync.example.com/dest',
      startedDateTime: 1000,
      time: 20,
    };
    const e2: IHarLogEntry = {
      id: '2',
      url: 'https://sync.example.com/dest',
      host: 'sync.example.com',
      pathname: '/dest',
      method: 'GET',
      status: 200,
      startedDateTime: 1025,
      time: 15,
    };

    const classified = [classifyRequest(e1), classifyRequest(e2)];
    const tree = buildNetworkTree(classified);

    expect(tree.length).toBe(1);
    expect(tree[0].id).toBe('1');
    expect(tree[0].children.length).toBe(1);
    expect(tree[0].children[0].id).toBe('2');
    expect(tree[0].children[0].relation).toBe('redirect');
    expect(tree[0].children[0].depth).toBe(1);
  });

  it('links JS Initiator stack frames correctly', () => {
    const e1: IHarLogEntry = {
      id: '1',
      url: 'https://cdn.example.com/prebid.js',
      host: 'cdn.example.com',
      pathname: '/prebid.js',
      method: 'GET',
      status: 200,
      startedDateTime: 1000,
      time: 50,
    };
    const e2: IHarLogEntry = {
      id: '2',
      url: 'https://bidder.com/openrtb',
      host: 'bidder.com',
      pathname: '/openrtb',
      method: 'POST',
      status: 200,
      startedDateTime: 1100,
      time: 100,
      initiator: {
        type: 'script',
        stack: {
          callFrames: [{ functionName: 'requestBids', scriptId: '1', url: 'https://cdn.example.com/prebid.js', lineNumber: 10, columnNumber: 5 }],
        },
      },
    };

    const classified = [classifyRequest(e1), classifyRequest(e2)];
    const tree = buildNetworkTree(classified);

    expect(tree.length).toBe(1);
    expect(tree[0].id).toBe('1');
    expect(tree[0].children.length).toBe(1);
    expect(tree[0].children[0].id).toBe('2');
    expect(tree[0].children[0].relation).toBe('initiator');
  });

  it('filters subtrees by rootFilter', () => {
    const e1: IHarLogEntry = {
      id: '1',
      url: 'https://a.com/sync',
      host: 'a.com',
      pathname: '/sync',
      method: 'GET',
      status: 200,
      startedDateTime: 1000,
      time: 10,
    };
    const e2: IHarLogEntry = {
      id: '2',
      url: 'https://b.com/bid',
      host: 'b.com',
      pathname: '/bid',
      method: 'POST',
      status: 200,
      startedDateTime: 1020,
      time: 15,
    };

    const classified = [classifyRequest(e1), classifyRequest(e2)];
    const filteredTree = buildNetworkTree(classified, 'a.com');

    expect(filteredTree.length).toBe(1);
    expect(filteredTree[0].id).toBe('1');
  });
});
