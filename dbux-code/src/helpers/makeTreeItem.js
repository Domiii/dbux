import { TreeItem, TreeItemCollapsibleState } from 'vscode';
import map from 'lodash/map';
import isObject from 'lodash/isObject';
import isEmpty from 'lodash/isEmpty';
import isFunction from 'lodash/isFunction';
import isString from 'lodash/isString';
import isPlainObject from 'lodash/isPlainObject';
import size from 'lodash/size';

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
    if (Array.isArray(value) || isPlainObject(value)) {
      newItem.description += ` (${size(value)})`;
    }
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

function checkTreeItem(arg, ...otherArgs) {
  if (arg instanceof TreeItem) {
    if (otherArgs.some(Boolean)) {
      throw new Error(`makeTreeItem confusion: don't call makeTreeItem on the same thing multiple times with different arguments.`);
    }
    return true;
  }
  return false;
}

/**
 * NOTE: This creates a {@link TreeItem} right away, but its children function will be called lazily.
 * TODO: this should be the default, instead of makeTreeItem. Gotta rename and re-structure things.
 */
export function mkTreeItem(label, childrenFn, props) {
  return makeTreeItem(() => ({ label, children: childrenFn, props }));
}

/**
 * NOTE: this thing evolved in a somewhat bad way. Needs some proper clean-up without edge cases and
 * clear naming.
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
    // TODO: function or not should not lead to two different ways of interpreting the data...
    //  → its because functions were originally used to only handle nested TreeItems... its messy...
    label = (labelOrArrOrItem.name || '')
      .replace(/[_]/g, ' ')    // replace _ with spaces (looks prettier)
      .replace(/^bound /, ''); // functions created with `.bind()` are prefixed with "bound "
    labelOrArrOrItem = labelOrArrOrItem();

    if (checkTreeItem(labelOrArrOrItem, childrenRaw, itemProps)) {
      return labelOrArrOrItem;
    }

    ({
      children,
      props: itemProps
    } = labelOrArrOrItem);
    if (labelOrArrOrItem.label) {
      label = labelOrArrOrItem.label;
    }
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
    if (checkTreeItem(label, childrenRaw, itemProps)) {
      return label;
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

  let collapsibleState;
  const renderChildrenInline = !isFunction(children) && (!children || isEmpty(children));
  if (itemProps && 'collapsibleState' in itemProps) {
    collapsibleState = itemProps.collapsibleState;
  }
  else if (!renderChildrenInline) {
    collapsibleState = TreeItemCollapsibleState.Collapsed;
  }
  else {
    collapsibleState = TreeItemCollapsibleState.None;
  }

  label = ('' + label); // coerce to string (else it won't show up)

  if (renderChildrenInline && !isString(labelOrArrOrItem)) {
    if (children !== undefined) {
      label = keyValueLabel(label, children);
    }
  }
  item = new TreeItem(label, collapsibleState);
  item.collapsibleState = collapsibleState;

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
  if (Array.isArray(configs[0]) && configs.length === 1) {
    // eslint-disable-next-line prefer-destructuring
    configs = configs[0];
  }
  return configs.map(cfg => makeTreeItem(cfg));
}
