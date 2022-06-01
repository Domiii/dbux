import { TreeItem, TreeItemCollapsibleState } from 'vscode';
import map from 'lodash/map';
import isObject from 'lodash/isObject';
import isEmpty from 'lodash/isEmpty';
import isFunction from 'lodash/isFunction';
import isString from 'lodash/isString';

import { getPrettyFunctionName } from '@dbux/common/src/util/functionUtil';

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
  return arr.map((value, i) => makeNestedNode(i, value)); //makeTreeItem(child));
}

export function objectToTreeItems(obj) {
  return map(obj, (value, key) => makeNestedNode(key, value)
  );
}

function keyValueLabel(key, value) {
  return `${key}: ${JSON.stringify(value)}`;
}

export function makeNestedNode(key, value) {
  if (value instanceof TreeItem) {
    return value;
    // return makeTreeItem(value);
  }
  // if (Array.isArray(value)) {
  //   return makeTreeItem(key, value);
  // }
  if (isFunction(value)) {
    return makeTreeItem(value);
  }
  if (isObject(value)) { // implies isPlainObject, isArray, isFunction
    const newItem = makeTreeItem(key, value);
    newItem.description = value.constructor?.name || '';
    return newItem;
  }

  return makeTreeItem(keyValueLabel(key, value));
}

export function makeTreeChildren(children) {
  return Array.isArray(children) ?
    arrayToTreeItems(children) :    // array
    objectToTreeItems(children);    // object
}

/** ###########################################################################
 * {@link makeTreeItem}
 * ##########################################################################*/

// /**
//  * NOTE: use `{ myLabel: makeTreeItem('myLabel', ...) }` instead.
//  * future-work: use this, so as to not repeat `label`. 
//  */
// export function makeTreeChild(value, itemProps) {
// }

export function makeTreeItemNoChildren(labelOrArrOrItem, itemProps) {
  let label;
  let item;

  // if (isFunction(children)) {
  //   children = children();
  // }

  if (isFunction(labelOrArrOrItem)) {
    label = getPrettyFunctionName(labelOrArrOrItem);
    itemProps = labelOrArrOrItem();
  }
  else {
    if (Array.isArray(labelOrArrOrItem)) {
      // if (!labelOrArrOrItem.length || labelOrArrOrItem[0] instanceof TreeItem) {
      //   // NOTE: if there is only an array of children, we would be missing the label -> wrap in `makeTreeItem` instead
      //   /**
      //    * `children` is array of `TreeItem`.
      //    * Don't do anything: will be handled in {@link makeTreeChildren}
      //    */
      // }
      // else {
      // array represents a single node
      [label, itemProps] = labelOrArrOrItem;
      // }
    }
    else {
      label = labelOrArrOrItem;
    }
  }

  if (label instanceof TreeItem) {
    item = label;
  }
  else {
    label = ('' + label); // coerce to string (else it won't show up)
    item = new TreeItem(label);
  }

  if (itemProps) {
    Object.assign(item, itemProps);
  }
  return item;
}

/**
 * TODO: Replace this with `makeTreeViewItem`, rename this to `makeTreeItemSimple`.
 */
export default function makeTreeItem(labelOrArrOrItem, childrenRaw, itemProps) {
  let label;
  let item;
  let children;

  // future-work: this over-generalized function always has children -> will have to fix its use cases for this to work
  let maybeHasChildren = true;

  // if (isFunction(children)) {
  //   children = children();
  // }

  if (isFunction(labelOrArrOrItem)) {
    label = (labelOrArrOrItem.name || '')
      .replace(/[_]/g, ' ')    // replace _ with spaces (looks prettier)
      .replace(/^bound /, ''); // functions created with `.bind()` are prefixed with "bound "
    labelOrArrOrItem = labelOrArrOrItem();
    ({
      children,
      props: itemProps
    } = labelOrArrOrItem);
  }
  else {
    if (Array.isArray(labelOrArrOrItem)) {
      // if (!labelOrArrOrItem.length || labelOrArrOrItem[0] instanceof TreeItem) {
      //   // NOTE: if there is only an array of children, we would be missing the label -> wrap in `makeTreeItem` instead
      //   /**
      //    * `children` is array of `TreeItem`.
      //    * Don't do anything: will be handled in {@link makeTreeChildren}
      //    */
      // }
      // else {
      // array represents a single node
      [label, childrenRaw, itemProps] = labelOrArrOrItem;
      // }
    }
    else {
      label = labelOrArrOrItem;
    }

    if (Array.isArray(childrenRaw)) {
      children = childrenRaw;
    }
    else {
      if (isFunction(childrenRaw)) {
        // childrenRaw = childrenRaw();
      }
      // if (childrenOrCfg?.children && !itemProps && size(childrenOrCfg) <= 2) {
      //   // hackfix: since we allow arbitrary objects to also represent `children`, 
      //   //      we need to use heuristics to distinguish between config and unstructured.
      //   ({
      //     children,
      //     props: itemProps
      //   } = childrenOrCfg);
      // }
      // else {
      children = childrenRaw;
      // }
    }
  }

  const renderChildrenInline = !isFunction(children) && (!children || isEmpty(children));
  let collapsibleState;
  if (!renderChildrenInline) {
    collapsibleState = TreeItemCollapsibleState.Collapsed;
  }
  else {
    collapsibleState = TreeItemCollapsibleState.None;
  }

  if (label instanceof TreeItem) {
    item = label;
  }
  else {
    label = ('' + label); // coerce to string (else it won't show up)

    if (renderChildrenInline && !isString(labelOrArrOrItem)) {
      if (children !== undefined) {
        label = keyValueLabel(label, children);
      }
    }
    item = new TreeItem(label, collapsibleState);
  }

  if (!renderChildrenInline) {
    if (isFunction(children)) {
      /**
       * NOTE: this is handled in {@link BaseTreeViewNodeProvider#buildChildren}
       */
      item.buildChildren = children;
    }
    else {
      item.children = makeTreeChildren(children);
    }
  }
  else {
    // Nothing to do: already taken care of
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
