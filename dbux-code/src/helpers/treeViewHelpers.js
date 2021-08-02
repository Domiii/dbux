import { TreeItem, TreeItemCollapsibleState } from 'vscode';
import map from 'lodash/map';
import isObject from 'lodash/isObject';
import isEmpty from 'lodash/isEmpty';
import isFunction from 'lodash/isFunction';

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

// class TreeChildNode {
//   constructor(value, cfg) {
//     this.value = value;
//     this.cfg = cfg;
//   }
// }

function arrayToTreeItems(arr) {
  return arr.map((value, i) => makeChildNode(i, value)); //makeTreeItem(child));
}

function objectToTreeItems(obj) {
  return map(obj, (value, key) => makeChildNode(key, value)
  );
}

function keyValueLabel(key, value) {
  return `${key}: ${JSON.stringify(value)}`;
}

function makeChildNode(key, value) {
  if (value instanceof TreeItem) {
    return makeTreeItem(value);
  }
  // if (value instanceof TreeChildNode) {

  // }
  if (isFunction(value)) {
    return makeTreeItem(value(key));
  }
  return isObject(value) ?
    makeTreeItem(key, value) :  // open up objects recursively
    makeTreeItem(keyValueLabel(key, value));
}

export function makeTreeChildren(obj) {
  return Array.isArray(obj) ?
    arrayToTreeItems(obj) :    // array
    objectToTreeItems(obj);    // object
}

// /**
//  * NOTE: use `{ myLabel: makeTreeItem('myLabel', ...) }` instead.
//  * future-work: use this, so as to not repeat `label`. 
//  */
// export function makeTreeChild(value, itemProps) {
// }

export function makeTreeItem(labelOrArrOrItem, children, itemProps) {
  let label;
  let item;

  if (Array.isArray(labelOrArrOrItem)) {
    [label, children, itemProps] = labelOrArrOrItem;
  }
  else {
    label = labelOrArrOrItem;
  }

  const hasChildren = children && !isEmpty(children);
  let collapsibleState;
  if (hasChildren) {
    collapsibleState = TreeItemCollapsibleState.Expanded;
  }
  else {
    collapsibleState = TreeItemCollapsibleState.None;
  }

  if (label instanceof TreeItem) {
    item = label;
  }
  else {
    label = ('' + label); // coerce to string (else it won't show up)

    if (!hasChildren && children) {
      label = keyValueLabel(label, children);
    }
    item = new TreeItem(label, collapsibleState);
  }

  if (hasChildren) {
    item.children = makeTreeChildren(children);
  }
  if (itemProps) {
    Object.assign(item, itemProps);
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