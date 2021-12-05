// TODO: load automatically from BugsJs bug database
// NOTE: some bugs have multiple test files, or no test file at all
// see: https://github.com/BugsJS/express/releases?after=Bug-4-test
const configs = [
  {
    // https://github.com/trekhleb/javascript-algorithms/blob/master/src/algorithms/sorting/bubble-sort/__test__/BubbleSort.test.js
    id: 1,
    label: 'BubbleSort bug#1',
    testNamePattern: 'BubbleSort should sort array',
    patch: 'error1',
    testFilePaths: ['src/algorithms/sorting/bubble-sort/__test__/BubbleSort.test.js']
  },
  {
    id: 2,
    label: 'BubbleSort bug#2',
    testNamePattern: 'BubbleSort should sort array',
    testFilePaths: ['src/algorithms/sorting/bubble-sort/__test__/BubbleSort.test.js']
  },
  {
    id: 3,
    label: 'BinarySearch bug#1',
    // testNamePattern: 'BinarySearch',
    testFilePaths: ['src/algorithms/search/binary-search/__test__/binarySearch.test.js']
  },
  {
    id: 4,
    label: 'BinarySearch (ok)',
    // testNamePattern: 'BinarySearch',
    testFilePaths: ['src/algorithms/search/binary-search/__test__/binarySearch.test.js']
  }

  /**
   * TODO
   * * Tree DFS - https://github.com/trekhleb/javascript-algorithms/tree/master/src/algorithms/tree/depth-first-search
   *   * TODO: probably want to re-write basic version?
   *   * NOT_GOOD: useless, complex callbacks + complex mock-based testing (src/algorithms/tree/depth-first-search/depthFirstSearch.js)
   *     * weird argument: authors argues this project is for helping people learn, but then makes things unnecessarily complex?
   *   * vs. Graph DFS - https://github.com/trekhleb/javascript-algorithms/blob/master/src/algorithms/graph/depth-first-search/depthFirstSearch.js
   *     * NOTE: uses built-ins, such as `getNeighbors`
   * * 
   */

  /**
   * TODO?
   * * HashTable - https://github.com/trekhleb/javascript-algorithms/blob/9bb60fa72f9d146e931b4634764dff7aebc7c1a2/src/data-structures/hash-table/HashTable.js#L51
   *   * NOTE: focus on `get`, `set` and `hash`, `delete`
   * * BinarySearchTree - https://github.com/trekhleb/javascript-algorithms/blob/9bb60fa72f9d146e931b4634764dff7aebc7c1a2/src/data-structures/tree/binary-search-tree/BinarySearchTreeNode.js#L21
   *   * NOTE: focus on `find`, `insert`, `remove`
   * * InsertionSort - https://github.com/trekhleb/javascript-algorithms/blob/master/src/algorithms/sorting/insertion-sort/InsertionSort.js
   * * QuickSort - https://github.com/trekhleb/javascript-algorithms/blob/master/src/algorithms/sorting/quick-sort/QuickSortInPlace.js
   * * linked-list: reverseTraversal - https://github.com/trekhleb/javascript-algorithms/blob/master/src/algorithms/linked-list/reverse-traversal/reverseTraversal.js
   *   * NOTE: simplest example of **head recursion**
   * * k-means - https://github.com/trekhleb/javascript-algorithms/blob/master/src/algorithms/ml/k-means/kMeans.js
   * * Dijkstra - https://github.com/trekhleb/javascript-algorithms/blob/master/src/algorithms/graph/dijkstra/dijkstra.js
   *   * NOTE: uses PriorityQueue
   */
];

module.exports = configs;
