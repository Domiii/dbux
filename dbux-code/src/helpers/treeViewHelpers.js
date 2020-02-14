import { TreeItem, TreeItemCollapsibleState } from 'vscode';

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
    item.children = children.map(child => makeTreeItem(child));
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