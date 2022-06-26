module.exports = {
  chapters: [
    {
      group: "uncategorized",
      name: "best-time-to-buy-sell-stocks",
      success: true,
      inputConnected: "All",
      gallery: {
        ddgSamples: [
          {
            exerciseName: "accumulatorBestTimeToBuySellStocks should find the best time to buy and sell stocks@accumulatorBestTimeToBuySellStocks.test.js",
            ddgTitle: "accumulatorBestTimeToBuySellStocks([10,1,5,20,15,21], ƒ mockConstructor)"
          },
          {
            exerciseName: "accumulatorBestTimeToBuySellStocks should find the best time to buy and sell stocks@accumulatorBestTimeToBuySellStocks.test.js",
            ddgTitle: "accumulatorBestTimeToBuySellStocks([7,1,5,3,6,4], ƒ mockConstructor)"
          }
        ]
      },
      tags: [
        "out-of-memory"
      ]
    },
    {
      group: "graph",
      name: "articulation-points",
      success: false,
      failedReason: "reduce",
      tags: [
        "missing-data"
      ]
    },
    {
      group: "uncategorized",
      name: "jump-game",
      success: false,
      failedReason: "control",
      inputConnected: "0",
      gallery: {
        ddgSamples: [
          {
            exerciseName: "greedyJumpGame should solve Jump Game problem in greedy manner@greedyJumpGame.test.js",
            ddgTitle: "greedyJumpGame([1,5,2,1,0,2,0])"
          },
          {
            exerciseName: "dpBottomUpJumpGame should solve Jump Game problem in bottom-up dynamic programming manner@dpBottomUpJumpGame.test.js",
            ddgTitle: "dpBottomUpJumpGame([1,5,2,1,0,2,0])",
          }
        ]
      },
      tags: [
        "control"
      ]
    },
    {
      group: "graph",
      name: "bellman-ford",
      success: true,
      inputConnected: "All",
      gallery: {
        ddgSamples: [
          {
            exerciseName: "bellmanFord should find minimum paths to all vertices for directed graph with negative edge weights@bellmanFord.test.js",
            ddgTitle: "bellmanFord({vertices,edges,isDirected}, {value,edges})"
          },
          {
            exerciseName: "bellmanFord should find minimum paths to all vertices for undirected graph@bellmanFord.test.js",
            ddgTitle: "bellmanFord({vertices,edges,isDirected}, {value,edges})"
          }
        ]
      },
    },
    {
      group: "sets",
      name: "maximum-subarray",
      success: false,
      failedReason: "control",
      inputConnected: "All",
      gallery: {
        ddgSamples: [
          {
            exerciseName: "bfMaximumSubarray should find maximum subarray using the brute force algorithm@bfMaximumSubarray.test.js",
            ddgTitle: "bfMaximumSubarray([-2,-3,4,-1,-2,1,5,-3])"
          },
          {
            exerciseName: "dpMaximumSubarray should find maximum subarray using the dynamic programming algorithm@dpMaximumSubarray.test.js",
            ddgTitle: "dpMaximumSubarray([-2,-3,4,-1,-2,1,5,-3])"
          }
        ]
      },
      tags: [
        "control",
        "connected"
      ]
    },
    {
      group: "uncategorized",
      name: "rain-terraces",
      success: true,
      inputConnected: "All",
      gallery: {
        ddgSamples: [
          {
            exerciseName: "bfRainTerraces should find the amount of water collected after raining@bfRainTerraces.test.js",
            ddgTitle: "bfRainTerraces([0,1,0,2,1,0,1,3,2,1,2,1])"
          },
          {
            exerciseName: "bfRainTerraces should find the amount of water collected after raining@bfRainTerraces.test.js",
            ddgTitle: "bfRainTerraces([0,2,4,3,4,2,4,0,8,7,0])"
          }
        ]
      },
    },
    {
      group: "graph",
      name: "travelling-salesman",
      success: false,
      failedReason: "includes",
      tags: [
        "missing-data"
      ]
    },
    {
      group: "search",
      name: "binary-search",
      success: true,
      inputConnected: "0",
      gallery: {
        ddgSamples: [
          {
            exerciseName: "binarySearch should search number in sorted array@binarySearch.test.js",
            ddgTitle: "binarySearch([1,5,10,12,14,17,22,100], 17)"
          },
          {
            exerciseName: "binarySearch should search number in sorted array@binarySearch.test.js",
            ddgTitle: "binarySearch([1,5,10,12,14,17,22,100], 100)"
          }
        ]
      },
    },
    {
      group: "math",
      name: "bits",
      success: true,
      inputConnected: "All",
      gallery: {
        ddgSamples: [
          {
            exerciseName: "fullAdder should add up two numbers@fullAdder.test.js",
            ddgTitle: "fullAdder(2, 0)"
          },
          {
            exerciseName: "multiply should multiply two numbers@multiply.test.js",
            ddgTitle: "multiply(1, 2)"
          }
        ]
      },
    },
    {
      group: "math",
      name: "binary-floating-point",
      runFailed: true,
      failedReason: "instrumentation",
      tags: [
        "instrumentation"
      ]
    },
    {
      group: "sets",
      name: "power-set",
      runFailed: true,
      crash: true,
      success: false,
      failedReason: "TODO",
      inputConnected: "TODO",
      gallery: {
        ddgSamples: [
          {
            exerciseName: "TODO",
            ddgTitle: "TODO"
          },
          {
            exerciseName: "TODO",
            ddgTitle: "TODO"
          }
        ]
      },
      rerun: true
    },
    {
      group: "uncategorized",
      name: "unique-paths",
      success: false,
      failedReason: "bug todo: watch return node is not shown",
      inputConnected: "0",
      outOfMemory: true,
      gallery: {
        ddgSamples: [
          {
            exerciseName: "uniquePaths should find the number of unique paths on board@uniquePaths.test.js",
            ddgTitle: "uniquePaths(10, 10)"
          },
          {
            exerciseName: "dpUniquePaths should find the number of unique paths on board@dpUniquePaths.test.js",
            ddgTitle: "uniquePaths(10, 10)"
          }
        ]
      },
      tags: [
        "watch-hidden"
      ]
    },
    {
      group: "sorting",
      name: "bubble-sort",
      success: true,
      inputConnected: "All",
      gallery: {
        ddgSamples: [
          {
            exerciseName: "BubbleSort should sort array@BubbleSort.test.js",
            ddgTitle: "BubbleSort.sort([3,4,2,1,0,0,4,3,4,2])"
          },
          {
            exerciseName: "BubbleSort should sort negative numbers@BubbleSort.test.js",
            ddgTitle: "BubbleSort.sort([-1,0,5,-10,20,13,-7,3,2,-3])"
          }
        ]
      },
    },
    {
      group: "sets",
      name: "cartesian-product",
      runFailed: true,
      crash: true,
      success: false,
      failedReason: "TODO",
      inputConnected: "TODO",
      gallery: {
        ddgSamples: [
          {
            exerciseName: "TODO",
            ddgTitle: "TODO"
          },
          {
            exerciseName: "TODO",
            ddgTitle: "TODO"
          }
        ]
      },
      rerun: true
    },
    {
      group: "math",
      name: "horner-method",
      success: false,
      failedReason: "reduce",
      tags: [
        "missing-data"
      ]
    },
    {
      group: "sets",
      name: "combination-sum",
      runFailed: true,
      crash: true,
      success: false,
      failedReason: "TODO",
      inputConnected: "TODO",
      gallery: {
        ddgSamples: [
          {
            exerciseName: "TODO",
            ddgTitle: "TODO"
          },
          {
            exerciseName: "TODO",
            ddgTitle: "TODO"
          }
        ]
      },
      rerun: true
    },
    {
      group: "sets",
      name: "combinations",
      runFailed: true,
      crash: true,
      success: false,
      failedReason: "TODO",
      inputConnected: "TODO",
      gallery: {
        ddgSamples: [
          {
            exerciseName: "TODO",
            ddgTitle: "TODO"
          },
          {
            exerciseName: "TODO",
            ddgTitle: "TODO"
          }
        ]
      },
      rerun: true,
    },
    {
      group: "math",
      name: "complex-number",
      success: true,
      inputConnected: "All",
      gallery: {
        ddgSamples: [
          {
            exerciseName: "ComplexNumber should add complex numbers@ComplexNumber.test.js",
            ddgTitle: "ComplexNumber.add({re,im})"
          },
          {
            exerciseName: "ComplexNumber should divide complex numbers@ComplexNumber.test.js",
            ddgTitle: "ComplexNumber.divide({re,im})"
          }
        ]
      }
    },
    {
      group: "sorting",
      name: "counting-sort",
      success: false,
      failedReason: "unshift",
      tags: [
        "missing-data"
      ]
    },
    {
      group: "math",
      name: "radian",
      success: true,
      inputConnected: "All",
      gallery: {
        ddgSamples: [
          {
            exerciseName: "radianToDegree should convert radian to degree@radianToDegree.test.js",
            ddgTitle: "radianToDegree(3.141592653589793)"
          },
          {
            exerciseName: "degreeToRadian should convert degree to radian@degreeToRadian.test.js",
            ddgTitle: "degreeToRadian(180)"
          }
        ]
      },
    },
    {
      group: "graph",
      name: "detect-cycle",
      success: false,
      failedReason: "control",
      inputConnected: "All",
      gallery: {
        ddgSamples: [
          {
            exerciseName: "detectDirectedCycle should detect directed cycle@detectDirectedCycle.test.js",
            ddgTitle: "detectDirectedCycle({vertices,edges,isDirected})"
          },
          {
            exerciseName: "detectUndirectedCycle should detect undirected cycle@detectUndirectedCycle.test.js",
            ddgTitle: "detectUndirectedCycle({vertices,edges,isDirected})"
          }
        ]
      },
      tags: [
        "control"
      ],
      rerun: true,
    },
    {
      group: "graph",
      name: "dijkstra",
      success: true,
      inputConnected: "All",
      gallery: {
        ddgSamples: [
          {
            exerciseName: "dijkstra should find minimum paths to all vertices for directed graph with negative edge weights@dijkstra.test.js",
            ddgTitle: "dijkstra({vertices,edges,isDirected}, {value,edges})"
          },
          {
            exerciseName: "dijkstra should find minimum paths to all vertices for undirected graph@dijkstra.test.js",
            ddgTitle: "dijkstra({vertices,edges,isDirected}, {value,edges})"
          }
        ]
      }
    },
    {
      group: "math",
      name: "fourier-transform",
      runFailed: true,
      crash: true,
      success: false,
      failedReason: "TODO",
      inputConnected: "TODO",
      gallery: {
        ddgSamples: [
          {
            exerciseName: "TODO",
            ddgTitle: "TODO"
          },
          {
            exerciseName: "TODO",
            ddgTitle: "TODO"
          }
        ]
      },
      rerun: true,
    },
    {
      group: "sets",
      name: "longest-increasing-subsequence",
      success: false,
      failedReason: "control",
      inputConnected: "false",
      gallery: {
        ddgSamples: [
          {
            exerciseName: "dpLongestIncreasingSubsequence should find longest increasing subsequence length@dpLongestIncreasingSubsequence.test.js",
            ddgTitle: "dpLongestIncreasingSubsequence([3,4,-1,0,6,2,3])"
          },
          {
            exerciseName: "dpLongestIncreasingSubsequence should find longest increasing subsequence length@dpLongestIncreasingSubsequence.test.js",
            ddgTitle: "dpLongestIncreasingSubsequence([0,8,4,12,2,10,6,14,1,9,5,13,3,11,7,15])"
          }
        ]
      },
      tags: [
        "control"
      ]
    },
    {
      group: "math",
      name: "euclidean-algorithm",
      success: true,
      failedReason: "instrumentation",
      inputConnected: "All",
      gallery: {
        ddgSamples: [
          {
            exerciseName: "euclideanAlgorithm should calculate GCD recursively@euclideanAlgorithm.test.js",
            ddgTitle: "euclideanAlgorithm(462, 1071)"
          },
          {
            exerciseName: "euclideanAlgorithm should calculate GCD recursively@euclideanAlgorithm.test.js",
            ddgTitle: "euclideanAlgorithm(24, 60)"
          }
        ]
      },
      tags: [
        "instrumentation" // iterative only
      ]
    },
    {
      group: "math",
      name: "euclidean-distance",
      success: true,
      inputConnected: "All",
      gallery: {
        ddgSamples: [
          {
            exerciseName: "euclideanDistance should calculate euclidean distance between vectors@euclideanDistance.test.js",
            ddgTitle: "euclideanDistance([[],[],[]], [[],[],[]])"
          },
          {
            exerciseName: "euclideanDistance should calculate euclidean distance between vectors@euclideanDistance.test.js",
            ddgTitle: "euclideanDistance([[],[]], [[],[]])"
          }
        ]
      }
    },
    {
      group: "graph",
      name: "eulerian-path",
      runFailed: true,
      failedReason: "instrumentation",
      tags: [
        "instrumentation"
      ]
    },
    {
      group: "math",
      name: "factorial",
      success: false,
      failedReason: "control(iterative only)",
      inputConnected: "Some",
      gallery: {
        ddgSamples: [
          {
            exerciseName: "factorial should calculate factorial@factorial.test.js",
            ddgTitle: "factorial(5)"
          },
          {
            exerciseName: "factorialRecursive should calculate factorial@factorialRecursive.test.js",
            ddgTitle: "factorialRecursive(5)"
          }
        ]
      },
      tags: [
        "control"
      ]
    },
    {
      group: "math",
      name: "fast-powering",
      success: false,
      failedReason: "control",
      inputConnected: "Some",
      gallery: {
        ddgSamples: [
          {
            exerciseName: "fastPowering should compute power in log(n) time@fastPowering.test.js",
            ddgTitle: "fastPowering(2, 5)"
          },
          {
            exerciseName: "fastPowering should compute power in log(n) time@fastPowering.test.js",
            ddgTitle: "fastPowering(2, 7)"
          }
        ]
      },
      tags: [
        "control"
      ]
    },
    {
      group: "math",
      name: "fibonacci",
      success: false,
      failedReason: "control(iterative only)",
      inputConnected: "All",
      gallery: {
        ddgSamples: [
          {
            exerciseName: "fibonacci should calculate fibonacci correctly@fibonacci.test.js",
            ddgTitle: "fibonacci(4)"
          },
          {
            exerciseName: "fibonacciClosedForm should calculate fibonacci correctly@fibonacciNthClosedForm.test.js",
            ddgTitle: "fibonacciClosedForm(4)"
          }
        ]
      },
      tags: [
        "control"
      ]
    },
    {
      group: "sets",
      name: "fisher-yates",
      success: false,
      failedReason: "shift",
      tags: [
        "missing-data"
      ]
    },
    {
      group: "graph",
      name: "floyd-warshall",
      success: false,
      failedReason: "control",
      inputConnected: "0",
      gallery: {
        ddgSamples: [
          {
            exerciseName: "floydWarshall should find minimum paths to all vertices for directed graph with negative edge weights@floydWarshall.test.js",
            ddgTitle: "floydWarshall({vertices,edges,isDirected})"
          },
          {
            exerciseName: "floydWarshall should find minimum paths to all vertices for undirected graph@floydWarshall.test.js",
            ddgTitle: "floydWarshall({vertices,edges,isDirected})"
          }
        ]
      },
      tags: [
        "control"
      ]
    },
    {
      group: "graph",
      name: "bridges",
      success: false,
      failedReason: "reduce",
      tags: [
        "missing-data"
      ]
    },
    {
      group: "graph",
      name: "hamiltonian-cycle",
      success: false,
      failedReason: "dataNode error",
    },
    {
      group: "string",
      name: "hamming-distance",
      success: false,
      failedReason: "string",
      inputConnected: "0",
      gallery: {
        ddgSamples: [
          {
            exerciseName: "hammingDistance should calculate difference between two strings@hammingDistance.test.js",
            ddgTitle: "hammingDistance(karolin, kathrin)"
          },
          {
            exerciseName: "hammingDistance should calculate difference between two strings@hammingDistance.test.js",
            ddgTitle: "hammingDistance(1011101, 1001001)"
          }
        ]
      },
    },
    {
      group: "uncategorized",
      name: "hanoi-tower",
      success: true,
      inputConnected: "All",
      gallery: {
        ddgSamples: [
          {
            exerciseName: "TODO",
            ddgTitle: "TODO"
          },
          {
            exerciseName: "TODO",
            ddgTitle: "TODO"
          }
        ]
      },
      rerun: true
    },
    {
      group: "sorting",
      name: "heap-sort",
      success: true,
      inputConnected: "All",
      gallery: {
        ddgSamples: [
          {
            exerciseName: "HeapSort should sort array@HeapSort.test.js",
            ddgTitle: "HeapSort.sort([3,4,2,1,0,0,4,3,4,2])"
          },
          {
            exerciseName: "HeapSort should sort negative numbers@HeapSort.test.js",
            ddgTitle: "HeapSort.sort([-1,0,5,-10,20,13,-7,3,2,-3])"
          }
        ]
      }
    },
    {
      group: "sorting",
      name: "insertion-sort",
      success: true,
      inputConnected: "All",
      gallery: {
        ddgSamples: [
          {
            exerciseName: "InsertionSort should sort array@InsertionSort.test.js",
            ddgTitle: "InsertionSort.sort([3,4,2,1,0,0,4,3,4,2])"
          },
          {
            exerciseName: "InsertionSort should sort negative numbers@InsertionSort.test.js",
            ddgTitle: "InsertionSort.sort([-1,0,5,-10,20,13,-7,3,2,-3])"
          }
        ]
      }
    },
    {
      group: "math",
      name: "integer-partition",
      success: false,
      failedReason: "bug todo: watch return node is not shown",
      tags: [
        "watch-hidden"
      ]
    },
    {
      group: "search",
      name: "interpolation-search",
      success: true,
      inputConnected: "All",
      gallery: {
        ddgSamples: [
          {
            exerciseName: "interpolationSearch should search elements in sorted array of numbers@interpolationSearch.test.js",
            ddgTitle: "interpolationSearch([10,20,30,40,50], 40)"
          },
          {
            exerciseName: "interpolationSearch should search elements in sorted array of numbers@interpolationSearch.test.js",
            ddgTitle: "interpolationSearch([1,2,3,700,800,1200,1300,1400,1900], 700)"
          }
        ]
      },
    },
    {
      group: "math",
      name: "is-power-of-two",
      success: true,
      inputConnected: "0",
      gallery: {
        ddgSamples: [
          {
            exerciseName: "isPowerOfTwo should check if the number is made by multiplying twos@isPowerOfTwo.test.js",
            ddgTitle: "isPowerOfTwo(8)"
          },
          {
            exerciseName: "isPowerOfTwo should check if the number is made by multiplying twos@isPowerOfTwo.test.js",
            ddgTitle: "isPowerOfTwo(1024)"
          }
        ]
      },
      tags: [
        "control",
        "connected"
      ]
    },
    {
      group: "search",
      name: "jump-search",
      runFailed: true,
      crash: true,
      success: false,
      failedReason: "TODO",
      inputConnected: "0",
      gallery: {
        ddgSamples: [
          {
            exerciseName: "jumpSearch should search for an element in sorted array@jumpSearch.test.js",
            ddgTitle: "jumpSearch([1,2,5,10,20,21,24,30,48], 20)"
          },
          {
            exerciseName: "jumpSearch should search for an element in sorted array@jumpSearch.test.js",
            ddgTitle: "jumpSearch([1,2,5,10,20,21,24,30,48], 7)"
          }
        ]
      },
      tags: [
        "control",
        "connected"
      ]
    },
    {
      group: "ml",
      name: "k-means",
      runFailed: true,
      crash: true,
      success: false,
      failedReason: "TODO",
      inputConnected: "TODO",
      gallery: {
        ddgSamples: [
          {
            exerciseName: "TODO",
            ddgTitle: "TODO"
          },
          {
            exerciseName: "TODO",
            ddgTitle: "TODO"
          }
        ]
      },
      TODO: true
    },
    {
      group: "sets",
      name: "knapsack-problem",
      runFailed: true,
      crash: true,
      success: false,
      failedReason: "TODO",
      inputConnected: "TODO",
      gallery: {
        ddgSamples: [
          {
            exerciseName: "TODO",
            ddgTitle: "TODO"
          },
          {
            exerciseName: "TODO",
            ddgTitle: "TODO"
          }
        ]
      },
      TODO: true
    },
    {
      group: "uncategorized",
      name: "knight-tour",
      runFailed: true,
      crash: true,
      success: false,
      failedReason: "TODO",
      inputConnected: "TODO",
      gallery: {
        ddgSamples: [
          {
            exerciseName: "TODO",
            ddgTitle: "TODO"
          },
          {
            exerciseName: "TODO",
            ddgTitle: "TODO"
          }
        ]
      },
      TODO: true
    },
    {
      group: "ml",
      name: "knn",
      runFailed: true,
      crash: true,
      success: false,
      failedReason: "TODO",
      inputConnected: "TODO",
      gallery: {
        ddgSamples: [
          {
            exerciseName: "TODO",
            ddgTitle: "TODO"
          },
          {
            exerciseName: "TODO",
            ddgTitle: "TODO"
          }
        ]
      },
      TODO: true
    },
    {
      group: "string",
      name: "knuth-morris-pratt",
      runFailed: true,
      crash: true,
      success: false,
      failedReason: "TODO",
      inputConnected: "TODO",
      gallery: {
        ddgSamples: [
          {
            exerciseName: "TODO",
            ddgTitle: "TODO"
          },
          {
            exerciseName: "TODO",
            ddgTitle: "TODO"
          }
        ]
      },
      TODO: true
    },
    {
      group: "graph",
      name: "kruskal",
      runFailed: true,
      crash: true,
      success: false,
      failedReason: "TODO",
      inputConnected: "TODO",
      gallery: {
        ddgSamples: [
          {
            exerciseName: "TODO",
            ddgTitle: "TODO"
          },
          {
            exerciseName: "TODO",
            ddgTitle: "TODO"
          }
        ]
      },
      TODO: true
    },
    {
      group: "math",
      name: "least-common-multiple",
      runFailed: true,
      crash: true,
      success: false,
      failedReason: "TODO",
      inputConnected: "TODO",
      gallery: {
        ddgSamples: [
          {
            exerciseName: "TODO",
            ddgTitle: "TODO"
          },
          {
            exerciseName: "TODO",
            ddgTitle: "TODO"
          }
        ]
      },
      TODO: true
    },
    {
      group: "string",
      name: "levenshtein-distance",
      runFailed: true,
      crash: true,
      success: false,
      failedReason: "TODO",
      inputConnected: "TODO",
      gallery: {
        ddgSamples: [
          {
            exerciseName: "TODO",
            ddgTitle: "TODO"
          },
          {
            exerciseName: "TODO",
            ddgTitle: "TODO"
          }
        ]
      },
      TODO: true
    },
    {
      group: "search",
      name: "linear-search",
      runFailed: true,
      crash: true,
      success: false,
      failedReason: "TODO",
      inputConnected: "TODO",
      gallery: {
        ddgSamples: [
          {
            exerciseName: "TODO",
            ddgTitle: "TODO"
          },
          {
            exerciseName: "TODO",
            ddgTitle: "TODO"
          }
        ]
      },
      TODO: true
    },
    {
      group: "math",
      name: "liu-hui",
      runFailed: true,
      crash: true,
      success: false,
      failedReason: "TODO",
      inputConnected: "TODO",
      gallery: {
        ddgSamples: [
          {
            exerciseName: "TODO",
            ddgTitle: "TODO"
          },
          {
            exerciseName: "TODO",
            ddgTitle: "TODO"
          }
        ]
      },
      TODO: true
    },
    {
      group: "sets",
      name: "longest-common-subsequence",
      runFailed: true,
      crash: true,
      success: false,
      failedReason: "TODO",
      inputConnected: "TODO",
      gallery: {
        ddgSamples: [
          {
            exerciseName: "TODO",
            ddgTitle: "TODO"
          },
          {
            exerciseName: "TODO",
            ddgTitle: "TODO"
          }
        ]
      },
      TODO: true
    },
    {
      group: "string",
      name: "longest-common-substring",
      runFailed: true,
      crash: true,
      success: false,
      failedReason: "TODO",
      inputConnected: "TODO",
      gallery: {
        ddgSamples: [
          {
            exerciseName: "TODO",
            ddgTitle: "TODO"
          },
          {
            exerciseName: "TODO",
            ddgTitle: "TODO"
          }
        ]
      },
      TODO: true
    },
    {
      group: "math",
      name: "matrix",
      runFailed: true,
      crash: true,
      success: false,
      failedReason: "TODO",
      inputConnected: "TODO",
      gallery: {
        ddgSamples: [
          {
            exerciseName: "TODO",
            ddgTitle: "TODO"
          },
          {
            exerciseName: "TODO",
            ddgTitle: "TODO"
          }
        ]
      },
      TODO: true
    },
    {
      group: "sorting",
      name: "merge-sort",
      runFailed: true,
      crash: true,
      success: false,
      failedReason: "TODO",
      inputConnected: "TODO",
      gallery: {
        ddgSamples: [
          {
            exerciseName: "TODO",
            ddgTitle: "TODO"
          },
          {
            exerciseName: "TODO",
            ddgTitle: "TODO"
          }
        ]
      },
      TODO: true
    },
    {
      group: "uncategorized",
      name: "n-queens",
      runFailed: true,
      crash: true,
      success: false,
      failedReason: "TODO",
      inputConnected: "TODO",
      gallery: {
        ddgSamples: [
          {
            exerciseName: "TODO",
            ddgTitle: "TODO"
          },
          {
            exerciseName: "TODO",
            ddgTitle: "TODO"
          }
        ]
      },
      TODO: true
    },
    {
      group: "string",
      name: "palindrome",
      runFailed: true,
      crash: true,
      success: false,
      failedReason: "TODO",
      inputConnected: "TODO",
      gallery: {
        ddgSamples: [
          {
            exerciseName: "TODO",
            ddgTitle: "TODO"
          },
          {
            exerciseName: "TODO",
            ddgTitle: "TODO"
          }
        ]
      },
      TODO: true
    },
    {
      group: "math",
      name: "pascal-triangle",
      runFailed: true,
      crash: true,
      success: false,
      failedReason: "TODO",
      inputConnected: "TODO",
      gallery: {
        ddgSamples: [
          {
            exerciseName: "TODO",
            ddgTitle: "TODO"
          },
          {
            exerciseName: "TODO",
            ddgTitle: "TODO"
          }
        ]
      },
      TODO: true
    },
    {
      group: "sets",
      name: "permutations",
      runFailed: true,
      crash: true,
      success: false,
      failedReason: "TODO",
      inputConnected: "TODO",
      gallery: {
        ddgSamples: [
          {
            exerciseName: "TODO",
            ddgTitle: "TODO"
          },
          {
            exerciseName: "TODO",
            ddgTitle: "TODO"
          }
        ]
      },
      TODO: true
    },
    {
      group: "graph",
      name: "prim",
      runFailed: true,
      crash: true,
      success: false,
      failedReason: "TODO",
      inputConnected: "TODO",
      gallery: {
        ddgSamples: [
          {
            exerciseName: "TODO",
            ddgTitle: "TODO"
          },
          {
            exerciseName: "TODO",
            ddgTitle: "TODO"
          }
        ]
      },
      TODO: true
    },
    {
      group: "math",
      name: "prime-factors",
      runFailed: true,
      crash: true,
      success: false,
      failedReason: "TODO",
      inputConnected: "TODO",
      gallery: {
        ddgSamples: [
          {
            exerciseName: "TODO",
            ddgTitle: "TODO"
          },
          {
            exerciseName: "TODO",
            ddgTitle: "TODO"
          }
        ]
      },
      TODO: true
    },
    {
      group: "sorting",
      name: "quick-sort",
      runFailed: true,
      crash: true,
      success: false,
      failedReason: "TODO",
      inputConnected: "TODO",
      gallery: {
        ddgSamples: [
          {
            exerciseName: "TODO",
            ddgTitle: "TODO"
          },
          {
            exerciseName: "TODO",
            ddgTitle: "TODO"
          }
        ]
      },
      TODO: true
    },
    {
      group: "string",
      name: "rabin-karp",
      runFailed: true,
      crash: true,
      success: false,
      failedReason: "TODO",
      inputConnected: "TODO",
      gallery: {
        ddgSamples: [
          {
            exerciseName: "TODO",
            ddgTitle: "TODO"
          },
          {
            exerciseName: "TODO",
            ddgTitle: "TODO"
          }
        ]
      },
      TODO: true
    },
    {
      group: "sorting",
      name: "radix-sort",
      runFailed: true,
      crash: true,
      success: false,
      failedReason: "TODO",
      inputConnected: "TODO",
      gallery: {
        ddgSamples: [
          {
            exerciseName: "TODO",
            ddgTitle: "TODO"
          },
          {
            exerciseName: "TODO",
            ddgTitle: "TODO"
          }
        ]
      },
      TODO: true
    },
    {
      group: "cryptography",
      name: "rail-fence-cipher",
      runFailed: true,
      crash: true,
      success: false,
      failedReason: "TODO",
      inputConnected: "TODO",
      gallery: {
        ddgSamples: [
          {
            exerciseName: "TODO",
            ddgTitle: "TODO"
          },
          {
            exerciseName: "TODO",
            ddgTitle: "TODO"
          }
        ]
      },
      TODO: true
    },
    {
      group: "uncategorized",
      name: "recursive-staircase",
      runFailed: true,
      crash: true,
      success: false,
      failedReason: "TODO",
      inputConnected: "TODO",
      gallery: {
        ddgSamples: [
          {
            exerciseName: "TODO",
            ddgTitle: "TODO"
          },
          {
            exerciseName: "TODO",
            ddgTitle: "TODO"
          }
        ]
      },
      TODO: true
    },
    {
      group: "string",
      name: "regular-expression-matching",
      runFailed: true,
      crash: true,
      success: false,
      failedReason: "TODO",
      inputConnected: "TODO",
      gallery: {
        ddgSamples: [
          {
            exerciseName: "TODO",
            ddgTitle: "TODO"
          },
          {
            exerciseName: "TODO",
            ddgTitle: "TODO"
          }
        ]
      },
      TODO: true
    },
    {
      group: "image-processing",
      name: "seam-carving",
      runFailed: true,
      crash: true,
      success: false,
      failedReason: "TODO",
      inputConnected: "TODO",
      gallery: {
        ddgSamples: [
          {
            exerciseName: "TODO",
            ddgTitle: "TODO"
          },
          {
            exerciseName: "TODO",
            ddgTitle: "TODO"
          }
        ]
      },
      TODO: true
    },
    {
      group: "linked-list",
      name: "reverse-traversal",
      runFailed: true,
      crash: true,
      success: false,
      failedReason: "TODO",
      inputConnected: "TODO",
      gallery: {
        ddgSamples: [
          {
            exerciseName: "TODO",
            ddgTitle: "TODO"
          },
          {
            exerciseName: "TODO",
            ddgTitle: "TODO"
          }
        ]
      },
      TODO: true
    },
    {
      group: "sorting",
      name: "selection-sort",
      runFailed: true,
      crash: true,
      success: false,
      failedReason: "TODO",
      inputConnected: "TODO",
      gallery: {
        ddgSamples: [
          {
            exerciseName: "TODO",
            ddgTitle: "TODO"
          },
          {
            exerciseName: "TODO",
            ddgTitle: "TODO"
          }
        ]
      },
      TODO: true
    },
    {
      group: "sorting",
      name: "shell-sort",
      runFailed: true,
      crash: true,
      success: false,
      failedReason: "TODO",
      inputConnected: "TODO",
      gallery: {
        ddgSamples: [
          {
            exerciseName: "TODO",
            ddgTitle: "TODO"
          },
          {
            exerciseName: "TODO",
            ddgTitle: "TODO"
          }
        ]
      },
      TODO: true
    },
    {
      group: "sets",
      name: "shortest-common-supersequence",
      runFailed: true,
      crash: true,
      success: false,
      failedReason: "TODO",
      inputConnected: "TODO",
      gallery: {
        ddgSamples: [
          {
            exerciseName: "TODO",
            ddgTitle: "TODO"
          },
          {
            exerciseName: "TODO",
            ddgTitle: "TODO"
          }
        ]
      },
      TODO: true
    },
    {
      group: "math",
      name: "sieve-of-eratosthenes",
      runFailed: true,
      crash: true,
      success: false,
      failedReason: "TODO",
      inputConnected: "TODO",
      gallery: {
        ddgSamples: [
          {
            exerciseName: "TODO",
            ddgTitle: "TODO"
          },
          {
            exerciseName: "TODO",
            ddgTitle: "TODO"
          }
        ]
      },
      TODO: true
    },
    {
      group: "uncategorized",
      name: "square-matrix-rotation",
      runFailed: true,
      crash: true,
      success: false,
      failedReason: "TODO",
      inputConnected: "TODO",
      gallery: {
        ddgSamples: [
          {
            exerciseName: "TODO",
            ddgTitle: "TODO"
          },
          {
            exerciseName: "TODO",
            ddgTitle: "TODO"
          }
        ]
      },
      TODO: true
    },
    {
      group: "math",
      name: "square-root",
      runFailed: true,
      crash: true,
      success: false,
      failedReason: "TODO",
      inputConnected: "TODO",
      gallery: {
        ddgSamples: [
          {
            exerciseName: "TODO",
            ddgTitle: "TODO"
          },
          {
            exerciseName: "TODO",
            ddgTitle: "TODO"
          }
        ]
      },
      TODO: true
    },
    {
      group: "graph",
      name: "strongly-connected-components",
      runFailed: true,
      crash: true,
      success: false,
      failedReason: "TODO",
      inputConnected: "TODO",
      gallery: {
        ddgSamples: [
          {
            exerciseName: "TODO",
            ddgTitle: "TODO"
          },
          {
            exerciseName: "TODO",
            ddgTitle: "TODO"
          }
        ]
      },
      TODO: true
    },
    {
      group: "graph",
      name: "topological-sorting",
      runFailed: true,
      crash: true,
      success: false,
      failedReason: "TODO",
      inputConnected: "TODO",
      gallery: {
        ddgSamples: [
          {
            exerciseName: "TODO",
            ddgTitle: "TODO"
          },
          {
            exerciseName: "TODO",
            ddgTitle: "TODO"
          }
        ]
      },
      TODO: true
    },
    {
      group: "linked-list",
      name: "traversal",
      runFailed: true,
      crash: true,
      success: false,
      failedReason: "TODO",
      inputConnected: "TODO",
      gallery: {
        ddgSamples: [
          {
            exerciseName: "TODO",
            ddgTitle: "TODO"
          },
          {
            exerciseName: "TODO",
            ddgTitle: "TODO"
          }
        ]
      },
      TODO: true
    },
    {
      group: "math",
      name: "primality-test",
      runFailed: true,
      crash: true,
      success: false,
      failedReason: "TODO",
      inputConnected: "TODO",
      gallery: {
        ddgSamples: [
          {
            exerciseName: "TODO",
            ddgTitle: "TODO"
          },
          {
            exerciseName: "TODO",
            ddgTitle: "TODO"
          }
        ]
      },
      TODO: true
    },
    {
      group: "string",
      name: "z-algorithm",
      runFailed: true,
      crash: true,
      success: false,
      failedReason: "TODO",
      inputConnected: "TODO",
      gallery: {
        ddgSamples: [
          {
            exerciseName: "TODO",
            ddgTitle: "TODO"
          },
          {
            exerciseName: "TODO",
            ddgTitle: "TODO"
          }
        ]
      },
      TODO: true
    },
    {
      group: "cryptography",
      name: "caesar-cipher",
      success: false,
      failedReason: "reduce",
      tags: [
        "missing-data"
      ]
    },
    {
      group: "cryptography",
      name: "hill-cipher",
      success: false,
      failedReason: "string",
      inputConnected: "0",
      gallery: {
        ddgSamples: [
          {
            exerciseName: "hillCipher should encrypt passed message using Hill Cipher@hillCipher.test.js",
            ddgTitle: "hillCipherEncrypt(ACT, GYBNQKURP)"
          },
          {
            exerciseName: "hillCipher should encrypt passed message using Hill Cipher@hillCipher.test.js",
            ddgTitle: "hillCipherEncrypt(CAT, GYBNQKURP)"
          },
        ]
      }
    },
    {
      group: "tree",
      name: "breadth-first-search",
      ignore: true,
    },
    {
      group: "tree",
      name: "depth-first-search",
      ignore: true,
    },
    {
      group: "statistics",
      name: "weighted-random",
      gallery: false,
      ignoreReason: "too many executions"
    },
    {
      group: "cryptography",
      name: "polynomial-hash",
      gallery: false,
      ignoreReason: "too many executions"
    }
  ],
  exercises: [
    // {
    //   name: "accumulatorBestTimeToBuySellStocks should find the best time to buy and sell stocks@accumulatorBestTimeToBuySellStocks.test.js",
    //   testProp: "testProp",
    //   gallery: false,
    // }
  ]
};