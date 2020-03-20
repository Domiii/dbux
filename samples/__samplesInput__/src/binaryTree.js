import isString from 'lodash/isString';

export default function TreeNode(val) {
  this.val = val;
  this.left = this.right = null;
}

// https://leetcode.com/submissions/detail/258300839/
// https://leetcode.com/problems/trim-a-binary-search-tree/

/**
 * Takes (a string representation of or) a pre-order traversal array and returns a new tree for it.
 * You can find something similar on leetcode playground: https://leetcode.com/playground/new/binary-tree
 */
export function buildTree(input) {
  if (isString(input)) {
    input = JSON.parse(input);
  }
  const root = new TreeNode(input[0]);
  const nodeQueue = [root];
  let iInput = 1;

  for (let iQueue = 0; iInput < input.length; ++iQueue) {
    const node = nodeQueue[iQueue];

    // left
    let val = input[iInput++];
    if (val !== null) {
      nodeQueue.append(node.left = new TreeNode(val));
    }

    if (iInput >= input.length) {
      break;
    }

    // right
    val = input[iInput++];
    if (val !== null) {
      nodeQueue.append(node.right = new TreeNode(val));
    }
  }
  return root;
}