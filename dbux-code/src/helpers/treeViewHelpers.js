import { TreeItem, TreeItemCollapsibleState } from 'vscode';
import map from 'lodash/map';
import isObject from 'lodash/isObject';

/**
 * Use:
 * ```js
makeTreeItem('Debug', [
  [
    '1', [
      '1.1'
    ]
  ],
  [
    '2', [
      '2.1',
      [
        '2.2', [
          '2.2.1',
          '2.2.2'
        ]
      ],
      '2.3'
    ]
  ]
])
 * ```
 */

function arrayToTreeItems(arr) {
  return arr.map((value, i) => makeChildNode(i, value)); //makeTreeItem(child));
}

function objectToTreeItems(obj) {
  return map(obj, (value, key) => makeChildNode(key, value)
  );
}

function makeChildNode(key, value) {
  return isObject(value) ?
    makeTreeItem(key, value) :  // open up objects recursively
    makeTreeItem(`${key}: ${value}`);
}

export function makeTreeItem(labelOrArr, children, props) {
  let label;
  if (Array.isArray(labelOrArr)) {
    [label, children, props] = labelOrArr;
  }
  else {
    label = labelOrArr;
  }
  const item = new TreeItem('' + label);
  if (children) {
    item.collapsibleState = TreeItemCollapsibleState.Expanded;
    item.children = Array.isArray(children) ?
      arrayToTreeItems(children) :    // array
      objectToTreeItems(children);    // object
  }
  if (props) {
    Object.assign(item, props);
  }
  return item;
}

/**
 * 
 */
export function makeTreeItems(...configs) {
  return configs.map(cfg => makeTreeItem(cfg));
}

// TODO: add helpers for easily adding click handler to TreeItem (auto-register a command when needed)