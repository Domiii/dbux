import isString from 'lodash/isString';

function TreeNode(val) {
  this.val = val;
  this.left = this.right = null;
}

const nodeQueue = [];

function left(node, val) {
  nodeQueue.push(node.left = new TreeNode(val));
}

function right(node, val) {
  nodeQueue.push(node.right = new TreeNode(val));
}

function buildTree(input) {
  const root = new TreeNode(input[0]);
  nodeQueue.push(root);
  let iInput = 1;

  for (let iQueue = 0; iInput < input.length; ++iQueue) {
    const node = nodeQueue[iQueue];

    // left
    let val = input[iInput++];
    if (val !== null) {
      left(node, val);
    }

    if (iInput >= input.length) {
      break;
    }

    // right
    val = input[iInput++];
    if (val !== null) {
      right(node, val);
    }
  }
  return root;
}

function main() {
  buildTree([1, null, 3, 2, 4, null, 5, 6]);
}

main();
