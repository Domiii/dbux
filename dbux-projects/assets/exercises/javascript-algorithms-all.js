module.exports = [
  {
    "chapterGroup": "cryptography",
    "chapter": "caesar-cipher",
    "algo": "caesar-cipher_caesarCipher",
    "name": "caesarCipher should not change a string with zero shift@caesarCipher.test.js",
    "label": "caesarCipher should not change a string with zero shift",
    "testNamePattern": "caesarCipher should not change a string with zero shift",
    "testFilePaths": [
      "src/algorithms/cryptography/caesar-cipher/__test__/caesarCipher.test.js"
    ],
    "number": 1
  },
  {
    "chapterGroup": "cryptography",
    "chapter": "caesar-cipher",
    "algo": "caesar-cipher_caesarCipher",
    "name": "caesarCipher should cipher a string with different shifts@caesarCipher.test.js",
    "label": "caesarCipher should cipher a string with different shifts",
    "testNamePattern": "caesarCipher should cipher a string with different shifts",
    "testFilePaths": [
      "src/algorithms/cryptography/caesar-cipher/__test__/caesarCipher.test.js"
    ],
    "number": 2
  },
  {
    "chapterGroup": "cryptography",
    "chapter": "caesar-cipher",
    "algo": "caesar-cipher_caesarCipher",
    "name": "caesarCipher should be case insensitive@caesarCipher.test.js",
    "label": "caesarCipher should be case insensitive",
    "testNamePattern": "caesarCipher should be case insensitive",
    "testFilePaths": [
      "src/algorithms/cryptography/caesar-cipher/__test__/caesarCipher.test.js"
    ],
    "number": 3
  },
  {
    "chapterGroup": "cryptography",
    "chapter": "caesar-cipher",
    "algo": "caesar-cipher_caesarCipher",
    "name": "caesarCipher should correctly handle an empty strings@caesarCipher.test.js",
    "label": "caesarCipher should correctly handle an empty strings",
    "testNamePattern": "caesarCipher should correctly handle an empty strings",
    "testFilePaths": [
      "src/algorithms/cryptography/caesar-cipher/__test__/caesarCipher.test.js"
    ],
    "number": 4
  },
  {
    "chapterGroup": "cryptography",
    "chapter": "caesar-cipher",
    "algo": "caesar-cipher_caesarCipher",
    "name": "caesarCipher should not cipher unknown chars@caesarCipher.test.js",
    "label": "caesarCipher should not cipher unknown chars",
    "testNamePattern": "caesarCipher should not cipher unknown chars",
    "testFilePaths": [
      "src/algorithms/cryptography/caesar-cipher/__test__/caesarCipher.test.js"
    ],
    "number": 5
  },
  {
    "chapterGroup": "cryptography",
    "chapter": "caesar-cipher",
    "algo": "caesar-cipher_caesarCipher",
    "name": "caesarCipher should encrypt and decrypt full phrases@caesarCipher.test.js",
    "label": "caesarCipher should encrypt and decrypt full phrases",
    "testNamePattern": "caesarCipher should encrypt and decrypt full phrases",
    "testFilePaths": [
      "src/algorithms/cryptography/caesar-cipher/__test__/caesarCipher.test.js"
    ],
    "number": 6
  },
  {
    "chapterGroup": "cryptography",
    "chapter": "hill-cipher",
    "algo": "hill-cipher_hillCipher",
    "name": "hillCipher should throw an exception when trying to decipher@hillCipher.test.js",
    "label": "hillCipher should throw an exception when trying to decipher",
    "testNamePattern": "hillCipher should throw an exception when trying to decipher",
    "testFilePaths": [
      "src/algorithms/cryptography/hill-cipher/_test_/hillCipher.test.js"
    ],
    "number": 7
  },
  {
    "chapterGroup": "cryptography",
    "chapter": "hill-cipher",
    "algo": "hill-cipher_hillCipher",
    "name": "hillCipher should throw an error when message or keyString contains none letter character@hillCipher.test.js",
    "label": "hillCipher should throw an error when message or keyString contains none letter character",
    "testNamePattern": "hillCipher should throw an error when message or keyString contains none letter character",
    "testFilePaths": [
      "src/algorithms/cryptography/hill-cipher/_test_/hillCipher.test.js"
    ],
    "number": 8
  },
  {
    "chapterGroup": "cryptography",
    "chapter": "hill-cipher",
    "algo": "hill-cipher_hillCipher",
    "name": "hillCipher should throw an error when the length of the keyString has a square root which is not integer@hillCipher.test.js",
    "label": "hillCipher should throw an error when the length of the keyString has a square root which is not integer",
    "testNamePattern": "hillCipher should throw an error when the length of the keyString has a square root which is not integer",
    "testFilePaths": [
      "src/algorithms/cryptography/hill-cipher/_test_/hillCipher.test.js"
    ],
    "number": 9
  },
  {
    "chapterGroup": "cryptography",
    "chapter": "hill-cipher",
    "algo": "hill-cipher_hillCipher",
    "name": "hillCipher should throw an error when the length of the keyString does not equal to the power of length of the message@hillCipher.test.js",
    "label": "hillCipher should throw an error when the length of the keyString does not equal to the power of length of the message",
    "testNamePattern": "hillCipher should throw an error when the length of the keyString does not equal to the power of length of the message",
    "testFilePaths": [
      "src/algorithms/cryptography/hill-cipher/_test_/hillCipher.test.js"
    ],
    "number": 10
  },
  {
    "chapterGroup": "cryptography",
    "chapter": "hill-cipher",
    "algo": "hill-cipher_hillCipher",
    "name": "hillCipher should encrypt passed message using Hill Cipher@hillCipher.test.js",
    "label": "hillCipher should encrypt passed message using Hill Cipher",
    "testNamePattern": "hillCipher should encrypt passed message using Hill Cipher",
    "testFilePaths": [
      "src/algorithms/cryptography/hill-cipher/_test_/hillCipher.test.js"
    ],
    "number": 11
  },
  {
    "chapterGroup": "cryptography",
    "chapter": "polynomial-hash",
    "algo": "polynomial-hash_PolynomialHash",
    "name": "PolynomialHash should calculate new hash based on previous one@PolynomialHash.test.js",
    "label": "PolynomialHash should calculate new hash based on previous one",
    "testNamePattern": "PolynomialHash should calculate new hash based on previous one",
    "testFilePaths": [
      "src/algorithms/cryptography/polynomial-hash/__test__/PolynomialHash.test.js"
    ],
    "number": 12
  },
  {
    "chapterGroup": "cryptography",
    "chapter": "polynomial-hash",
    "algo": "polynomial-hash_PolynomialHash",
    "name": "PolynomialHash should generate numeric hashed less than 100@PolynomialHash.test.js",
    "label": "PolynomialHash should generate numeric hashed less than 100",
    "testNamePattern": "PolynomialHash should generate numeric hashed less than 100",
    "testFilePaths": [
      "src/algorithms/cryptography/polynomial-hash/__test__/PolynomialHash.test.js"
    ],
    "number": 13
  },
  {
    "chapterGroup": "cryptography",
    "chapter": "polynomial-hash",
    "algo": "polynomial-hash_SimplePolynomialHash",
    "name": "PolynomialHash should calculate new hash based on previous one@SimplePolynomialHash.test.js",
    "label": "PolynomialHash should calculate new hash based on previous one",
    "testNamePattern": "PolynomialHash should calculate new hash based on previous one",
    "testFilePaths": [
      "src/algorithms/cryptography/polynomial-hash/__test__/SimplePolynomialHash.test.js"
    ],
    "number": 14
  },
  {
    "chapterGroup": "cryptography",
    "chapter": "polynomial-hash",
    "algo": "polynomial-hash_SimplePolynomialHash",
    "name": "PolynomialHash should generate numeric hashed@SimplePolynomialHash.test.js",
    "label": "PolynomialHash should generate numeric hashed",
    "testNamePattern": "PolynomialHash should generate numeric hashed",
    "testFilePaths": [
      "src/algorithms/cryptography/polynomial-hash/__test__/SimplePolynomialHash.test.js"
    ],
    "number": 15
  },
  {
    "chapterGroup": "cryptography",
    "chapter": "rail-fence-cipher",
    "algo": "rail-fence-cipher_railFenceCipher",
    "name": "railFenceCipher encodes a string correctly for base=3@railFenceCipher.test.js",
    "label": "railFenceCipher encodes a string correctly for base=3",
    "testNamePattern": "railFenceCipher encodes a string correctly for base=3",
    "testFilePaths": [
      "src/algorithms/cryptography/rail-fence-cipher/__test__/railFenceCipher.test.js"
    ],
    "number": 16
  },
  {
    "chapterGroup": "cryptography",
    "chapter": "rail-fence-cipher",
    "algo": "rail-fence-cipher_railFenceCipher",
    "name": "railFenceCipher decodes a string correctly for base=3@railFenceCipher.test.js",
    "label": "railFenceCipher decodes a string correctly for base=3",
    "testNamePattern": "railFenceCipher decodes a string correctly for base=3",
    "testFilePaths": [
      "src/algorithms/cryptography/rail-fence-cipher/__test__/railFenceCipher.test.js"
    ],
    "number": 17
  },
  {
    "chapterGroup": "cryptography",
    "chapter": "rail-fence-cipher",
    "algo": "rail-fence-cipher_railFenceCipher",
    "name": "railFenceCipher encodes a string correctly for base=4@railFenceCipher.test.js",
    "label": "railFenceCipher encodes a string correctly for base=4",
    "testNamePattern": "railFenceCipher encodes a string correctly for base=4",
    "testFilePaths": [
      "src/algorithms/cryptography/rail-fence-cipher/__test__/railFenceCipher.test.js"
    ],
    "number": 18
  },
  {
    "chapterGroup": "cryptography",
    "chapter": "rail-fence-cipher",
    "algo": "rail-fence-cipher_railFenceCipher",
    "name": "railFenceCipher decodes a string correctly for base=4@railFenceCipher.test.js",
    "label": "railFenceCipher decodes a string correctly for base=4",
    "testNamePattern": "railFenceCipher decodes a string correctly for base=4",
    "testFilePaths": [
      "src/algorithms/cryptography/rail-fence-cipher/__test__/railFenceCipher.test.js"
    ],
    "number": 19
  },
  {
    "chapterGroup": "graph",
    "chapter": "articulation-points",
    "algo": "articulation-points_articulationPoints",
    "name": "articulationPoints should find articulation points in simple graph@articulationPoints.test.js",
    "label": "articulationPoints should find articulation points in simple graph",
    "testNamePattern": "articulationPoints should find articulation points in simple graph",
    "testFilePaths": [
      "src/algorithms/graph/articulation-points/__test__/articulationPoints.test.js"
    ],
    "number": 20
  },
  {
    "chapterGroup": "graph",
    "chapter": "articulation-points",
    "algo": "articulation-points_articulationPoints",
    "name": "articulationPoints should find articulation points in simple graph with back edge@articulationPoints.test.js",
    "label": "articulationPoints should find articulation points in simple graph with back edge",
    "testNamePattern": "articulationPoints should find articulation points in simple graph with back edge",
    "testFilePaths": [
      "src/algorithms/graph/articulation-points/__test__/articulationPoints.test.js"
    ],
    "number": 21
  },
  {
    "chapterGroup": "graph",
    "chapter": "articulation-points",
    "algo": "articulation-points_articulationPoints",
    "name": "articulationPoints should find articulation points in simple graph with back edge #2@articulationPoints.test.js",
    "label": "articulationPoints should find articulation points in simple graph with back edge #2",
    "testNamePattern": "articulationPoints should find articulation points in simple graph with back edge #2",
    "testFilePaths": [
      "src/algorithms/graph/articulation-points/__test__/articulationPoints.test.js"
    ],
    "number": 22
  },
  {
    "chapterGroup": "graph",
    "chapter": "articulation-points",
    "algo": "articulation-points_articulationPoints",
    "name": "articulationPoints should find articulation points in graph@articulationPoints.test.js",
    "label": "articulationPoints should find articulation points in graph",
    "testNamePattern": "articulationPoints should find articulation points in graph",
    "testFilePaths": [
      "src/algorithms/graph/articulation-points/__test__/articulationPoints.test.js"
    ],
    "number": 23
  },
  {
    "chapterGroup": "graph",
    "chapter": "articulation-points",
    "algo": "articulation-points_articulationPoints",
    "name": "articulationPoints should find articulation points in graph starting with articulation root vertex@articulationPoints.test.js",
    "label": "articulationPoints should find articulation points in graph starting with articulation root vertex",
    "testNamePattern": "articulationPoints should find articulation points in graph starting with articulation root vertex",
    "testFilePaths": [
      "src/algorithms/graph/articulation-points/__test__/articulationPoints.test.js"
    ],
    "number": 24
  },
  {
    "chapterGroup": "graph",
    "chapter": "articulation-points",
    "algo": "articulation-points_articulationPoints",
    "name": "articulationPoints should find articulation points in yet another graph #1@articulationPoints.test.js",
    "label": "articulationPoints should find articulation points in yet another graph #1",
    "testNamePattern": "articulationPoints should find articulation points in yet another graph #1",
    "testFilePaths": [
      "src/algorithms/graph/articulation-points/__test__/articulationPoints.test.js"
    ],
    "number": 25
  },
  {
    "chapterGroup": "graph",
    "chapter": "articulation-points",
    "algo": "articulation-points_articulationPoints",
    "name": "articulationPoints should find articulation points in yet another graph #2@articulationPoints.test.js",
    "label": "articulationPoints should find articulation points in yet another graph #2",
    "testNamePattern": "articulationPoints should find articulation points in yet another graph #2",
    "testFilePaths": [
      "src/algorithms/graph/articulation-points/__test__/articulationPoints.test.js"
    ],
    "number": 26
  },
  {
    "chapterGroup": "graph",
    "chapter": "bellman-ford",
    "algo": "bellman-ford_bellmanFord",
    "name": "bellmanFord should find minimum paths to all vertices for undirected graph@bellmanFord.test.js",
    "label": "bellmanFord should find minimum paths to all vertices for undirected graph",
    "testNamePattern": "bellmanFord should find minimum paths to all vertices for undirected graph",
    "testFilePaths": [
      "src/algorithms/graph/bellman-ford/__test__/bellmanFord.test.js"
    ],
    "number": 27
  },
  {
    "chapterGroup": "graph",
    "chapter": "bellman-ford",
    "algo": "bellman-ford_bellmanFord",
    "name": "bellmanFord should find minimum paths to all vertices for directed graph with negative edge weights@bellmanFord.test.js",
    "label": "bellmanFord should find minimum paths to all vertices for directed graph with negative edge weights",
    "testNamePattern": "bellmanFord should find minimum paths to all vertices for directed graph with negative edge weights",
    "testFilePaths": [
      "src/algorithms/graph/bellman-ford/__test__/bellmanFord.test.js"
    ],
    "number": 28
  },
  {
    "chapterGroup": "graph",
    "chapter": "breadth-first-search",
    "algo": "breadth-first-search_breadthFirstSearch",
    "name": "breadthFirstSearch should perform BFS operation on graph@breadthFirstSearch.test.js",
    "label": "breadthFirstSearch should perform BFS operation on graph",
    "testNamePattern": "breadthFirstSearch should perform BFS operation on graph",
    "testFilePaths": [
      "src/algorithms/graph/breadth-first-search/__test__/breadthFirstSearch.test.js"
    ],
    "number": 29
  },
  {
    "chapterGroup": "graph",
    "chapter": "breadth-first-search",
    "algo": "breadth-first-search_breadthFirstSearch",
    "name": "breadthFirstSearch should allow to create custom vertex visiting logic@breadthFirstSearch.test.js",
    "label": "breadthFirstSearch should allow to create custom vertex visiting logic",
    "testNamePattern": "breadthFirstSearch should allow to create custom vertex visiting logic",
    "testFilePaths": [
      "src/algorithms/graph/breadth-first-search/__test__/breadthFirstSearch.test.js"
    ],
    "number": 30
  },
  {
    "chapterGroup": "graph",
    "chapter": "bridges",
    "algo": "bridges_graphBridges",
    "name": "graphBridges should find bridges in simple graph@graphBridges.test.js",
    "label": "graphBridges should find bridges in simple graph",
    "testNamePattern": "graphBridges should find bridges in simple graph",
    "testFilePaths": [
      "src/algorithms/graph/bridges/__test__/graphBridges.test.js"
    ],
    "number": 31
  },
  {
    "chapterGroup": "graph",
    "chapter": "bridges",
    "algo": "bridges_graphBridges",
    "name": "graphBridges should find bridges in simple graph with back edge@graphBridges.test.js",
    "label": "graphBridges should find bridges in simple graph with back edge",
    "testNamePattern": "graphBridges should find bridges in simple graph with back edge",
    "testFilePaths": [
      "src/algorithms/graph/bridges/__test__/graphBridges.test.js"
    ],
    "number": 32
  },
  {
    "chapterGroup": "graph",
    "chapter": "bridges",
    "algo": "bridges_graphBridges",
    "name": "graphBridges should find bridges in graph@graphBridges.test.js",
    "label": "graphBridges should find bridges in graph",
    "testNamePattern": "graphBridges should find bridges in graph",
    "testFilePaths": [
      "src/algorithms/graph/bridges/__test__/graphBridges.test.js"
    ],
    "number": 33
  },
  {
    "chapterGroup": "graph",
    "chapter": "bridges",
    "algo": "bridges_graphBridges",
    "name": "graphBridges should find bridges in graph starting with different root vertex@graphBridges.test.js",
    "label": "graphBridges should find bridges in graph starting with different root vertex",
    "testNamePattern": "graphBridges should find bridges in graph starting with different root vertex",
    "testFilePaths": [
      "src/algorithms/graph/bridges/__test__/graphBridges.test.js"
    ],
    "number": 34
  },
  {
    "chapterGroup": "graph",
    "chapter": "bridges",
    "algo": "bridges_graphBridges",
    "name": "graphBridges should find bridges in yet another graph #1@graphBridges.test.js",
    "label": "graphBridges should find bridges in yet another graph #1",
    "testNamePattern": "graphBridges should find bridges in yet another graph #1",
    "testFilePaths": [
      "src/algorithms/graph/bridges/__test__/graphBridges.test.js"
    ],
    "number": 35
  },
  {
    "chapterGroup": "graph",
    "chapter": "bridges",
    "algo": "bridges_graphBridges",
    "name": "graphBridges should find bridges in yet another graph #2@graphBridges.test.js",
    "label": "graphBridges should find bridges in yet another graph #2",
    "testNamePattern": "graphBridges should find bridges in yet another graph #2",
    "testFilePaths": [
      "src/algorithms/graph/bridges/__test__/graphBridges.test.js"
    ],
    "number": 36
  },
  {
    "chapterGroup": "graph",
    "chapter": "depth-first-search",
    "algo": "depth-first-search_depthFirstSearch",
    "name": "depthFirstSearch should perform DFS operation on graph@depthFirstSearch.test.js",
    "label": "depthFirstSearch should perform DFS operation on graph",
    "testNamePattern": "depthFirstSearch should perform DFS operation on graph",
    "testFilePaths": [
      "src/algorithms/graph/depth-first-search/__test__/depthFirstSearch.test.js"
    ],
    "number": 37
  },
  {
    "chapterGroup": "graph",
    "chapter": "depth-first-search",
    "algo": "depth-first-search_depthFirstSearch",
    "name": "depthFirstSearch allow users to redefine vertex visiting logic@depthFirstSearch.test.js",
    "label": "depthFirstSearch allow users to redefine vertex visiting logic",
    "testNamePattern": "depthFirstSearch allow users to redefine vertex visiting logic",
    "testFilePaths": [
      "src/algorithms/graph/depth-first-search/__test__/depthFirstSearch.test.js"
    ],
    "number": 38
  },
  {
    "chapterGroup": "graph",
    "chapter": "detect-cycle",
    "algo": "detect-cycle_detectDirectedCycle",
    "name": "detectDirectedCycle should detect directed cycle@detectDirectedCycle.test.js",
    "label": "detectDirectedCycle should detect directed cycle",
    "testNamePattern": "detectDirectedCycle should detect directed cycle",
    "testFilePaths": [
      "src/algorithms/graph/detect-cycle/__test__/detectDirectedCycle.test.js"
    ],
    "number": 39
  },
  {
    "chapterGroup": "graph",
    "chapter": "detect-cycle",
    "algo": "detect-cycle_detectUndirectedCycleUsingDisjointSet",
    "name": "detectUndirectedCycleUsingDisjointSet should detect undirected cycle@detectUndirectedCycleUsingDisjointSet.test.js",
    "label": "detectUndirectedCycleUsingDisjointSet should detect undirected cycle",
    "testNamePattern": "detectUndirectedCycleUsingDisjointSet should detect undirected cycle",
    "testFilePaths": [
      "src/algorithms/graph/detect-cycle/__test__/detectUndirectedCycleUsingDisjointSet.test.js"
    ],
    "number": 40
  },
  {
    "chapterGroup": "graph",
    "chapter": "detect-cycle",
    "algo": "detect-cycle_detectUndirectedCycle",
    "name": "detectUndirectedCycle should detect undirected cycle@detectUndirectedCycle.test.js",
    "label": "detectUndirectedCycle should detect undirected cycle",
    "testNamePattern": "detectUndirectedCycle should detect undirected cycle",
    "testFilePaths": [
      "src/algorithms/graph/detect-cycle/__test__/detectUndirectedCycle.test.js"
    ],
    "number": 41
  },
  {
    "chapterGroup": "graph",
    "chapter": "dijkstra",
    "algo": "dijkstra_dijkstra",
    "name": "dijkstra should find minimum paths to all vertices for undirected graph@dijkstra.test.js",
    "label": "dijkstra should find minimum paths to all vertices for undirected graph",
    "testNamePattern": "dijkstra should find minimum paths to all vertices for undirected graph",
    "testFilePaths": [
      "src/algorithms/graph/dijkstra/__test__/dijkstra.test.js"
    ],
    "number": 42
  },
  {
    "chapterGroup": "graph",
    "chapter": "dijkstra",
    "algo": "dijkstra_dijkstra",
    "name": "dijkstra should find minimum paths to all vertices for directed graph with negative edge weights@dijkstra.test.js",
    "label": "dijkstra should find minimum paths to all vertices for directed graph with negative edge weights",
    "testNamePattern": "dijkstra should find minimum paths to all vertices for directed graph with negative edge weights",
    "testFilePaths": [
      "src/algorithms/graph/dijkstra/__test__/dijkstra.test.js"
    ],
    "number": 43
  },
  {
    "chapterGroup": "graph",
    "chapter": "eulerian-path",
    "algo": "eulerian-path_eulerianPath",
    "name": "eulerianPath should throw an error when graph is not Eulerian@eulerianPath.test.js",
    "label": "eulerianPath should throw an error when graph is not Eulerian",
    "testNamePattern": "eulerianPath should throw an error when graph is not Eulerian",
    "testFilePaths": [
      "src/algorithms/graph/eulerian-path/__test__/eulerianPath.test.js"
    ],
    "number": 44
  },
  {
    "chapterGroup": "graph",
    "chapter": "eulerian-path",
    "algo": "eulerian-path_eulerianPath",
    "name": "eulerianPath should find Eulerian Circuit in graph@eulerianPath.test.js",
    "label": "eulerianPath should find Eulerian Circuit in graph",
    "testNamePattern": "eulerianPath should find Eulerian Circuit in graph",
    "testFilePaths": [
      "src/algorithms/graph/eulerian-path/__test__/eulerianPath.test.js"
    ],
    "number": 45
  },
  {
    "chapterGroup": "graph",
    "chapter": "eulerian-path",
    "algo": "eulerian-path_eulerianPath",
    "name": "eulerianPath should find Eulerian Path in graph@eulerianPath.test.js",
    "label": "eulerianPath should find Eulerian Path in graph",
    "testNamePattern": "eulerianPath should find Eulerian Path in graph",
    "testFilePaths": [
      "src/algorithms/graph/eulerian-path/__test__/eulerianPath.test.js"
    ],
    "number": 46
  },
  {
    "chapterGroup": "graph",
    "chapter": "floyd-warshall",
    "algo": "floyd-warshall_floydWarshall",
    "name": "floydWarshall should find minimum paths to all vertices for undirected graph@floydWarshall.test.js",
    "label": "floydWarshall should find minimum paths to all vertices for undirected graph",
    "testNamePattern": "floydWarshall should find minimum paths to all vertices for undirected graph",
    "testFilePaths": [
      "src/algorithms/graph/floyd-warshall/__test__/floydWarshall.test.js"
    ],
    "number": 47
  },
  {
    "chapterGroup": "graph",
    "chapter": "floyd-warshall",
    "algo": "floyd-warshall_floydWarshall",
    "name": "floydWarshall should find minimum paths to all vertices for directed graph@floydWarshall.test.js",
    "label": "floydWarshall should find minimum paths to all vertices for directed graph",
    "testNamePattern": "floydWarshall should find minimum paths to all vertices for directed graph",
    "testFilePaths": [
      "src/algorithms/graph/floyd-warshall/__test__/floydWarshall.test.js"
    ],
    "number": 48
  },
  {
    "chapterGroup": "graph",
    "chapter": "floyd-warshall",
    "algo": "floyd-warshall_floydWarshall",
    "name": "floydWarshall should find minimum paths to all vertices for directed graph with negative edge weights@floydWarshall.test.js",
    "label": "floydWarshall should find minimum paths to all vertices for directed graph with negative edge weights",
    "testNamePattern": "floydWarshall should find minimum paths to all vertices for directed graph with negative edge weights",
    "testFilePaths": [
      "src/algorithms/graph/floyd-warshall/__test__/floydWarshall.test.js"
    ],
    "number": 49
  },
  {
    "chapterGroup": "graph",
    "chapter": "hamiltonian-cycle",
    "algo": "hamiltonian-cycle_hamiltonianCycle",
    "name": "hamiltonianCycle should find hamiltonian paths in graph@hamiltonianCycle.test.js",
    "label": "hamiltonianCycle should find hamiltonian paths in graph",
    "testNamePattern": "hamiltonianCycle should find hamiltonian paths in graph",
    "testFilePaths": [
      "src/algorithms/graph/hamiltonian-cycle/__test__/hamiltonianCycle.test.js"
    ],
    "number": 50
  },
  {
    "chapterGroup": "graph",
    "chapter": "hamiltonian-cycle",
    "algo": "hamiltonian-cycle_hamiltonianCycle",
    "name": "hamiltonianCycle should return false for graph without Hamiltonian path@hamiltonianCycle.test.js",
    "label": "hamiltonianCycle should return false for graph without Hamiltonian path",
    "testNamePattern": "hamiltonianCycle should return false for graph without Hamiltonian path",
    "testFilePaths": [
      "src/algorithms/graph/hamiltonian-cycle/__test__/hamiltonianCycle.test.js"
    ],
    "number": 51
  },
  {
    "chapterGroup": "graph",
    "chapter": "kruskal",
    "algo": "kruskal_kruskal",
    "name": "kruskal should fire an error for directed graph@kruskal.test.js",
    "label": "kruskal should fire an error for directed graph",
    "testNamePattern": "kruskal should fire an error for directed graph",
    "testFilePaths": [
      "src/algorithms/graph/kruskal/__test__/kruskal.test.js"
    ],
    "number": 52
  },
  {
    "chapterGroup": "graph",
    "chapter": "kruskal",
    "algo": "kruskal_kruskal",
    "name": "kruskal should find minimum spanning tree@kruskal.test.js",
    "label": "kruskal should find minimum spanning tree",
    "testNamePattern": "kruskal should find minimum spanning tree",
    "testFilePaths": [
      "src/algorithms/graph/kruskal/__test__/kruskal.test.js"
    ],
    "number": 53
  },
  {
    "chapterGroup": "graph",
    "chapter": "kruskal",
    "algo": "kruskal_kruskal",
    "name": "kruskal should find minimum spanning tree for simple graph@kruskal.test.js",
    "label": "kruskal should find minimum spanning tree for simple graph",
    "testNamePattern": "kruskal should find minimum spanning tree for simple graph",
    "testFilePaths": [
      "src/algorithms/graph/kruskal/__test__/kruskal.test.js"
    ],
    "number": 54
  },
  {
    "chapterGroup": "graph",
    "chapter": "prim",
    "algo": "prim_prim",
    "name": "prim should fire an error for directed graph@prim.test.js",
    "label": "prim should fire an error for directed graph",
    "testNamePattern": "prim should fire an error for directed graph",
    "testFilePaths": [
      "src/algorithms/graph/prim/__test__/prim.test.js"
    ],
    "number": 55
  },
  {
    "chapterGroup": "graph",
    "chapter": "prim",
    "algo": "prim_prim",
    "name": "prim should find minimum spanning tree@prim.test.js",
    "label": "prim should find minimum spanning tree",
    "testNamePattern": "prim should find minimum spanning tree",
    "testFilePaths": [
      "src/algorithms/graph/prim/__test__/prim.test.js"
    ],
    "number": 56
  },
  {
    "chapterGroup": "graph",
    "chapter": "prim",
    "algo": "prim_prim",
    "name": "prim should find minimum spanning tree for simple graph@prim.test.js",
    "label": "prim should find minimum spanning tree for simple graph",
    "testNamePattern": "prim should find minimum spanning tree for simple graph",
    "testFilePaths": [
      "src/algorithms/graph/prim/__test__/prim.test.js"
    ],
    "number": 57
  },
  {
    "chapterGroup": "graph",
    "chapter": "strongly-connected-components",
    "algo": "strongly-connected-components_stronglyConnectedComponents",
    "name": "stronglyConnectedComponents should detect strongly connected components in simple graph@stronglyConnectedComponents.test.js",
    "label": "stronglyConnectedComponents should detect strongly connected components in simple graph",
    "testNamePattern": "stronglyConnectedComponents should detect strongly connected components in simple graph",
    "testFilePaths": [
      "src/algorithms/graph/strongly-connected-components/__test__/stronglyConnectedComponents.test.js"
    ],
    "number": 58
  },
  {
    "chapterGroup": "graph",
    "chapter": "strongly-connected-components",
    "algo": "strongly-connected-components_stronglyConnectedComponents",
    "name": "stronglyConnectedComponents should detect strongly connected components in graph@stronglyConnectedComponents.test.js",
    "label": "stronglyConnectedComponents should detect strongly connected components in graph",
    "testNamePattern": "stronglyConnectedComponents should detect strongly connected components in graph",
    "testFilePaths": [
      "src/algorithms/graph/strongly-connected-components/__test__/stronglyConnectedComponents.test.js"
    ],
    "number": 59
  },
  {
    "chapterGroup": "graph",
    "chapter": "topological-sorting",
    "algo": "topological-sorting_topologicalSort",
    "name": "topologicalSort should do topological sorting on graph@topologicalSort.test.js",
    "label": "topologicalSort should do topological sorting on graph",
    "testNamePattern": "topologicalSort should do topological sorting on graph",
    "testFilePaths": [
      "src/algorithms/graph/topological-sorting/__test__/topologicalSort.test.js"
    ],
    "number": 60
  },
  {
    "chapterGroup": "graph",
    "chapter": "travelling-salesman",
    "algo": "travelling-salesman_bfTravellingSalesman",
    "name": "bfTravellingSalesman should solve problem for simple graph@bfTravellingSalesman.test.js",
    "label": "bfTravellingSalesman should solve problem for simple graph",
    "testNamePattern": "bfTravellingSalesman should solve problem for simple graph",
    "testFilePaths": [
      "src/algorithms/graph/travelling-salesman/__test__/bfTravellingSalesman.test.js"
    ],
    "number": 61
  },
  {
    "chapterGroup": "image-processing",
    "chapter": "seam-carving",
    "algo": "seam-carving_resizeImageWidth",
    "name": "resizeImageWidth should perform content-aware image width reduction@resizeImageWidth.test.js",
    "label": "resizeImageWidth should perform content-aware image width reduction",
    "testNamePattern": "resizeImageWidth should perform content-aware image width reduction",
    "testFilePaths": [
      "src/algorithms/image-processing/seam-carving/__tests__/resizeImageWidth.test.js"
    ],
    "number": 62
  },
  {
    "chapterGroup": "linked-list",
    "chapter": "reverse-traversal",
    "algo": "reverse-traversal_reverseTraversal",
    "name": "reverseTraversal should traverse linked list in reverse order@reverseTraversal.test.js",
    "label": "reverseTraversal should traverse linked list in reverse order",
    "testNamePattern": "reverseTraversal should traverse linked list in reverse order",
    "testFilePaths": [
      "src/algorithms/linked-list/reverse-traversal/__test__/reverseTraversal.test.js"
    ],
    "number": 63
  },
  {
    "chapterGroup": "linked-list",
    "chapter": "traversal",
    "algo": "traversal_traversal",
    "name": "traversal should traverse linked list@traversal.test.js",
    "label": "traversal should traverse linked list",
    "testNamePattern": "traversal should traverse linked list",
    "testFilePaths": [
      "src/algorithms/linked-list/traversal/__test__/traversal.test.js"
    ],
    "number": 64
  },
  {
    "chapterGroup": "math",
    "chapter": "binary-floating-point",
    "algo": "binary-floating-point_bitsToFloat",
    "name": "bitsToFloat16 should convert floating point binary bits to floating point decimal number@bitsToFloat.test.js",
    "label": "bitsToFloat16 should convert floating point binary bits to floating point decimal number",
    "testNamePattern": "bitsToFloat16 should convert floating point binary bits to floating point decimal number",
    "testFilePaths": [
      "src/algorithms/math/binary-floating-point/__tests__/bitsToFloat.test.js"
    ],
    "number": 65
  },
  {
    "chapterGroup": "math",
    "chapter": "binary-floating-point",
    "algo": "binary-floating-point_bitsToFloat",
    "name": "bitsToFloat32 should convert floating point binary bits to floating point decimal number@bitsToFloat.test.js",
    "label": "bitsToFloat32 should convert floating point binary bits to floating point decimal number",
    "testNamePattern": "bitsToFloat32 should convert floating point binary bits to floating point decimal number",
    "testFilePaths": [
      "src/algorithms/math/binary-floating-point/__tests__/bitsToFloat.test.js"
    ],
    "number": 66
  },
  {
    "chapterGroup": "math",
    "chapter": "binary-floating-point",
    "algo": "binary-floating-point_bitsToFloat",
    "name": "bitsToFloat64 should convert floating point binary bits to floating point decimal number@bitsToFloat.test.js",
    "label": "bitsToFloat64 should convert floating point binary bits to floating point decimal number",
    "testNamePattern": "bitsToFloat64 should convert floating point binary bits to floating point decimal number",
    "testFilePaths": [
      "src/algorithms/math/binary-floating-point/__tests__/bitsToFloat.test.js"
    ],
    "number": 67
  },
  {
    "chapterGroup": "math",
    "chapter": "binary-floating-point",
    "algo": "binary-floating-point_floatAsBinaryString",
    "name": "floatAs32Binary should create a binary representation of the floating numbers@floatAsBinaryString.test.js",
    "label": "floatAs32Binary should create a binary representation of the floating numbers",
    "testNamePattern": "floatAs32Binary should create a binary representation of the floating numbers",
    "testFilePaths": [
      "src/algorithms/math/binary-floating-point/__tests__/floatAsBinaryString.test.js"
    ],
    "number": 68
  },
  {
    "chapterGroup": "math",
    "chapter": "binary-floating-point",
    "algo": "binary-floating-point_floatAsBinaryString",
    "name": "floatAs64Binary should create a binary representation of the floating numbers@floatAsBinaryString.test.js",
    "label": "floatAs64Binary should create a binary representation of the floating numbers",
    "testNamePattern": "floatAs64Binary should create a binary representation of the floating numbers",
    "testFilePaths": [
      "src/algorithms/math/binary-floating-point/__tests__/floatAsBinaryString.test.js"
    ],
    "number": 69
  },
  {
    "chapterGroup": "math",
    "chapter": "bits",
    "algo": "bits_bitLength",
    "name": "bitLength should calculate number of bits that the number is consists of@bitLength.test.js",
    "label": "bitLength should calculate number of bits that the number is consists of",
    "testNamePattern": "bitLength should calculate number of bits that the number is consists of",
    "testFilePaths": [
      "src/algorithms/math/bits/__test__/bitLength.test.js"
    ],
    "number": 70
  },
  {
    "chapterGroup": "math",
    "chapter": "bits",
    "algo": "bits_isPowerOfTwo",
    "name": "isPowerOfTwo should detect if the number is power of two@isPowerOfTwo.test.js",
    "label": "isPowerOfTwo should detect if the number is power of two",
    "testNamePattern": "isPowerOfTwo should detect if the number is power of two",
    "testFilePaths": [
      "src/algorithms/math/bits/__test__/isPowerOfTwo.test.js"
    ],
    "number": 71
  },
  {
    "chapterGroup": "math",
    "chapter": "bits",
    "algo": "bits_updateBit",
    "name": "updateBit should update bit at specific position@updateBit.test.js",
    "label": "updateBit should update bit at specific position",
    "testNamePattern": "updateBit should update bit at specific position",
    "testFilePaths": [
      "src/algorithms/math/bits/__test__/updateBit.test.js"
    ],
    "number": 72
  },
  {
    "chapterGroup": "math",
    "chapter": "bits",
    "algo": "bits_isPositive",
    "name": "isPositive should detect if a number is positive@isPositive.test.js",
    "label": "isPositive should detect if a number is positive",
    "testNamePattern": "isPositive should detect if a number is positive",
    "testFilePaths": [
      "src/algorithms/math/bits/__test__/isPositive.test.js"
    ],
    "number": 73
  },
  {
    "chapterGroup": "math",
    "chapter": "bits",
    "algo": "bits_isEven",
    "name": "isEven should detect if a number is even@isEven.test.js",
    "label": "isEven should detect if a number is even",
    "testNamePattern": "isEven should detect if a number is even",
    "testFilePaths": [
      "src/algorithms/math/bits/__test__/isEven.test.js"
    ],
    "number": 74
  },
  {
    "chapterGroup": "math",
    "chapter": "bits",
    "algo": "bits_fullAdder",
    "name": "fullAdder should add up two numbers@fullAdder.test.js",
    "label": "fullAdder should add up two numbers",
    "testNamePattern": "fullAdder should add up two numbers",
    "testFilePaths": [
      "src/algorithms/math/bits/__test__/fullAdder.test.js"
    ],
    "number": 75
  },
  {
    "chapterGroup": "math",
    "chapter": "bits",
    "algo": "bits_countSetBits",
    "name": "countSetBits should return number of set bits@countSetBits.test.js",
    "label": "countSetBits should return number of set bits",
    "testNamePattern": "countSetBits should return number of set bits",
    "testFilePaths": [
      "src/algorithms/math/bits/__test__/countSetBits.test.js"
    ],
    "number": 76
  },
  {
    "chapterGroup": "math",
    "chapter": "bits",
    "algo": "bits_multiplyUnsigned",
    "name": "multiplyUnsigned should multiply two unsigned numbers@multiplyUnsigned.test.js",
    "label": "multiplyUnsigned should multiply two unsigned numbers",
    "testNamePattern": "multiplyUnsigned should multiply two unsigned numbers",
    "testFilePaths": [
      "src/algorithms/math/bits/__test__/multiplyUnsigned.test.js"
    ],
    "number": 77
  },
  {
    "chapterGroup": "math",
    "chapter": "bits",
    "algo": "bits_getBit",
    "name": "getBit should get bit at specific position@getBit.test.js",
    "label": "getBit should get bit at specific position",
    "testNamePattern": "getBit should get bit at specific position",
    "testFilePaths": [
      "src/algorithms/math/bits/__test__/getBit.test.js"
    ],
    "number": 78
  },
  {
    "chapterGroup": "math",
    "chapter": "bits",
    "algo": "bits_multiply",
    "name": "multiply should multiply two numbers@multiply.test.js",
    "label": "multiply should multiply two numbers",
    "testNamePattern": "multiply should multiply two numbers",
    "testFilePaths": [
      "src/algorithms/math/bits/__test__/multiply.test.js"
    ],
    "number": 79
  },
  {
    "chapterGroup": "math",
    "chapter": "bits",
    "algo": "bits_switchSign",
    "name": "switchSign should switch the sign of the number using twos complement approach@switchSign.test.js",
    "label": "switchSign should switch the sign of the number using twos complement approach",
    "testNamePattern": "switchSign should switch the sign of the number using twos complement approach",
    "testFilePaths": [
      "src/algorithms/math/bits/__test__/switchSign.test.js"
    ],
    "number": 80
  },
  {
    "chapterGroup": "math",
    "chapter": "bits",
    "algo": "bits_bitsDiff",
    "name": "bitsDiff should calculate bits difference between two numbers@bitsDiff.test.js",
    "label": "bitsDiff should calculate bits difference between two numbers",
    "testNamePattern": "bitsDiff should calculate bits difference between two numbers",
    "testFilePaths": [
      "src/algorithms/math/bits/__test__/bitsDiff.test.js"
    ],
    "number": 81
  },
  {
    "chapterGroup": "math",
    "chapter": "bits",
    "algo": "bits_multiplyByTwo",
    "name": "multiplyByTwo should multiply numbers by two using bitwise operations@multiplyByTwo.test.js",
    "label": "multiplyByTwo should multiply numbers by two using bitwise operations",
    "testNamePattern": "multiplyByTwo should multiply numbers by two using bitwise operations",
    "testFilePaths": [
      "src/algorithms/math/bits/__test__/multiplyByTwo.test.js"
    ],
    "number": 82
  },
  {
    "chapterGroup": "math",
    "chapter": "bits",
    "algo": "bits_clearBit",
    "name": "clearBit should clear bit at specific position@clearBit.test.js",
    "label": "clearBit should clear bit at specific position",
    "testNamePattern": "clearBit should clear bit at specific position",
    "testFilePaths": [
      "src/algorithms/math/bits/__test__/clearBit.test.js"
    ],
    "number": 83
  },
  {
    "chapterGroup": "math",
    "chapter": "bits",
    "algo": "bits_divideByTwo",
    "name": "divideByTwo should divide numbers by two using bitwise operations@divideByTwo.test.js",
    "label": "divideByTwo should divide numbers by two using bitwise operations",
    "testNamePattern": "divideByTwo should divide numbers by two using bitwise operations",
    "testFilePaths": [
      "src/algorithms/math/bits/__test__/divideByTwo.test.js"
    ],
    "number": 84
  },
  {
    "chapterGroup": "math",
    "chapter": "bits",
    "algo": "bits_setBit",
    "name": "setBit should set bit at specific position@setBit.test.js",
    "label": "setBit should set bit at specific position",
    "testNamePattern": "setBit should set bit at specific position",
    "testFilePaths": [
      "src/algorithms/math/bits/__test__/setBit.test.js"
    ],
    "number": 85
  },
  {
    "chapterGroup": "math",
    "chapter": "complex-number",
    "algo": "complex-number_ComplexNumber",
    "name": "ComplexNumber should create complex numbers@ComplexNumber.test.js",
    "label": "ComplexNumber should create complex numbers",
    "testNamePattern": "ComplexNumber should create complex numbers",
    "testFilePaths": [
      "src/algorithms/math/complex-number/__test__/ComplexNumber.test.js"
    ],
    "number": 86
  },
  {
    "chapterGroup": "math",
    "chapter": "complex-number",
    "algo": "complex-number_ComplexNumber",
    "name": "ComplexNumber should add complex numbers@ComplexNumber.test.js",
    "label": "ComplexNumber should add complex numbers",
    "testNamePattern": "ComplexNumber should add complex numbers",
    "testFilePaths": [
      "src/algorithms/math/complex-number/__test__/ComplexNumber.test.js"
    ],
    "number": 87
  },
  {
    "chapterGroup": "math",
    "chapter": "complex-number",
    "algo": "complex-number_ComplexNumber",
    "name": "ComplexNumber should add complex and natural numbers@ComplexNumber.test.js",
    "label": "ComplexNumber should add complex and natural numbers",
    "testNamePattern": "ComplexNumber should add complex and natural numbers",
    "testFilePaths": [
      "src/algorithms/math/complex-number/__test__/ComplexNumber.test.js"
    ],
    "number": 88
  },
  {
    "chapterGroup": "math",
    "chapter": "complex-number",
    "algo": "complex-number_ComplexNumber",
    "name": "ComplexNumber should subtract complex numbers@ComplexNumber.test.js",
    "label": "ComplexNumber should subtract complex numbers",
    "testNamePattern": "ComplexNumber should subtract complex numbers",
    "testFilePaths": [
      "src/algorithms/math/complex-number/__test__/ComplexNumber.test.js"
    ],
    "number": 89
  },
  {
    "chapterGroup": "math",
    "chapter": "complex-number",
    "algo": "complex-number_ComplexNumber",
    "name": "ComplexNumber should subtract complex and natural numbers@ComplexNumber.test.js",
    "label": "ComplexNumber should subtract complex and natural numbers",
    "testNamePattern": "ComplexNumber should subtract complex and natural numbers",
    "testFilePaths": [
      "src/algorithms/math/complex-number/__test__/ComplexNumber.test.js"
    ],
    "number": 90
  },
  {
    "chapterGroup": "math",
    "chapter": "complex-number",
    "algo": "complex-number_ComplexNumber",
    "name": "ComplexNumber should multiply complex numbers@ComplexNumber.test.js",
    "label": "ComplexNumber should multiply complex numbers",
    "testNamePattern": "ComplexNumber should multiply complex numbers",
    "testFilePaths": [
      "src/algorithms/math/complex-number/__test__/ComplexNumber.test.js"
    ],
    "number": 91
  },
  {
    "chapterGroup": "math",
    "chapter": "complex-number",
    "algo": "complex-number_ComplexNumber",
    "name": "ComplexNumber should multiply complex numbers by themselves@ComplexNumber.test.js",
    "label": "ComplexNumber should multiply complex numbers by themselves",
    "testNamePattern": "ComplexNumber should multiply complex numbers by themselves",
    "testFilePaths": [
      "src/algorithms/math/complex-number/__test__/ComplexNumber.test.js"
    ],
    "number": 92
  },
  {
    "chapterGroup": "math",
    "chapter": "complex-number",
    "algo": "complex-number_ComplexNumber",
    "name": "ComplexNumber should calculate i in power of two@ComplexNumber.test.js",
    "label": "ComplexNumber should calculate i in power of two",
    "testNamePattern": "ComplexNumber should calculate i in power of two",
    "testFilePaths": [
      "src/algorithms/math/complex-number/__test__/ComplexNumber.test.js"
    ],
    "number": 93
  },
  {
    "chapterGroup": "math",
    "chapter": "complex-number",
    "algo": "complex-number_ComplexNumber",
    "name": "ComplexNumber should divide complex numbers@ComplexNumber.test.js",
    "label": "ComplexNumber should divide complex numbers",
    "testNamePattern": "ComplexNumber should divide complex numbers",
    "testFilePaths": [
      "src/algorithms/math/complex-number/__test__/ComplexNumber.test.js"
    ],
    "number": 94
  },
  {
    "chapterGroup": "math",
    "chapter": "complex-number",
    "algo": "complex-number_ComplexNumber",
    "name": "ComplexNumber should return complex number in polar form@ComplexNumber.test.js",
    "label": "ComplexNumber should return complex number in polar form",
    "testNamePattern": "ComplexNumber should return complex number in polar form",
    "testFilePaths": [
      "src/algorithms/math/complex-number/__test__/ComplexNumber.test.js"
    ],
    "number": 95
  },
  {
    "chapterGroup": "math",
    "chapter": "euclidean-algorithm",
    "algo": "euclidean-algorithm_euclideanAlgorithmIterative",
    "name": "euclideanAlgorithmIterative should calculate GCD iteratively@euclideanAlgorithmIterative.test.js",
    "label": "euclideanAlgorithmIterative should calculate GCD iteratively",
    "testNamePattern": "euclideanAlgorithmIterative should calculate GCD iteratively",
    "testFilePaths": [
      "src/algorithms/math/euclidean-algorithm/__test__/euclideanAlgorithmIterative.test.js"
    ],
    "number": 96
  },
  {
    "chapterGroup": "math",
    "chapter": "euclidean-algorithm",
    "algo": "euclidean-algorithm_euclideanAlgorithm",
    "name": "euclideanAlgorithm should calculate GCD recursively@euclideanAlgorithm.test.js",
    "label": "euclideanAlgorithm should calculate GCD recursively",
    "testNamePattern": "euclideanAlgorithm should calculate GCD recursively",
    "testFilePaths": [
      "src/algorithms/math/euclidean-algorithm/__test__/euclideanAlgorithm.test.js"
    ],
    "number": 97
  },
  {
    "chapterGroup": "math",
    "chapter": "euclidean-distance",
    "algo": "euclidean-distance_euclideanDistance",
    "name": "euclideanDistance should calculate euclidean distance between vectors@euclideanDistance.test.js",
    "label": "euclideanDistance should calculate euclidean distance between vectors",
    "testNamePattern": "euclideanDistance should calculate euclidean distance between vectors",
    "testFilePaths": [
      "src/algorithms/math/euclidean-distance/__tests__/euclideanDistance.test.js"
    ],
    "number": 98
  },
  {
    "chapterGroup": "math",
    "chapter": "euclidean-distance",
    "algo": "euclidean-distance_euclideanDistance",
    "name": "euclideanDistance should throw an error in case if two matrices are of different shapes@euclideanDistance.test.js",
    "label": "euclideanDistance should throw an error in case if two matrices are of different shapes",
    "testNamePattern": "euclideanDistance should throw an error in case if two matrices are of different shapes",
    "testFilePaths": [
      "src/algorithms/math/euclidean-distance/__tests__/euclideanDistance.test.js"
    ],
    "number": 99
  },
  {
    "chapterGroup": "math",
    "chapter": "factorial",
    "algo": "factorial_factorialRecursive",
    "name": "factorialRecursive should calculate factorial@factorialRecursive.test.js",
    "label": "factorialRecursive should calculate factorial",
    "testNamePattern": "factorialRecursive should calculate factorial",
    "testFilePaths": [
      "src/algorithms/math/factorial/__test__/factorialRecursive.test.js"
    ],
    "number": 100
  },
  {
    "chapterGroup": "math",
    "chapter": "factorial",
    "algo": "factorial_factorial",
    "name": "factorial should calculate factorial@factorial.test.js",
    "label": "factorial should calculate factorial",
    "testNamePattern": "factorial should calculate factorial",
    "testFilePaths": [
      "src/algorithms/math/factorial/__test__/factorial.test.js"
    ],
    "number": 101
  },
  {
    "chapterGroup": "math",
    "chapter": "fast-powering",
    "algo": "fast-powering_fastPowering",
    "name": "fastPowering should compute power in log(n) time@fastPowering.test.js",
    "label": "fastPowering should compute power in log(n) time",
    "testNamePattern": "fastPowering should compute power in log.n. time",
    "testFilePaths": [
      "src/algorithms/math/fast-powering/__test__/fastPowering.test.js"
    ],
    "number": 102
  },
  {
    "chapterGroup": "math",
    "chapter": "fibonacci",
    "algo": "fibonacci_fibonacciNthClosedForm",
    "name": "fibonacciClosedForm should throw an error when trying to calculate fibonacci for not allowed positions@fibonacciNthClosedForm.test.js",
    "label": "fibonacciClosedForm should throw an error when trying to calculate fibonacci for not allowed positions",
    "testNamePattern": "fibonacciClosedForm should throw an error when trying to calculate fibonacci for not allowed positions",
    "testFilePaths": [
      "src/algorithms/math/fibonacci/__test__/fibonacciNthClosedForm.test.js"
    ],
    "number": 103
  },
  {
    "chapterGroup": "math",
    "chapter": "fibonacci",
    "algo": "fibonacci_fibonacciNthClosedForm",
    "name": "fibonacciClosedForm should calculate fibonacci correctly@fibonacciNthClosedForm.test.js",
    "label": "fibonacciClosedForm should calculate fibonacci correctly",
    "testNamePattern": "fibonacciClosedForm should calculate fibonacci correctly",
    "testFilePaths": [
      "src/algorithms/math/fibonacci/__test__/fibonacciNthClosedForm.test.js"
    ],
    "number": 104
  },
  {
    "chapterGroup": "math",
    "chapter": "fibonacci",
    "algo": "fibonacci_fibonacciNth",
    "name": "fibonacciNth should calculate fibonacci correctly@fibonacciNth.test.js",
    "label": "fibonacciNth should calculate fibonacci correctly",
    "testNamePattern": "fibonacciNth should calculate fibonacci correctly",
    "testFilePaths": [
      "src/algorithms/math/fibonacci/__test__/fibonacciNth.test.js"
    ],
    "number": 105
  },
  {
    "chapterGroup": "math",
    "chapter": "fibonacci",
    "algo": "fibonacci_fibonacci",
    "name": "fibonacci should calculate fibonacci correctly@fibonacci.test.js",
    "label": "fibonacci should calculate fibonacci correctly",
    "testNamePattern": "fibonacci should calculate fibonacci correctly",
    "testFilePaths": [
      "src/algorithms/math/fibonacci/__test__/fibonacci.test.js"
    ],
    "number": 106
  },
  {
    "chapterGroup": "math",
    "chapter": "fourier-transform",
    "algo": "fourier-transform_fastFourierTransform",
    "name": "fastFourierTransform should calculate the radix-2 discrete fourier transform #1@fastFourierTransform.test.js",
    "label": "fastFourierTransform should calculate the radix-2 discrete fourier transform #1",
    "testNamePattern": "fastFourierTransform should calculate the radix-2 discrete fourier transform #1",
    "testFilePaths": [
      "src/algorithms/math/fourier-transform/__test__/fastFourierTransform.test.js"
    ],
    "number": 107
  },
  {
    "chapterGroup": "math",
    "chapter": "fourier-transform",
    "algo": "fourier-transform_fastFourierTransform",
    "name": "fastFourierTransform should calculate the radix-2 discrete fourier transform #2@fastFourierTransform.test.js",
    "label": "fastFourierTransform should calculate the radix-2 discrete fourier transform #2",
    "testNamePattern": "fastFourierTransform should calculate the radix-2 discrete fourier transform #2",
    "testFilePaths": [
      "src/algorithms/math/fourier-transform/__test__/fastFourierTransform.test.js"
    ],
    "number": 108
  },
  {
    "chapterGroup": "math",
    "chapter": "fourier-transform",
    "algo": "fourier-transform_fastFourierTransform",
    "name": "fastFourierTransform should calculate the radix-2 discrete fourier transform #3@fastFourierTransform.test.js",
    "label": "fastFourierTransform should calculate the radix-2 discrete fourier transform #3",
    "testNamePattern": "fastFourierTransform should calculate the radix-2 discrete fourier transform #3",
    "testFilePaths": [
      "src/algorithms/math/fourier-transform/__test__/fastFourierTransform.test.js"
    ],
    "number": 109
  },
  {
    "chapterGroup": "math",
    "chapter": "fourier-transform",
    "algo": "fourier-transform_inverseDiscreteFourierTransform",
    "name": "inverseDiscreteFourierTransform should calculate output signal out of input frequencies@inverseDiscreteFourierTransform.test.js",
    "label": "inverseDiscreteFourierTransform should calculate output signal out of input frequencies",
    "testNamePattern": "inverseDiscreteFourierTransform should calculate output signal out of input frequencies",
    "testFilePaths": [
      "src/algorithms/math/fourier-transform/__test__/inverseDiscreteFourierTransform.test.js"
    ],
    "number": 110
  },
  {
    "chapterGroup": "math",
    "chapter": "fourier-transform",
    "algo": "fourier-transform_discreteFourierTransform",
    "name": "discreteFourierTransform should split signal into frequencies@discreteFourierTransform.test.js",
    "label": "discreteFourierTransform should split signal into frequencies",
    "testNamePattern": "discreteFourierTransform should split signal into frequencies",
    "testFilePaths": [
      "src/algorithms/math/fourier-transform/__test__/discreteFourierTransform.test.js"
    ],
    "number": 111
  },
  {
    "chapterGroup": "math",
    "chapter": "horner-method",
    "algo": "horner-method_hornerMethod",
    "name": "hornerMethod should evaluate the polynomial for the specified value of x correctly@hornerMethod.test.js",
    "label": "hornerMethod should evaluate the polynomial for the specified value of x correctly",
    "testNamePattern": "hornerMethod should evaluate the polynomial for the specified value of x correctly",
    "testFilePaths": [
      "src/algorithms/math/horner-method/__test__/hornerMethod.test.js"
    ],
    "number": 112
  },
  {
    "chapterGroup": "math",
    "chapter": "horner-method",
    "algo": "horner-method_hornerMethod",
    "name": "hornerMethod should evaluate the same polynomial value as classical approach@hornerMethod.test.js",
    "label": "hornerMethod should evaluate the same polynomial value as classical approach",
    "testNamePattern": "hornerMethod should evaluate the same polynomial value as classical approach",
    "testFilePaths": [
      "src/algorithms/math/horner-method/__test__/hornerMethod.test.js"
    ],
    "number": 113
  },
  {
    "chapterGroup": "math",
    "chapter": "horner-method",
    "algo": "horner-method_classicPolynome",
    "name": "classicPolynome should evaluate the polynomial for the specified value of x correctly@classicPolynome.test.js",
    "label": "classicPolynome should evaluate the polynomial for the specified value of x correctly",
    "testNamePattern": "classicPolynome should evaluate the polynomial for the specified value of x correctly",
    "testFilePaths": [
      "src/algorithms/math/horner-method/__test__/classicPolynome.test.js"
    ],
    "number": 114
  },
  {
    "chapterGroup": "math",
    "chapter": "integer-partition",
    "algo": "integer-partition_integerPartition",
    "name": "integerPartition should partition the number@integerPartition.test.js",
    "label": "integerPartition should partition the number",
    "testNamePattern": "integerPartition should partition the number",
    "testFilePaths": [
      "src/algorithms/math/integer-partition/__test__/integerPartition.test.js"
    ],
    "number": 115
  },
  {
    "chapterGroup": "math",
    "chapter": "is-power-of-two",
    "algo": "is-power-of-two_isPowerOfTwoBitwise",
    "name": "isPowerOfTwoBitwise should check if the number is made by multiplying twos@isPowerOfTwoBitwise.test.js",
    "label": "isPowerOfTwoBitwise should check if the number is made by multiplying twos",
    "testNamePattern": "isPowerOfTwoBitwise should check if the number is made by multiplying twos",
    "testFilePaths": [
      "src/algorithms/math/is-power-of-two/__test__/isPowerOfTwoBitwise.test.js"
    ],
    "number": 116
  },
  {
    "chapterGroup": "math",
    "chapter": "is-power-of-two",
    "algo": "is-power-of-two_isPowerOfTwo",
    "name": "isPowerOfTwo should check if the number is made by multiplying twos@isPowerOfTwo.test.js",
    "label": "isPowerOfTwo should check if the number is made by multiplying twos",
    "testNamePattern": "isPowerOfTwo should check if the number is made by multiplying twos",
    "testFilePaths": [
      "src/algorithms/math/is-power-of-two/__test__/isPowerOfTwo.test.js"
    ],
    "number": 117
  },
  {
    "chapterGroup": "math",
    "chapter": "least-common-multiple",
    "algo": "least-common-multiple_leastCommonMultiple",
    "name": "leastCommonMultiple should find least common multiple@leastCommonMultiple.test.js",
    "label": "leastCommonMultiple should find least common multiple",
    "testNamePattern": "leastCommonMultiple should find least common multiple",
    "testFilePaths": [
      "src/algorithms/math/least-common-multiple/__test__/leastCommonMultiple.test.js"
    ],
    "number": 118
  },
  {
    "chapterGroup": "math",
    "chapter": "liu-hui",
    "algo": "liu-hui_liuHui",
    "name": "liuHui should calculate π based on 12-gon@liuHui.test.js",
    "label": "liuHui should calculate π based on 12-gon",
    "testNamePattern": "liuHui should calculate . based on 12-gon",
    "testFilePaths": [
      "src/algorithms/math/liu-hui/__test__/liuHui.test.js"
    ],
    "number": 119
  },
  {
    "chapterGroup": "math",
    "chapter": "liu-hui",
    "algo": "liu-hui_liuHui",
    "name": "liuHui should calculate π based on 24-gon@liuHui.test.js",
    "label": "liuHui should calculate π based on 24-gon",
    "testNamePattern": "liuHui should calculate . based on 24-gon",
    "testFilePaths": [
      "src/algorithms/math/liu-hui/__test__/liuHui.test.js"
    ],
    "number": 120
  },
  {
    "chapterGroup": "math",
    "chapter": "liu-hui",
    "algo": "liu-hui_liuHui",
    "name": "liuHui should calculate π based on 6144-gon@liuHui.test.js",
    "label": "liuHui should calculate π based on 6144-gon",
    "testNamePattern": "liuHui should calculate . based on 6144-gon",
    "testFilePaths": [
      "src/algorithms/math/liu-hui/__test__/liuHui.test.js"
    ],
    "number": 121
  },
  {
    "chapterGroup": "math",
    "chapter": "liu-hui",
    "algo": "liu-hui_liuHui",
    "name": "liuHui should calculate π based on 201326592-gon@liuHui.test.js",
    "label": "liuHui should calculate π based on 201326592-gon",
    "testNamePattern": "liuHui should calculate . based on 201326592-gon",
    "testFilePaths": [
      "src/algorithms/math/liu-hui/__test__/liuHui.test.js"
    ],
    "number": 122
  },
  {
    "chapterGroup": "math",
    "chapter": "matrix",
    "algo": "matrix_Matrix",
    "name": "Matrix should throw when trying to add matrices of invalid shapes@Matrix.test.js",
    "label": "Matrix should throw when trying to add matrices of invalid shapes",
    "testNamePattern": "Matrix should throw when trying to add matrices of invalid shapes",
    "testFilePaths": [
      "src/algorithms/math/matrix/__tests__/Matrix.test.js"
    ],
    "number": 123
  },
  {
    "chapterGroup": "math",
    "chapter": "matrix",
    "algo": "matrix_Matrix",
    "name": "Matrix should calculate matrices dimensions@Matrix.test.js",
    "label": "Matrix should calculate matrices dimensions",
    "testNamePattern": "Matrix should calculate matrices dimensions",
    "testFilePaths": [
      "src/algorithms/math/matrix/__tests__/Matrix.test.js"
    ],
    "number": 124
  },
  {
    "chapterGroup": "math",
    "chapter": "matrix",
    "algo": "matrix_Matrix",
    "name": "Matrix should generate the matrix of zeros@Matrix.test.js",
    "label": "Matrix should generate the matrix of zeros",
    "testNamePattern": "Matrix should generate the matrix of zeros",
    "testFilePaths": [
      "src/algorithms/math/matrix/__tests__/Matrix.test.js"
    ],
    "number": 125
  },
  {
    "chapterGroup": "math",
    "chapter": "matrix",
    "algo": "matrix_Matrix",
    "name": "Matrix should generate the matrix with custom values@Matrix.test.js",
    "label": "Matrix should generate the matrix with custom values",
    "testNamePattern": "Matrix should generate the matrix with custom values",
    "testFilePaths": [
      "src/algorithms/math/matrix/__tests__/Matrix.test.js"
    ],
    "number": 126
  },
  {
    "chapterGroup": "math",
    "chapter": "matrix",
    "algo": "matrix_Matrix",
    "name": "Matrix should generate a custom matrix based on specific cell indices@Matrix.test.js",
    "label": "Matrix should generate a custom matrix based on specific cell indices",
    "testNamePattern": "Matrix should generate a custom matrix based on specific cell indices",
    "testFilePaths": [
      "src/algorithms/math/matrix/__tests__/Matrix.test.js"
    ],
    "number": 127
  },
  {
    "chapterGroup": "math",
    "chapter": "matrix",
    "algo": "matrix_Matrix",
    "name": "Matrix should multiply two matrices@Matrix.test.js",
    "label": "Matrix should multiply two matrices",
    "testNamePattern": "Matrix should multiply two matrices",
    "testFilePaths": [
      "src/algorithms/math/matrix/__tests__/Matrix.test.js"
    ],
    "number": 128
  },
  {
    "chapterGroup": "math",
    "chapter": "matrix",
    "algo": "matrix_Matrix",
    "name": "Matrix should transpose matrices@Matrix.test.js",
    "label": "Matrix should transpose matrices",
    "testNamePattern": "Matrix should transpose matrices",
    "testFilePaths": [
      "src/algorithms/math/matrix/__tests__/Matrix.test.js"
    ],
    "number": 129
  },
  {
    "chapterGroup": "math",
    "chapter": "matrix",
    "algo": "matrix_Matrix",
    "name": "Matrix should throw when trying to transpose non 2D matrix@Matrix.test.js",
    "label": "Matrix should throw when trying to transpose non 2D matrix",
    "testNamePattern": "Matrix should throw when trying to transpose non 2D matrix",
    "testFilePaths": [
      "src/algorithms/math/matrix/__tests__/Matrix.test.js"
    ],
    "number": 130
  },
  {
    "chapterGroup": "math",
    "chapter": "matrix",
    "algo": "matrix_Matrix",
    "name": "Matrix should add two matrices@Matrix.test.js",
    "label": "Matrix should add two matrices",
    "testNamePattern": "Matrix should add two matrices",
    "testFilePaths": [
      "src/algorithms/math/matrix/__tests__/Matrix.test.js"
    ],
    "number": 131
  },
  {
    "chapterGroup": "math",
    "chapter": "matrix",
    "algo": "matrix_Matrix",
    "name": "Matrix should throw when trying to add matrices of different shape@Matrix.test.js",
    "label": "Matrix should throw when trying to add matrices of different shape",
    "testNamePattern": "Matrix should throw when trying to add matrices of different shape",
    "testFilePaths": [
      "src/algorithms/math/matrix/__tests__/Matrix.test.js"
    ],
    "number": 132
  },
  {
    "chapterGroup": "math",
    "chapter": "matrix",
    "algo": "matrix_Matrix",
    "name": "Matrix should do element wise multiplication two matrices@Matrix.test.js",
    "label": "Matrix should do element wise multiplication two matrices",
    "testNamePattern": "Matrix should do element wise multiplication two matrices",
    "testFilePaths": [
      "src/algorithms/math/matrix/__tests__/Matrix.test.js"
    ],
    "number": 133
  },
  {
    "chapterGroup": "math",
    "chapter": "matrix",
    "algo": "matrix_Matrix",
    "name": "Matrix should throw when trying to multiply matrices element-wise of different shape@Matrix.test.js",
    "label": "Matrix should throw when trying to multiply matrices element-wise of different shape",
    "testNamePattern": "Matrix should throw when trying to multiply matrices element-wise of different shape",
    "testFilePaths": [
      "src/algorithms/math/matrix/__tests__/Matrix.test.js"
    ],
    "number": 134
  },
  {
    "chapterGroup": "math",
    "chapter": "matrix",
    "algo": "matrix_Matrix",
    "name": "Matrix should do element wise subtraction two matrices@Matrix.test.js",
    "label": "Matrix should do element wise subtraction two matrices",
    "testNamePattern": "Matrix should do element wise subtraction two matrices",
    "testFilePaths": [
      "src/algorithms/math/matrix/__tests__/Matrix.test.js"
    ],
    "number": 135
  },
  {
    "chapterGroup": "math",
    "chapter": "matrix",
    "algo": "matrix_Matrix",
    "name": "Matrix should throw when trying to subtract matrices element-wise of different shape@Matrix.test.js",
    "label": "Matrix should throw when trying to subtract matrices element-wise of different shape",
    "testNamePattern": "Matrix should throw when trying to subtract matrices element-wise of different shape",
    "testFilePaths": [
      "src/algorithms/math/matrix/__tests__/Matrix.test.js"
    ],
    "number": 136
  },
  {
    "chapterGroup": "math",
    "chapter": "pascal-triangle",
    "algo": "pascal-triangle_pascalTriangleRecursive",
    "name": "pascalTriangleRecursive should calculate Pascal Triangle coefficients for specific line number@pascalTriangleRecursive.test.js",
    "label": "pascalTriangleRecursive should calculate Pascal Triangle coefficients for specific line number",
    "testNamePattern": "pascalTriangleRecursive should calculate Pascal Triangle coefficients for specific line number",
    "testFilePaths": [
      "src/algorithms/math/pascal-triangle/__test__/pascalTriangleRecursive.test.js"
    ],
    "number": 137
  },
  {
    "chapterGroup": "math",
    "chapter": "pascal-triangle",
    "algo": "pascal-triangle_pascalTriangle",
    "name": "pascalTriangle should calculate Pascal Triangle coefficients for specific line number@pascalTriangle.test.js",
    "label": "pascalTriangle should calculate Pascal Triangle coefficients for specific line number",
    "testNamePattern": "pascalTriangle should calculate Pascal Triangle coefficients for specific line number",
    "testFilePaths": [
      "src/algorithms/math/pascal-triangle/__test__/pascalTriangle.test.js"
    ],
    "number": 138
  },
  {
    "chapterGroup": "math",
    "chapter": "primality-test",
    "algo": "primality-test_trialDivision",
    "name": "trialDivision should detect prime numbers@trialDivision.test.js",
    "label": "trialDivision should detect prime numbers",
    "testNamePattern": "trialDivision should detect prime numbers",
    "testFilePaths": [
      "src/algorithms/math/primality-test/__test__/trialDivision.test.js"
    ],
    "number": 139
  },
  {
    "chapterGroup": "math",
    "chapter": "prime-factors",
    "algo": "prime-factors_primeFactors",
    "name": "primeFactors should find prime factors@primeFactors.test.js",
    "label": "primeFactors should find prime factors",
    "testNamePattern": "primeFactors should find prime factors",
    "testFilePaths": [
      "src/algorithms/math/prime-factors/__test__/primeFactors.test.js"
    ],
    "number": 140
  },
  {
    "chapterGroup": "math",
    "chapter": "prime-factors",
    "algo": "prime-factors_primeFactors",
    "name": "primeFactors should give approximate prime factors count using Hardy-Ramanujan theorem@primeFactors.test.js",
    "label": "primeFactors should give approximate prime factors count using Hardy-Ramanujan theorem",
    "testNamePattern": "primeFactors should give approximate prime factors count using Hardy-Ramanujan theorem",
    "testFilePaths": [
      "src/algorithms/math/prime-factors/__test__/primeFactors.test.js"
    ],
    "number": 141
  },
  {
    "chapterGroup": "math",
    "chapter": "prime-factors",
    "algo": "prime-factors_primeFactors",
    "name": "primeFactors should give correct deviation between exact and approx counts@primeFactors.test.js",
    "label": "primeFactors should give correct deviation between exact and approx counts",
    "testNamePattern": "primeFactors should give correct deviation between exact and approx counts",
    "testFilePaths": [
      "src/algorithms/math/prime-factors/__test__/primeFactors.test.js"
    ],
    "number": 142
  },
  {
    "chapterGroup": "math",
    "chapter": "radian",
    "algo": "radian_radianToDegree",
    "name": "radianToDegree should convert radian to degree@radianToDegree.test.js",
    "label": "radianToDegree should convert radian to degree",
    "testNamePattern": "radianToDegree should convert radian to degree",
    "testFilePaths": [
      "src/algorithms/math/radian/__test__/radianToDegree.test.js"
    ],
    "number": 143
  },
  {
    "chapterGroup": "math",
    "chapter": "radian",
    "algo": "radian_degreeToRadian",
    "name": "degreeToRadian should convert degree to radian@degreeToRadian.test.js",
    "label": "degreeToRadian should convert degree to radian",
    "testNamePattern": "degreeToRadian should convert degree to radian",
    "testFilePaths": [
      "src/algorithms/math/radian/__test__/degreeToRadian.test.js"
    ],
    "number": 144
  },
  {
    "chapterGroup": "math",
    "chapter": "sieve-of-eratosthenes",
    "algo": "sieve-of-eratosthenes_sieveOfEratosthenes",
    "name": "sieveOfEratosthenes should find all primes less than or equal to n@sieveOfEratosthenes.test.js",
    "label": "sieveOfEratosthenes should find all primes less than or equal to n",
    "testNamePattern": "sieveOfEratosthenes should find all primes less than or equal to n",
    "testFilePaths": [
      "src/algorithms/math/sieve-of-eratosthenes/__test__/sieveOfEratosthenes.test.js"
    ],
    "number": 145
  },
  {
    "chapterGroup": "math",
    "chapter": "square-root",
    "algo": "square-root_squareRoot",
    "name": "squareRoot should throw for negative numbers@squareRoot.test.js",
    "label": "squareRoot should throw for negative numbers",
    "testNamePattern": "squareRoot should throw for negative numbers",
    "testFilePaths": [
      "src/algorithms/math/square-root/__test__/squareRoot.test.js"
    ],
    "number": 146
  },
  {
    "chapterGroup": "math",
    "chapter": "square-root",
    "algo": "square-root_squareRoot",
    "name": "squareRoot should correctly calculate square root with default tolerance@squareRoot.test.js",
    "label": "squareRoot should correctly calculate square root with default tolerance",
    "testNamePattern": "squareRoot should correctly calculate square root with default tolerance",
    "testFilePaths": [
      "src/algorithms/math/square-root/__test__/squareRoot.test.js"
    ],
    "number": 147
  },
  {
    "chapterGroup": "math",
    "chapter": "square-root",
    "algo": "square-root_squareRoot",
    "name": "squareRoot should correctly calculate square root for integers with custom tolerance@squareRoot.test.js",
    "label": "squareRoot should correctly calculate square root for integers with custom tolerance",
    "testNamePattern": "squareRoot should correctly calculate square root for integers with custom tolerance",
    "testFilePaths": [
      "src/algorithms/math/square-root/__test__/squareRoot.test.js"
    ],
    "number": 148
  },
  {
    "chapterGroup": "ml",
    "chapter": "k-means",
    "algo": "k-means_kMeans",
    "name": "kMeans should throw an error on invalid data@kMeans.test.js",
    "label": "kMeans should throw an error on invalid data",
    "testNamePattern": "kMeans should throw an error on invalid data",
    "testFilePaths": [
      "src/algorithms/ml/k-means/__test__/kMeans.test.js"
    ],
    "number": 149
  },
  {
    "chapterGroup": "ml",
    "chapter": "k-means",
    "algo": "k-means_kMeans",
    "name": "kMeans should throw an error on inconsistent data@kMeans.test.js",
    "label": "kMeans should throw an error on inconsistent data",
    "testNamePattern": "kMeans should throw an error on inconsistent data",
    "testFilePaths": [
      "src/algorithms/ml/k-means/__test__/kMeans.test.js"
    ],
    "number": 150
  },
  {
    "chapterGroup": "ml",
    "chapter": "k-means",
    "algo": "k-means_kMeans",
    "name": "kMeans should find the nearest neighbour@kMeans.test.js",
    "label": "kMeans should find the nearest neighbour",
    "testNamePattern": "kMeans should find the nearest neighbour",
    "testFilePaths": [
      "src/algorithms/ml/k-means/__test__/kMeans.test.js"
    ],
    "number": 151
  },
  {
    "chapterGroup": "ml",
    "chapter": "k-means",
    "algo": "k-means_kMeans",
    "name": "kMeans should find the clusters with equal distances@kMeans.test.js",
    "label": "kMeans should find the clusters with equal distances",
    "testNamePattern": "kMeans should find the clusters with equal distances",
    "testFilePaths": [
      "src/algorithms/ml/k-means/__test__/kMeans.test.js"
    ],
    "number": 152
  },
  {
    "chapterGroup": "ml",
    "chapter": "k-means",
    "algo": "k-means_kMeans",
    "name": "kMeans should find the nearest neighbour in 3D space@kMeans.test.js",
    "label": "kMeans should find the nearest neighbour in 3D space",
    "testNamePattern": "kMeans should find the nearest neighbour in 3D space",
    "testFilePaths": [
      "src/algorithms/ml/k-means/__test__/kMeans.test.js"
    ],
    "number": 153
  },
  {
    "chapterGroup": "ml",
    "chapter": "knn",
    "algo": "knn_knn",
    "name": "kNN should throw an error on invalid data@knn.test.js",
    "label": "kNN should throw an error on invalid data",
    "testNamePattern": "kNN should throw an error on invalid data",
    "testFilePaths": [
      "src/algorithms/ml/knn/__test__/knn.test.js"
    ],
    "number": 154
  },
  {
    "chapterGroup": "ml",
    "chapter": "knn",
    "algo": "knn_knn",
    "name": "kNN should throw an error on invalid labels@knn.test.js",
    "label": "kNN should throw an error on invalid labels",
    "testNamePattern": "kNN should throw an error on invalid labels",
    "testFilePaths": [
      "src/algorithms/ml/knn/__test__/knn.test.js"
    ],
    "number": 155
  },
  {
    "chapterGroup": "ml",
    "chapter": "knn",
    "algo": "knn_knn",
    "name": "kNN should throw an error on not giving classification vector@knn.test.js",
    "label": "kNN should throw an error on not giving classification vector",
    "testNamePattern": "kNN should throw an error on not giving classification vector",
    "testFilePaths": [
      "src/algorithms/ml/knn/__test__/knn.test.js"
    ],
    "number": 156
  },
  {
    "chapterGroup": "ml",
    "chapter": "knn",
    "algo": "knn_knn",
    "name": "kNN should find the nearest neighbour@knn.test.js",
    "label": "kNN should find the nearest neighbour",
    "testNamePattern": "kNN should find the nearest neighbour",
    "testFilePaths": [
      "src/algorithms/ml/knn/__test__/knn.test.js"
    ],
    "number": 157
  },
  {
    "chapterGroup": "ml",
    "chapter": "knn",
    "algo": "knn_knn",
    "name": "kNN should find the nearest neighbour with equal distances@knn.test.js",
    "label": "kNN should find the nearest neighbour with equal distances",
    "testNamePattern": "kNN should find the nearest neighbour with equal distances",
    "testFilePaths": [
      "src/algorithms/ml/knn/__test__/knn.test.js"
    ],
    "number": 158
  },
  {
    "chapterGroup": "ml",
    "chapter": "knn",
    "algo": "knn_knn",
    "name": "kNN should find the nearest neighbour in 3D space@knn.test.js",
    "label": "kNN should find the nearest neighbour in 3D space",
    "testNamePattern": "kNN should find the nearest neighbour in 3D space",
    "testFilePaths": [
      "src/algorithms/ml/knn/__test__/knn.test.js"
    ],
    "number": 159
  },
  {
    "chapterGroup": "search",
    "chapter": "binary-search",
    "algo": "binary-search_binarySearch",
    "name": "binarySearch should search number in sorted array@binarySearch.test.js",
    "label": "binarySearch should search number in sorted array",
    "testNamePattern": "binarySearch should search number in sorted array",
    "testFilePaths": [
      "src/algorithms/search/binary-search/__test__/binarySearch.test.js"
    ],
    "number": 160
  },
  {
    "chapterGroup": "search",
    "chapter": "binary-search",
    "algo": "binary-search_binarySearch",
    "name": "binarySearch should search object in sorted array@binarySearch.test.js",
    "label": "binarySearch should search object in sorted array",
    "testNamePattern": "binarySearch should search object in sorted array",
    "testFilePaths": [
      "src/algorithms/search/binary-search/__test__/binarySearch.test.js"
    ],
    "number": 161
  },
  {
    "chapterGroup": "search",
    "chapter": "interpolation-search",
    "algo": "interpolation-search_interpolationSearch",
    "name": "interpolationSearch should search elements in sorted array of numbers@interpolationSearch.test.js",
    "label": "interpolationSearch should search elements in sorted array of numbers",
    "testNamePattern": "interpolationSearch should search elements in sorted array of numbers",
    "testFilePaths": [
      "src/algorithms/search/interpolation-search/__test__/interpolationSearch.test.js"
    ],
    "number": 162
  },
  {
    "chapterGroup": "search",
    "chapter": "jump-search",
    "algo": "jump-search_jumpSearch",
    "name": "jumpSearch should search for an element in sorted array@jumpSearch.test.js",
    "label": "jumpSearch should search for an element in sorted array",
    "testNamePattern": "jumpSearch should search for an element in sorted array",
    "testFilePaths": [
      "src/algorithms/search/jump-search/__test__/jumpSearch.test.js"
    ],
    "number": 163
  },
  {
    "chapterGroup": "search",
    "chapter": "jump-search",
    "algo": "jump-search_jumpSearch",
    "name": "jumpSearch should search object in sorted array@jumpSearch.test.js",
    "label": "jumpSearch should search object in sorted array",
    "testNamePattern": "jumpSearch should search object in sorted array",
    "testFilePaths": [
      "src/algorithms/search/jump-search/__test__/jumpSearch.test.js"
    ],
    "number": 164
  },
  {
    "chapterGroup": "search",
    "chapter": "linear-search",
    "algo": "linear-search_linearSearch",
    "name": "linearSearch should search all numbers in array@linearSearch.test.js",
    "label": "linearSearch should search all numbers in array",
    "testNamePattern": "linearSearch should search all numbers in array",
    "testFilePaths": [
      "src/algorithms/search/linear-search/__test__/linearSearch.test.js"
    ],
    "number": 165
  },
  {
    "chapterGroup": "search",
    "chapter": "linear-search",
    "algo": "linear-search_linearSearch",
    "name": "linearSearch should search all strings in array@linearSearch.test.js",
    "label": "linearSearch should search all strings in array",
    "testNamePattern": "linearSearch should search all strings in array",
    "testFilePaths": [
      "src/algorithms/search/linear-search/__test__/linearSearch.test.js"
    ],
    "number": 166
  },
  {
    "chapterGroup": "search",
    "chapter": "linear-search",
    "algo": "linear-search_linearSearch",
    "name": "linearSearch should search through objects as well@linearSearch.test.js",
    "label": "linearSearch should search through objects as well",
    "testNamePattern": "linearSearch should search through objects as well",
    "testFilePaths": [
      "src/algorithms/search/linear-search/__test__/linearSearch.test.js"
    ],
    "number": 167
  },
  {
    "chapterGroup": "sets",
    "chapter": "cartesian-product",
    "algo": "cartesian-product_cartesianProduct",
    "name": "cartesianProduct should return null if there is not enough info for calculation@cartesianProduct.test.js",
    "label": "cartesianProduct should return null if there is not enough info for calculation",
    "testNamePattern": "cartesianProduct should return null if there is not enough info for calculation",
    "testFilePaths": [
      "src/algorithms/sets/cartesian-product/__test__/cartesianProduct.test.js"
    ],
    "number": 168
  },
  {
    "chapterGroup": "sets",
    "chapter": "cartesian-product",
    "algo": "cartesian-product_cartesianProduct",
    "name": "cartesianProduct should calculate the product of two sets@cartesianProduct.test.js",
    "label": "cartesianProduct should calculate the product of two sets",
    "testNamePattern": "cartesianProduct should calculate the product of two sets",
    "testFilePaths": [
      "src/algorithms/sets/cartesian-product/__test__/cartesianProduct.test.js"
    ],
    "number": 169
  },
  {
    "chapterGroup": "sets",
    "chapter": "combination-sum",
    "algo": "combination-sum_combinationSum",
    "name": "combinationSum should find all combinations with specific sum@combinationSum.test.js",
    "label": "combinationSum should find all combinations with specific sum",
    "testNamePattern": "combinationSum should find all combinations with specific sum",
    "testFilePaths": [
      "src/algorithms/sets/combination-sum/__test__/combinationSum.test.js"
    ],
    "number": 170
  },
  {
    "chapterGroup": "sets",
    "chapter": "combinations",
    "algo": "combinations_combineWithoutRepetitions",
    "name": "combineWithoutRepetitions should combine string without repetitions@combineWithoutRepetitions.test.js",
    "label": "combineWithoutRepetitions should combine string without repetitions",
    "testNamePattern": "combineWithoutRepetitions should combine string without repetitions",
    "testFilePaths": [
      "src/algorithms/sets/combinations/__test__/combineWithoutRepetitions.test.js"
    ],
    "number": 171
  },
  {
    "chapterGroup": "sets",
    "chapter": "combinations",
    "algo": "combinations_combineWithRepetitions",
    "name": "combineWithRepetitions should combine string with repetitions@combineWithRepetitions.test.js",
    "label": "combineWithRepetitions should combine string with repetitions",
    "testNamePattern": "combineWithRepetitions should combine string with repetitions",
    "testFilePaths": [
      "src/algorithms/sets/combinations/__test__/combineWithRepetitions.test.js"
    ],
    "number": 172
  },
  {
    "chapterGroup": "sets",
    "chapter": "fisher-yates",
    "algo": "fisher-yates_fisherYates",
    "name": "fisherYates should shuffle small arrays@fisherYates.test.js",
    "label": "fisherYates should shuffle small arrays",
    "testNamePattern": "fisherYates should shuffle small arrays",
    "testFilePaths": [
      "src/algorithms/sets/fisher-yates/__test__/fisherYates.test.js"
    ],
    "number": 173
  },
  {
    "chapterGroup": "sets",
    "chapter": "fisher-yates",
    "algo": "fisher-yates_fisherYates",
    "name": "fisherYates should shuffle array randomly@fisherYates.test.js",
    "label": "fisherYates should shuffle array randomly",
    "testNamePattern": "fisherYates should shuffle array randomly",
    "testFilePaths": [
      "src/algorithms/sets/fisher-yates/__test__/fisherYates.test.js"
    ],
    "number": 174
  },
  {
    "chapterGroup": "sets",
    "chapter": "knapsack-problem",
    "algo": "knapsack-problem_Knapsack",
    "name": "Knapsack should solve 0/1 knapsack problem@Knapsack.test.js",
    "label": "Knapsack should solve 0/1 knapsack problem",
    "testNamePattern": "Knapsack should solve 0/1 knapsack problem",
    "testFilePaths": [
      "src/algorithms/sets/knapsack-problem/__test__/Knapsack.test.js"
    ],
    "number": 175
  },
  {
    "chapterGroup": "sets",
    "chapter": "knapsack-problem",
    "algo": "knapsack-problem_Knapsack",
    "name": "Knapsack should solve 0/1 knapsack problem regardless of items order@Knapsack.test.js",
    "label": "Knapsack should solve 0/1 knapsack problem regardless of items order",
    "testNamePattern": "Knapsack should solve 0/1 knapsack problem regardless of items order",
    "testFilePaths": [
      "src/algorithms/sets/knapsack-problem/__test__/Knapsack.test.js"
    ],
    "number": 176
  },
  {
    "chapterGroup": "sets",
    "chapter": "knapsack-problem",
    "algo": "knapsack-problem_Knapsack",
    "name": "Knapsack should solve 0/1 knapsack problem with impossible items set@Knapsack.test.js",
    "label": "Knapsack should solve 0/1 knapsack problem with impossible items set",
    "testNamePattern": "Knapsack should solve 0/1 knapsack problem with impossible items set",
    "testFilePaths": [
      "src/algorithms/sets/knapsack-problem/__test__/Knapsack.test.js"
    ],
    "number": 177
  },
  {
    "chapterGroup": "sets",
    "chapter": "knapsack-problem",
    "algo": "knapsack-problem_Knapsack",
    "name": "Knapsack should solve 0/1 knapsack problem with all equal weights@Knapsack.test.js",
    "label": "Knapsack should solve 0/1 knapsack problem with all equal weights",
    "testNamePattern": "Knapsack should solve 0/1 knapsack problem with all equal weights",
    "testFilePaths": [
      "src/algorithms/sets/knapsack-problem/__test__/Knapsack.test.js"
    ],
    "number": 178
  },
  {
    "chapterGroup": "sets",
    "chapter": "knapsack-problem",
    "algo": "knapsack-problem_Knapsack",
    "name": "Knapsack should solve unbound knapsack problem@Knapsack.test.js",
    "label": "Knapsack should solve unbound knapsack problem",
    "testNamePattern": "Knapsack should solve unbound knapsack problem",
    "testFilePaths": [
      "src/algorithms/sets/knapsack-problem/__test__/Knapsack.test.js"
    ],
    "number": 179
  },
  {
    "chapterGroup": "sets",
    "chapter": "knapsack-problem",
    "algo": "knapsack-problem_Knapsack",
    "name": "Knapsack should solve unbound knapsack problem with items in stock@Knapsack.test.js",
    "label": "Knapsack should solve unbound knapsack problem with items in stock",
    "testNamePattern": "Knapsack should solve unbound knapsack problem with items in stock",
    "testFilePaths": [
      "src/algorithms/sets/knapsack-problem/__test__/Knapsack.test.js"
    ],
    "number": 180
  },
  {
    "chapterGroup": "sets",
    "chapter": "knapsack-problem",
    "algo": "knapsack-problem_Knapsack",
    "name": "Knapsack should solve unbound knapsack problem with items in stock and max weight more than sum of all items@Knapsack.test.js",
    "label": "Knapsack should solve unbound knapsack problem with items in stock and max weight more than sum of all items",
    "testNamePattern": "Knapsack should solve unbound knapsack problem with items in stock and max weight more than sum of all items",
    "testFilePaths": [
      "src/algorithms/sets/knapsack-problem/__test__/Knapsack.test.js"
    ],
    "number": 181
  },
  {
    "chapterGroup": "sets",
    "chapter": "knapsack-problem",
    "algo": "knapsack-problem_KnapsackItem",
    "name": "KnapsackItem should create knapsack item and count its total weight and value@KnapsackItem.test.js",
    "label": "KnapsackItem should create knapsack item and count its total weight and value",
    "testNamePattern": "KnapsackItem should create knapsack item and count its total weight and value",
    "testFilePaths": [
      "src/algorithms/sets/knapsack-problem/__test__/KnapsackItem.test.js"
    ],
    "number": 182
  },
  {
    "chapterGroup": "sets",
    "chapter": "longest-common-subsequence",
    "algo": "longest-common-subsequence_longestCommonSubsequence",
    "name": "longestCommonSubsequence should find longest common subsequence for two strings@longestCommonSubsequence.test.js",
    "label": "longestCommonSubsequence should find longest common subsequence for two strings",
    "testNamePattern": "longestCommonSubsequence should find longest common subsequence for two strings",
    "testFilePaths": [
      "src/algorithms/sets/longest-common-subsequence/__test__/longestCommonSubsequence.test.js"
    ],
    "number": 183
  },
  {
    "chapterGroup": "sets",
    "chapter": "longest-increasing-subsequence",
    "algo": "longest-increasing-subsequence_dpLongestIncreasingSubsequence",
    "name": "dpLongestIncreasingSubsequence should find longest increasing subsequence length@dpLongestIncreasingSubsequence.test.js",
    "label": "dpLongestIncreasingSubsequence should find longest increasing subsequence length",
    "testNamePattern": "dpLongestIncreasingSubsequence should find longest increasing subsequence length",
    "testFilePaths": [
      "src/algorithms/sets/longest-increasing-subsequence/__test__/dpLongestIncreasingSubsequence.test.js"
    ],
    "number": 184
  },
  {
    "chapterGroup": "sets",
    "chapter": "maximum-subarray",
    "algo": "maximum-subarray_dpMaximumSubarray",
    "name": "dpMaximumSubarray should find maximum subarray using the dynamic programming algorithm@dpMaximumSubarray.test.js",
    "label": "dpMaximumSubarray should find maximum subarray using the dynamic programming algorithm",
    "testNamePattern": "dpMaximumSubarray should find maximum subarray using the dynamic programming algorithm",
    "testFilePaths": [
      "src/algorithms/sets/maximum-subarray/__test__/dpMaximumSubarray.test.js"
    ],
    "number": 185
  },
  {
    "chapterGroup": "sets",
    "chapter": "maximum-subarray",
    "algo": "maximum-subarray_bfMaximumSubarray",
    "name": "bfMaximumSubarray should find maximum subarray using the brute force algorithm@bfMaximumSubarray.test.js",
    "label": "bfMaximumSubarray should find maximum subarray using the brute force algorithm",
    "testNamePattern": "bfMaximumSubarray should find maximum subarray using the brute force algorithm",
    "testFilePaths": [
      "src/algorithms/sets/maximum-subarray/__test__/bfMaximumSubarray.test.js"
    ],
    "number": 186
  },
  {
    "chapterGroup": "sets",
    "chapter": "maximum-subarray",
    "algo": "maximum-subarray_dcMaximumSubarraySum",
    "name": "dcMaximumSubarraySum should find maximum subarray sum using the divide and conquer algorithm@dcMaximumSubarraySum.test.js",
    "label": "dcMaximumSubarraySum should find maximum subarray sum using the divide and conquer algorithm",
    "testNamePattern": "dcMaximumSubarraySum should find maximum subarray sum using the divide and conquer algorithm",
    "testFilePaths": [
      "src/algorithms/sets/maximum-subarray/__test__/dcMaximumSubarraySum.test.js"
    ],
    "number": 187
  },
  {
    "chapterGroup": "sets",
    "chapter": "permutations",
    "algo": "permutations_permutateWithoutRepetitions",
    "name": "permutateWithoutRepetitions should permutate string@permutateWithoutRepetitions.test.js",
    "label": "permutateWithoutRepetitions should permutate string",
    "testNamePattern": "permutateWithoutRepetitions should permutate string",
    "testFilePaths": [
      "src/algorithms/sets/permutations/__test__/permutateWithoutRepetitions.test.js"
    ],
    "number": 188
  },
  {
    "chapterGroup": "sets",
    "chapter": "permutations",
    "algo": "permutations_permutateWithRepetitions",
    "name": "permutateWithRepetitions should permutate string with repetition@permutateWithRepetitions.test.js",
    "label": "permutateWithRepetitions should permutate string with repetition",
    "testNamePattern": "permutateWithRepetitions should permutate string with repetition",
    "testFilePaths": [
      "src/algorithms/sets/permutations/__test__/permutateWithRepetitions.test.js"
    ],
    "number": 189
  },
  {
    "chapterGroup": "sets",
    "chapter": "power-set",
    "algo": "power-set_bwPowerSet",
    "name": "bwPowerSet should calculate power set of given set using bitwise approach@bwPowerSet.test.js",
    "label": "bwPowerSet should calculate power set of given set using bitwise approach",
    "testNamePattern": "bwPowerSet should calculate power set of given set using bitwise approach",
    "testFilePaths": [
      "src/algorithms/sets/power-set/__test__/bwPowerSet.test.js"
    ],
    "number": 190
  },
  {
    "chapterGroup": "sets",
    "chapter": "power-set",
    "algo": "power-set_btPowerSet",
    "name": "btPowerSet should calculate power set of given set using backtracking approach@btPowerSet.test.js",
    "label": "btPowerSet should calculate power set of given set using backtracking approach",
    "testNamePattern": "btPowerSet should calculate power set of given set using backtracking approach",
    "testFilePaths": [
      "src/algorithms/sets/power-set/__test__/btPowerSet.test.js"
    ],
    "number": 191
  },
  {
    "chapterGroup": "sets",
    "chapter": "shortest-common-supersequence",
    "algo": "shortest-common-supersequence_shortestCommonSupersequence",
    "name": "shortestCommonSupersequence should find shortest common supersequence of two sequences@shortestCommonSupersequence.test.js",
    "label": "shortestCommonSupersequence should find shortest common supersequence of two sequences",
    "testNamePattern": "shortestCommonSupersequence should find shortest common supersequence of two sequences",
    "testFilePaths": [
      "src/algorithms/sets/shortest-common-supersequence/__test__/shortestCommonSupersequence.test.js"
    ],
    "number": 192
  },
  {
    "chapterGroup": "sorting",
    "chapter": "bubble-sort",
    "algo": "bubble-sort_BubbleSort",
    "name": "BubbleSort should sort array@BubbleSort.test.js",
    "label": "BubbleSort should sort array",
    "testNamePattern": "BubbleSort should sort array",
    "testFilePaths": [
      "src/algorithms/sorting/bubble-sort/__test__/BubbleSort.test.js"
    ],
    "number": 193
  },
  {
    "chapterGroup": "sorting",
    "chapter": "bubble-sort",
    "algo": "bubble-sort_BubbleSort",
    "name": "BubbleSort should sort array with custom comparator@BubbleSort.test.js",
    "label": "BubbleSort should sort array with custom comparator",
    "testNamePattern": "BubbleSort should sort array with custom comparator",
    "testFilePaths": [
      "src/algorithms/sorting/bubble-sort/__test__/BubbleSort.test.js"
    ],
    "number": 194
  },
  {
    "chapterGroup": "sorting",
    "chapter": "bubble-sort",
    "algo": "bubble-sort_BubbleSort",
    "name": "BubbleSort should do stable sorting@BubbleSort.test.js",
    "label": "BubbleSort should do stable sorting",
    "testNamePattern": "BubbleSort should do stable sorting",
    "testFilePaths": [
      "src/algorithms/sorting/bubble-sort/__test__/BubbleSort.test.js"
    ],
    "number": 195
  },
  {
    "chapterGroup": "sorting",
    "chapter": "bubble-sort",
    "algo": "bubble-sort_BubbleSort",
    "name": "BubbleSort should sort negative numbers@BubbleSort.test.js",
    "label": "BubbleSort should sort negative numbers",
    "testNamePattern": "BubbleSort should sort negative numbers",
    "testFilePaths": [
      "src/algorithms/sorting/bubble-sort/__test__/BubbleSort.test.js"
    ],
    "number": 196
  },
  {
    "chapterGroup": "sorting",
    "chapter": "bubble-sort",
    "algo": "bubble-sort_BubbleSort",
    "name": "BubbleSort should visit EQUAL array element specified number of times@BubbleSort.test.js",
    "label": "BubbleSort should visit EQUAL array element specified number of times",
    "testNamePattern": "BubbleSort should visit EQUAL array element specified number of times",
    "testFilePaths": [
      "src/algorithms/sorting/bubble-sort/__test__/BubbleSort.test.js"
    ],
    "number": 197
  },
  {
    "chapterGroup": "sorting",
    "chapter": "bubble-sort",
    "algo": "bubble-sort_BubbleSort",
    "name": "BubbleSort should visit SORTED array element specified number of times@BubbleSort.test.js",
    "label": "BubbleSort should visit SORTED array element specified number of times",
    "testNamePattern": "BubbleSort should visit SORTED array element specified number of times",
    "testFilePaths": [
      "src/algorithms/sorting/bubble-sort/__test__/BubbleSort.test.js"
    ],
    "number": 198
  },
  {
    "chapterGroup": "sorting",
    "chapter": "bubble-sort",
    "algo": "bubble-sort_BubbleSort",
    "name": "BubbleSort should visit NOT SORTED array element specified number of times@BubbleSort.test.js",
    "label": "BubbleSort should visit NOT SORTED array element specified number of times",
    "testNamePattern": "BubbleSort should visit NOT SORTED array element specified number of times",
    "testFilePaths": [
      "src/algorithms/sorting/bubble-sort/__test__/BubbleSort.test.js"
    ],
    "number": 199
  },
  {
    "chapterGroup": "sorting",
    "chapter": "bubble-sort",
    "algo": "bubble-sort_BubbleSort",
    "name": "BubbleSort should visit REVERSE SORTED array element specified number of times@BubbleSort.test.js",
    "label": "BubbleSort should visit REVERSE SORTED array element specified number of times",
    "testNamePattern": "BubbleSort should visit REVERSE SORTED array element specified number of times",
    "testFilePaths": [
      "src/algorithms/sorting/bubble-sort/__test__/BubbleSort.test.js"
    ],
    "number": 200
  },
  {
    "chapterGroup": "sorting",
    "chapter": "counting-sort",
    "algo": "counting-sort_CountingSort",
    "name": "CountingSort should sort array@CountingSort.test.js",
    "label": "CountingSort should sort array",
    "testNamePattern": "CountingSort should sort array",
    "testFilePaths": [
      "src/algorithms/sorting/counting-sort/__test__/CountingSort.test.js"
    ],
    "number": 201
  },
  {
    "chapterGroup": "sorting",
    "chapter": "counting-sort",
    "algo": "counting-sort_CountingSort",
    "name": "CountingSort should sort negative numbers@CountingSort.test.js",
    "label": "CountingSort should sort negative numbers",
    "testNamePattern": "CountingSort should sort negative numbers",
    "testFilePaths": [
      "src/algorithms/sorting/counting-sort/__test__/CountingSort.test.js"
    ],
    "number": 202
  },
  {
    "chapterGroup": "sorting",
    "chapter": "counting-sort",
    "algo": "counting-sort_CountingSort",
    "name": "CountingSort should allow to use specify max/min integer value in array to make sorting faster@CountingSort.test.js",
    "label": "CountingSort should allow to use specify max/min integer value in array to make sorting faster",
    "testNamePattern": "CountingSort should allow to use specify max/min integer value in array to make sorting faster",
    "testFilePaths": [
      "src/algorithms/sorting/counting-sort/__test__/CountingSort.test.js"
    ],
    "number": 203
  },
  {
    "chapterGroup": "sorting",
    "chapter": "counting-sort",
    "algo": "counting-sort_CountingSort",
    "name": "CountingSort should visit EQUAL array element specified number of times@CountingSort.test.js",
    "label": "CountingSort should visit EQUAL array element specified number of times",
    "testNamePattern": "CountingSort should visit EQUAL array element specified number of times",
    "testFilePaths": [
      "src/algorithms/sorting/counting-sort/__test__/CountingSort.test.js"
    ],
    "number": 204
  },
  {
    "chapterGroup": "sorting",
    "chapter": "counting-sort",
    "algo": "counting-sort_CountingSort",
    "name": "CountingSort should visit SORTED array element specified number of times@CountingSort.test.js",
    "label": "CountingSort should visit SORTED array element specified number of times",
    "testNamePattern": "CountingSort should visit SORTED array element specified number of times",
    "testFilePaths": [
      "src/algorithms/sorting/counting-sort/__test__/CountingSort.test.js"
    ],
    "number": 205
  },
  {
    "chapterGroup": "sorting",
    "chapter": "counting-sort",
    "algo": "counting-sort_CountingSort",
    "name": "CountingSort should visit NOT SORTED array element specified number of times@CountingSort.test.js",
    "label": "CountingSort should visit NOT SORTED array element specified number of times",
    "testNamePattern": "CountingSort should visit NOT SORTED array element specified number of times",
    "testFilePaths": [
      "src/algorithms/sorting/counting-sort/__test__/CountingSort.test.js"
    ],
    "number": 206
  },
  {
    "chapterGroup": "sorting",
    "chapter": "counting-sort",
    "algo": "counting-sort_CountingSort",
    "name": "CountingSort should visit REVERSE SORTED array element specified number of times@CountingSort.test.js",
    "label": "CountingSort should visit REVERSE SORTED array element specified number of times",
    "testNamePattern": "CountingSort should visit REVERSE SORTED array element specified number of times",
    "testFilePaths": [
      "src/algorithms/sorting/counting-sort/__test__/CountingSort.test.js"
    ],
    "number": 207
  },
  {
    "chapterGroup": "sorting",
    "chapter": "heap-sort",
    "algo": "heap-sort_HeapSort",
    "name": "HeapSort should sort array@HeapSort.test.js",
    "label": "HeapSort should sort array",
    "testNamePattern": "HeapSort should sort array",
    "testFilePaths": [
      "src/algorithms/sorting/heap-sort/__test__/HeapSort.test.js"
    ],
    "number": 208
  },
  {
    "chapterGroup": "sorting",
    "chapter": "heap-sort",
    "algo": "heap-sort_HeapSort",
    "name": "HeapSort should sort array with custom comparator@HeapSort.test.js",
    "label": "HeapSort should sort array with custom comparator",
    "testNamePattern": "HeapSort should sort array with custom comparator",
    "testFilePaths": [
      "src/algorithms/sorting/heap-sort/__test__/HeapSort.test.js"
    ],
    "number": 209
  },
  {
    "chapterGroup": "sorting",
    "chapter": "heap-sort",
    "algo": "heap-sort_HeapSort",
    "name": "HeapSort should sort negative numbers@HeapSort.test.js",
    "label": "HeapSort should sort negative numbers",
    "testNamePattern": "HeapSort should sort negative numbers",
    "testFilePaths": [
      "src/algorithms/sorting/heap-sort/__test__/HeapSort.test.js"
    ],
    "number": 210
  },
  {
    "chapterGroup": "sorting",
    "chapter": "heap-sort",
    "algo": "heap-sort_HeapSort",
    "name": "HeapSort should visit EQUAL array element specified number of times@HeapSort.test.js",
    "label": "HeapSort should visit EQUAL array element specified number of times",
    "testNamePattern": "HeapSort should visit EQUAL array element specified number of times",
    "testFilePaths": [
      "src/algorithms/sorting/heap-sort/__test__/HeapSort.test.js"
    ],
    "number": 211
  },
  {
    "chapterGroup": "sorting",
    "chapter": "heap-sort",
    "algo": "heap-sort_HeapSort",
    "name": "HeapSort should visit SORTED array element specified number of times@HeapSort.test.js",
    "label": "HeapSort should visit SORTED array element specified number of times",
    "testNamePattern": "HeapSort should visit SORTED array element specified number of times",
    "testFilePaths": [
      "src/algorithms/sorting/heap-sort/__test__/HeapSort.test.js"
    ],
    "number": 212
  },
  {
    "chapterGroup": "sorting",
    "chapter": "heap-sort",
    "algo": "heap-sort_HeapSort",
    "name": "HeapSort should visit NOT SORTED array element specified number of times@HeapSort.test.js",
    "label": "HeapSort should visit NOT SORTED array element specified number of times",
    "testNamePattern": "HeapSort should visit NOT SORTED array element specified number of times",
    "testFilePaths": [
      "src/algorithms/sorting/heap-sort/__test__/HeapSort.test.js"
    ],
    "number": 213
  },
  {
    "chapterGroup": "sorting",
    "chapter": "heap-sort",
    "algo": "heap-sort_HeapSort",
    "name": "HeapSort should visit REVERSE SORTED array element specified number of times@HeapSort.test.js",
    "label": "HeapSort should visit REVERSE SORTED array element specified number of times",
    "testNamePattern": "HeapSort should visit REVERSE SORTED array element specified number of times",
    "testFilePaths": [
      "src/algorithms/sorting/heap-sort/__test__/HeapSort.test.js"
    ],
    "number": 214
  },
  {
    "chapterGroup": "sorting",
    "chapter": "insertion-sort",
    "algo": "insertion-sort_InsertionSort",
    "name": "InsertionSort should sort array@InsertionSort.test.js",
    "label": "InsertionSort should sort array",
    "testNamePattern": "InsertionSort should sort array",
    "testFilePaths": [
      "src/algorithms/sorting/insertion-sort/__test__/InsertionSort.test.js"
    ],
    "number": 215
  },
  {
    "chapterGroup": "sorting",
    "chapter": "insertion-sort",
    "algo": "insertion-sort_InsertionSort",
    "name": "InsertionSort should sort array with custom comparator@InsertionSort.test.js",
    "label": "InsertionSort should sort array with custom comparator",
    "testNamePattern": "InsertionSort should sort array with custom comparator",
    "testFilePaths": [
      "src/algorithms/sorting/insertion-sort/__test__/InsertionSort.test.js"
    ],
    "number": 216
  },
  {
    "chapterGroup": "sorting",
    "chapter": "insertion-sort",
    "algo": "insertion-sort_InsertionSort",
    "name": "InsertionSort should do stable sorting@InsertionSort.test.js",
    "label": "InsertionSort should do stable sorting",
    "testNamePattern": "InsertionSort should do stable sorting",
    "testFilePaths": [
      "src/algorithms/sorting/insertion-sort/__test__/InsertionSort.test.js"
    ],
    "number": 217
  },
  {
    "chapterGroup": "sorting",
    "chapter": "insertion-sort",
    "algo": "insertion-sort_InsertionSort",
    "name": "InsertionSort should sort negative numbers@InsertionSort.test.js",
    "label": "InsertionSort should sort negative numbers",
    "testNamePattern": "InsertionSort should sort negative numbers",
    "testFilePaths": [
      "src/algorithms/sorting/insertion-sort/__test__/InsertionSort.test.js"
    ],
    "number": 218
  },
  {
    "chapterGroup": "sorting",
    "chapter": "insertion-sort",
    "algo": "insertion-sort_InsertionSort",
    "name": "InsertionSort should visit EQUAL array element specified number of times@InsertionSort.test.js",
    "label": "InsertionSort should visit EQUAL array element specified number of times",
    "testNamePattern": "InsertionSort should visit EQUAL array element specified number of times",
    "testFilePaths": [
      "src/algorithms/sorting/insertion-sort/__test__/InsertionSort.test.js"
    ],
    "number": 219
  },
  {
    "chapterGroup": "sorting",
    "chapter": "insertion-sort",
    "algo": "insertion-sort_InsertionSort",
    "name": "InsertionSort should visit SORTED array element specified number of times@InsertionSort.test.js",
    "label": "InsertionSort should visit SORTED array element specified number of times",
    "testNamePattern": "InsertionSort should visit SORTED array element specified number of times",
    "testFilePaths": [
      "src/algorithms/sorting/insertion-sort/__test__/InsertionSort.test.js"
    ],
    "number": 220
  },
  {
    "chapterGroup": "sorting",
    "chapter": "insertion-sort",
    "algo": "insertion-sort_InsertionSort",
    "name": "InsertionSort should visit NOT SORTED array element specified number of times@InsertionSort.test.js",
    "label": "InsertionSort should visit NOT SORTED array element specified number of times",
    "testNamePattern": "InsertionSort should visit NOT SORTED array element specified number of times",
    "testFilePaths": [
      "src/algorithms/sorting/insertion-sort/__test__/InsertionSort.test.js"
    ],
    "number": 221
  },
  {
    "chapterGroup": "sorting",
    "chapter": "insertion-sort",
    "algo": "insertion-sort_InsertionSort",
    "name": "InsertionSort should visit REVERSE SORTED array element specified number of times@InsertionSort.test.js",
    "label": "InsertionSort should visit REVERSE SORTED array element specified number of times",
    "testNamePattern": "InsertionSort should visit REVERSE SORTED array element specified number of times",
    "testFilePaths": [
      "src/algorithms/sorting/insertion-sort/__test__/InsertionSort.test.js"
    ],
    "number": 222
  },
  {
    "chapterGroup": "sorting",
    "chapter": "merge-sort",
    "algo": "merge-sort_MergeSort",
    "name": "MergeSort should sort array@MergeSort.test.js",
    "label": "MergeSort should sort array",
    "testNamePattern": "MergeSort should sort array",
    "testFilePaths": [
      "src/algorithms/sorting/merge-sort/__test__/MergeSort.test.js"
    ],
    "number": 223
  },
  {
    "chapterGroup": "sorting",
    "chapter": "merge-sort",
    "algo": "merge-sort_MergeSort",
    "name": "MergeSort should sort array with custom comparator@MergeSort.test.js",
    "label": "MergeSort should sort array with custom comparator",
    "testNamePattern": "MergeSort should sort array with custom comparator",
    "testFilePaths": [
      "src/algorithms/sorting/merge-sort/__test__/MergeSort.test.js"
    ],
    "number": 224
  },
  {
    "chapterGroup": "sorting",
    "chapter": "merge-sort",
    "algo": "merge-sort_MergeSort",
    "name": "MergeSort should do stable sorting@MergeSort.test.js",
    "label": "MergeSort should do stable sorting",
    "testNamePattern": "MergeSort should do stable sorting",
    "testFilePaths": [
      "src/algorithms/sorting/merge-sort/__test__/MergeSort.test.js"
    ],
    "number": 225
  },
  {
    "chapterGroup": "sorting",
    "chapter": "merge-sort",
    "algo": "merge-sort_MergeSort",
    "name": "MergeSort should sort negative numbers@MergeSort.test.js",
    "label": "MergeSort should sort negative numbers",
    "testNamePattern": "MergeSort should sort negative numbers",
    "testFilePaths": [
      "src/algorithms/sorting/merge-sort/__test__/MergeSort.test.js"
    ],
    "number": 226
  },
  {
    "chapterGroup": "sorting",
    "chapter": "merge-sort",
    "algo": "merge-sort_MergeSort",
    "name": "MergeSort should visit EQUAL array element specified number of times@MergeSort.test.js",
    "label": "MergeSort should visit EQUAL array element specified number of times",
    "testNamePattern": "MergeSort should visit EQUAL array element specified number of times",
    "testFilePaths": [
      "src/algorithms/sorting/merge-sort/__test__/MergeSort.test.js"
    ],
    "number": 227
  },
  {
    "chapterGroup": "sorting",
    "chapter": "merge-sort",
    "algo": "merge-sort_MergeSort",
    "name": "MergeSort should visit SORTED array element specified number of times@MergeSort.test.js",
    "label": "MergeSort should visit SORTED array element specified number of times",
    "testNamePattern": "MergeSort should visit SORTED array element specified number of times",
    "testFilePaths": [
      "src/algorithms/sorting/merge-sort/__test__/MergeSort.test.js"
    ],
    "number": 228
  },
  {
    "chapterGroup": "sorting",
    "chapter": "merge-sort",
    "algo": "merge-sort_MergeSort",
    "name": "MergeSort should visit NOT SORTED array element specified number of times@MergeSort.test.js",
    "label": "MergeSort should visit NOT SORTED array element specified number of times",
    "testNamePattern": "MergeSort should visit NOT SORTED array element specified number of times",
    "testFilePaths": [
      "src/algorithms/sorting/merge-sort/__test__/MergeSort.test.js"
    ],
    "number": 229
  },
  {
    "chapterGroup": "sorting",
    "chapter": "merge-sort",
    "algo": "merge-sort_MergeSort",
    "name": "MergeSort should visit REVERSE SORTED array element specified number of times@MergeSort.test.js",
    "label": "MergeSort should visit REVERSE SORTED array element specified number of times",
    "testNamePattern": "MergeSort should visit REVERSE SORTED array element specified number of times",
    "testFilePaths": [
      "src/algorithms/sorting/merge-sort/__test__/MergeSort.test.js"
    ],
    "number": 230
  },
  {
    "chapterGroup": "sorting",
    "chapter": "quick-sort",
    "algo": "quick-sort_QuickSort",
    "name": "QuickSort should sort array@QuickSort.test.js",
    "label": "QuickSort should sort array",
    "testNamePattern": "QuickSort should sort array",
    "testFilePaths": [
      "src/algorithms/sorting/quick-sort/__test__/QuickSort.test.js"
    ],
    "number": 231
  },
  {
    "chapterGroup": "sorting",
    "chapter": "quick-sort",
    "algo": "quick-sort_QuickSort",
    "name": "QuickSort should sort array with custom comparator@QuickSort.test.js",
    "label": "QuickSort should sort array with custom comparator",
    "testNamePattern": "QuickSort should sort array with custom comparator",
    "testFilePaths": [
      "src/algorithms/sorting/quick-sort/__test__/QuickSort.test.js"
    ],
    "number": 232
  },
  {
    "chapterGroup": "sorting",
    "chapter": "quick-sort",
    "algo": "quick-sort_QuickSort",
    "name": "QuickSort should do stable sorting@QuickSort.test.js",
    "label": "QuickSort should do stable sorting",
    "testNamePattern": "QuickSort should do stable sorting",
    "testFilePaths": [
      "src/algorithms/sorting/quick-sort/__test__/QuickSort.test.js"
    ],
    "number": 233
  },
  {
    "chapterGroup": "sorting",
    "chapter": "quick-sort",
    "algo": "quick-sort_QuickSort",
    "name": "QuickSort should sort negative numbers@QuickSort.test.js",
    "label": "QuickSort should sort negative numbers",
    "testNamePattern": "QuickSort should sort negative numbers",
    "testFilePaths": [
      "src/algorithms/sorting/quick-sort/__test__/QuickSort.test.js"
    ],
    "number": 234
  },
  {
    "chapterGroup": "sorting",
    "chapter": "quick-sort",
    "algo": "quick-sort_QuickSort",
    "name": "QuickSort should visit EQUAL array element specified number of times@QuickSort.test.js",
    "label": "QuickSort should visit EQUAL array element specified number of times",
    "testNamePattern": "QuickSort should visit EQUAL array element specified number of times",
    "testFilePaths": [
      "src/algorithms/sorting/quick-sort/__test__/QuickSort.test.js"
    ],
    "number": 235
  },
  {
    "chapterGroup": "sorting",
    "chapter": "quick-sort",
    "algo": "quick-sort_QuickSort",
    "name": "QuickSort should visit SORTED array element specified number of times@QuickSort.test.js",
    "label": "QuickSort should visit SORTED array element specified number of times",
    "testNamePattern": "QuickSort should visit SORTED array element specified number of times",
    "testFilePaths": [
      "src/algorithms/sorting/quick-sort/__test__/QuickSort.test.js"
    ],
    "number": 236
  },
  {
    "chapterGroup": "sorting",
    "chapter": "quick-sort",
    "algo": "quick-sort_QuickSort",
    "name": "QuickSort should visit NOT SORTED array element specified number of times@QuickSort.test.js",
    "label": "QuickSort should visit NOT SORTED array element specified number of times",
    "testNamePattern": "QuickSort should visit NOT SORTED array element specified number of times",
    "testFilePaths": [
      "src/algorithms/sorting/quick-sort/__test__/QuickSort.test.js"
    ],
    "number": 237
  },
  {
    "chapterGroup": "sorting",
    "chapter": "quick-sort",
    "algo": "quick-sort_QuickSort",
    "name": "QuickSort should visit REVERSE SORTED array element specified number of times@QuickSort.test.js",
    "label": "QuickSort should visit REVERSE SORTED array element specified number of times",
    "testNamePattern": "QuickSort should visit REVERSE SORTED array element specified number of times",
    "testFilePaths": [
      "src/algorithms/sorting/quick-sort/__test__/QuickSort.test.js"
    ],
    "number": 238
  },
  {
    "chapterGroup": "sorting",
    "chapter": "quick-sort",
    "algo": "quick-sort_QuickSortInPlace",
    "name": "QuickSortInPlace should sort array@QuickSortInPlace.test.js",
    "label": "QuickSortInPlace should sort array",
    "testNamePattern": "QuickSortInPlace should sort array",
    "testFilePaths": [
      "src/algorithms/sorting/quick-sort/__test__/QuickSortInPlace.test.js"
    ],
    "number": 239
  },
  {
    "chapterGroup": "sorting",
    "chapter": "quick-sort",
    "algo": "quick-sort_QuickSortInPlace",
    "name": "QuickSortInPlace should sort array with custom comparator@QuickSortInPlace.test.js",
    "label": "QuickSortInPlace should sort array with custom comparator",
    "testNamePattern": "QuickSortInPlace should sort array with custom comparator",
    "testFilePaths": [
      "src/algorithms/sorting/quick-sort/__test__/QuickSortInPlace.test.js"
    ],
    "number": 240
  },
  {
    "chapterGroup": "sorting",
    "chapter": "quick-sort",
    "algo": "quick-sort_QuickSortInPlace",
    "name": "QuickSortInPlace should sort negative numbers@QuickSortInPlace.test.js",
    "label": "QuickSortInPlace should sort negative numbers",
    "testNamePattern": "QuickSortInPlace should sort negative numbers",
    "testFilePaths": [
      "src/algorithms/sorting/quick-sort/__test__/QuickSortInPlace.test.js"
    ],
    "number": 241
  },
  {
    "chapterGroup": "sorting",
    "chapter": "quick-sort",
    "algo": "quick-sort_QuickSortInPlace",
    "name": "QuickSortInPlace should visit EQUAL array element specified number of times@QuickSortInPlace.test.js",
    "label": "QuickSortInPlace should visit EQUAL array element specified number of times",
    "testNamePattern": "QuickSortInPlace should visit EQUAL array element specified number of times",
    "testFilePaths": [
      "src/algorithms/sorting/quick-sort/__test__/QuickSortInPlace.test.js"
    ],
    "number": 242
  },
  {
    "chapterGroup": "sorting",
    "chapter": "quick-sort",
    "algo": "quick-sort_QuickSortInPlace",
    "name": "QuickSortInPlace should visit SORTED array element specified number of times@QuickSortInPlace.test.js",
    "label": "QuickSortInPlace should visit SORTED array element specified number of times",
    "testNamePattern": "QuickSortInPlace should visit SORTED array element specified number of times",
    "testFilePaths": [
      "src/algorithms/sorting/quick-sort/__test__/QuickSortInPlace.test.js"
    ],
    "number": 243
  },
  {
    "chapterGroup": "sorting",
    "chapter": "quick-sort",
    "algo": "quick-sort_QuickSortInPlace",
    "name": "QuickSortInPlace should visit NOT SORTED array element specified number of times@QuickSortInPlace.test.js",
    "label": "QuickSortInPlace should visit NOT SORTED array element specified number of times",
    "testNamePattern": "QuickSortInPlace should visit NOT SORTED array element specified number of times",
    "testFilePaths": [
      "src/algorithms/sorting/quick-sort/__test__/QuickSortInPlace.test.js"
    ],
    "number": 244
  },
  {
    "chapterGroup": "sorting",
    "chapter": "quick-sort",
    "algo": "quick-sort_QuickSortInPlace",
    "name": "QuickSortInPlace should visit REVERSE SORTED array element specified number of times@QuickSortInPlace.test.js",
    "label": "QuickSortInPlace should visit REVERSE SORTED array element specified number of times",
    "testNamePattern": "QuickSortInPlace should visit REVERSE SORTED array element specified number of times",
    "testFilePaths": [
      "src/algorithms/sorting/quick-sort/__test__/QuickSortInPlace.test.js"
    ],
    "number": 245
  },
  {
    "chapterGroup": "sorting",
    "chapter": "radix-sort",
    "algo": "radix-sort_RadixSort",
    "name": "RadixSort should sort array@RadixSort.test.js",
    "label": "RadixSort should sort array",
    "testNamePattern": "RadixSort should sort array",
    "testFilePaths": [
      "src/algorithms/sorting/radix-sort/__test__/RadixSort.test.js"
    ],
    "number": 246
  },
  {
    "chapterGroup": "sorting",
    "chapter": "radix-sort",
    "algo": "radix-sort_RadixSort",
    "name": "RadixSort should visit array of strings n (number of strings) x m (length of longest element) times@RadixSort.test.js",
    "label": "RadixSort should visit array of strings n (number of strings) x m (length of longest element) times",
    "testNamePattern": "RadixSort should visit array of strings n .number of strings. x m .length of longest element. times",
    "testFilePaths": [
      "src/algorithms/sorting/radix-sort/__test__/RadixSort.test.js"
    ],
    "number": 247
  },
  {
    "chapterGroup": "sorting",
    "chapter": "radix-sort",
    "algo": "radix-sort_RadixSort",
    "name": "RadixSort should visit array of integers n (number of elements) x m (length of longest integer) times@RadixSort.test.js",
    "label": "RadixSort should visit array of integers n (number of elements) x m (length of longest integer) times",
    "testNamePattern": "RadixSort should visit array of integers n .number of elements. x m .length of longest integer. times",
    "testFilePaths": [
      "src/algorithms/sorting/radix-sort/__test__/RadixSort.test.js"
    ],
    "number": 248
  },
  {
    "chapterGroup": "sorting",
    "chapter": "selection-sort",
    "algo": "selection-sort_SelectionSort",
    "name": "SelectionSort should sort array@SelectionSort.test.js",
    "label": "SelectionSort should sort array",
    "testNamePattern": "SelectionSort should sort array",
    "testFilePaths": [
      "src/algorithms/sorting/selection-sort/__test__/SelectionSort.test.js"
    ],
    "number": 249
  },
  {
    "chapterGroup": "sorting",
    "chapter": "selection-sort",
    "algo": "selection-sort_SelectionSort",
    "name": "SelectionSort should sort array with custom comparator@SelectionSort.test.js",
    "label": "SelectionSort should sort array with custom comparator",
    "testNamePattern": "SelectionSort should sort array with custom comparator",
    "testFilePaths": [
      "src/algorithms/sorting/selection-sort/__test__/SelectionSort.test.js"
    ],
    "number": 250
  },
  {
    "chapterGroup": "sorting",
    "chapter": "selection-sort",
    "algo": "selection-sort_SelectionSort",
    "name": "SelectionSort should sort negative numbers@SelectionSort.test.js",
    "label": "SelectionSort should sort negative numbers",
    "testNamePattern": "SelectionSort should sort negative numbers",
    "testFilePaths": [
      "src/algorithms/sorting/selection-sort/__test__/SelectionSort.test.js"
    ],
    "number": 251
  },
  {
    "chapterGroup": "sorting",
    "chapter": "selection-sort",
    "algo": "selection-sort_SelectionSort",
    "name": "SelectionSort should visit EQUAL array element specified number of times@SelectionSort.test.js",
    "label": "SelectionSort should visit EQUAL array element specified number of times",
    "testNamePattern": "SelectionSort should visit EQUAL array element specified number of times",
    "testFilePaths": [
      "src/algorithms/sorting/selection-sort/__test__/SelectionSort.test.js"
    ],
    "number": 252
  },
  {
    "chapterGroup": "sorting",
    "chapter": "selection-sort",
    "algo": "selection-sort_SelectionSort",
    "name": "SelectionSort should visit SORTED array element specified number of times@SelectionSort.test.js",
    "label": "SelectionSort should visit SORTED array element specified number of times",
    "testNamePattern": "SelectionSort should visit SORTED array element specified number of times",
    "testFilePaths": [
      "src/algorithms/sorting/selection-sort/__test__/SelectionSort.test.js"
    ],
    "number": 253
  },
  {
    "chapterGroup": "sorting",
    "chapter": "selection-sort",
    "algo": "selection-sort_SelectionSort",
    "name": "SelectionSort should visit NOT SORTED array element specified number of times@SelectionSort.test.js",
    "label": "SelectionSort should visit NOT SORTED array element specified number of times",
    "testNamePattern": "SelectionSort should visit NOT SORTED array element specified number of times",
    "testFilePaths": [
      "src/algorithms/sorting/selection-sort/__test__/SelectionSort.test.js"
    ],
    "number": 254
  },
  {
    "chapterGroup": "sorting",
    "chapter": "selection-sort",
    "algo": "selection-sort_SelectionSort",
    "name": "SelectionSort should visit REVERSE SORTED array element specified number of times@SelectionSort.test.js",
    "label": "SelectionSort should visit REVERSE SORTED array element specified number of times",
    "testNamePattern": "SelectionSort should visit REVERSE SORTED array element specified number of times",
    "testFilePaths": [
      "src/algorithms/sorting/selection-sort/__test__/SelectionSort.test.js"
    ],
    "number": 255
  },
  {
    "chapterGroup": "sorting",
    "chapter": "shell-sort",
    "algo": "shell-sort_ShellSort",
    "name": "ShellSort should sort array@ShellSort.test.js",
    "label": "ShellSort should sort array",
    "testNamePattern": "ShellSort should sort array",
    "testFilePaths": [
      "src/algorithms/sorting/shell-sort/__test__/ShellSort.test.js"
    ],
    "number": 256
  },
  {
    "chapterGroup": "sorting",
    "chapter": "shell-sort",
    "algo": "shell-sort_ShellSort",
    "name": "ShellSort should sort array with custom comparator@ShellSort.test.js",
    "label": "ShellSort should sort array with custom comparator",
    "testNamePattern": "ShellSort should sort array with custom comparator",
    "testFilePaths": [
      "src/algorithms/sorting/shell-sort/__test__/ShellSort.test.js"
    ],
    "number": 257
  },
  {
    "chapterGroup": "sorting",
    "chapter": "shell-sort",
    "algo": "shell-sort_ShellSort",
    "name": "ShellSort should sort negative numbers@ShellSort.test.js",
    "label": "ShellSort should sort negative numbers",
    "testNamePattern": "ShellSort should sort negative numbers",
    "testFilePaths": [
      "src/algorithms/sorting/shell-sort/__test__/ShellSort.test.js"
    ],
    "number": 258
  },
  {
    "chapterGroup": "sorting",
    "chapter": "shell-sort",
    "algo": "shell-sort_ShellSort",
    "name": "ShellSort should visit EQUAL array element specified number of times@ShellSort.test.js",
    "label": "ShellSort should visit EQUAL array element specified number of times",
    "testNamePattern": "ShellSort should visit EQUAL array element specified number of times",
    "testFilePaths": [
      "src/algorithms/sorting/shell-sort/__test__/ShellSort.test.js"
    ],
    "number": 259
  },
  {
    "chapterGroup": "sorting",
    "chapter": "shell-sort",
    "algo": "shell-sort_ShellSort",
    "name": "ShellSort should visit SORTED array element specified number of times@ShellSort.test.js",
    "label": "ShellSort should visit SORTED array element specified number of times",
    "testNamePattern": "ShellSort should visit SORTED array element specified number of times",
    "testFilePaths": [
      "src/algorithms/sorting/shell-sort/__test__/ShellSort.test.js"
    ],
    "number": 260
  },
  {
    "chapterGroup": "sorting",
    "chapter": "shell-sort",
    "algo": "shell-sort_ShellSort",
    "name": "ShellSort should visit NOT SORTED array element specified number of times@ShellSort.test.js",
    "label": "ShellSort should visit NOT SORTED array element specified number of times",
    "testNamePattern": "ShellSort should visit NOT SORTED array element specified number of times",
    "testFilePaths": [
      "src/algorithms/sorting/shell-sort/__test__/ShellSort.test.js"
    ],
    "number": 261
  },
  {
    "chapterGroup": "sorting",
    "chapter": "shell-sort",
    "algo": "shell-sort_ShellSort",
    "name": "ShellSort should visit REVERSE SORTED array element specified number of times@ShellSort.test.js",
    "label": "ShellSort should visit REVERSE SORTED array element specified number of times",
    "testNamePattern": "ShellSort should visit REVERSE SORTED array element specified number of times",
    "testFilePaths": [
      "src/algorithms/sorting/shell-sort/__test__/ShellSort.test.js"
    ],
    "number": 262
  },
  {
    "chapterGroup": "statistics",
    "chapter": "weighted-random",
    "algo": "weighted-random_weightedRandom",
    "name": "weightedRandom should throw an error when the number of weights does not match the number of items@weightedRandom.test.js",
    "label": "weightedRandom should throw an error when the number of weights does not match the number of items",
    "testNamePattern": "weightedRandom should throw an error when the number of weights does not match the number of items",
    "testFilePaths": [
      "src/algorithms/statistics/weighted-random/__test__/weightedRandom.test.js"
    ],
    "number": 263
  },
  {
    "chapterGroup": "statistics",
    "chapter": "weighted-random",
    "algo": "weighted-random_weightedRandom",
    "name": "weightedRandom should throw an error when the number of weights or items are empty@weightedRandom.test.js",
    "label": "weightedRandom should throw an error when the number of weights or items are empty",
    "testNamePattern": "weightedRandom should throw an error when the number of weights or items are empty",
    "testFilePaths": [
      "src/algorithms/statistics/weighted-random/__test__/weightedRandom.test.js"
    ],
    "number": 264
  },
  {
    "chapterGroup": "statistics",
    "chapter": "weighted-random",
    "algo": "weighted-random_weightedRandom",
    "name": "weightedRandom should correctly do random selection based on wights in straightforward cases@weightedRandom.test.js",
    "label": "weightedRandom should correctly do random selection based on wights in straightforward cases",
    "testNamePattern": "weightedRandom should correctly do random selection based on wights in straightforward cases",
    "testFilePaths": [
      "src/algorithms/statistics/weighted-random/__test__/weightedRandom.test.js"
    ],
    "number": 265
  },
  {
    "chapterGroup": "statistics",
    "chapter": "weighted-random",
    "algo": "weighted-random_weightedRandom",
    "name": "weightedRandom should correctly do random selection based on wights@weightedRandom.test.js",
    "label": "weightedRandom should correctly do random selection based on wights",
    "testNamePattern": "weightedRandom should correctly do random selection based on wights",
    "testFilePaths": [
      "src/algorithms/statistics/weighted-random/__test__/weightedRandom.test.js"
    ],
    "number": 266
  },
  {
    "chapterGroup": "string",
    "chapter": "hamming-distance",
    "algo": "hamming-distance_hammingDistance",
    "name": "hammingDistance should throw an error when trying to compare the strings of different lengths@hammingDistance.test.js",
    "label": "hammingDistance should throw an error when trying to compare the strings of different lengths",
    "testNamePattern": "hammingDistance should throw an error when trying to compare the strings of different lengths",
    "testFilePaths": [
      "src/algorithms/string/hamming-distance/__test__/hammingDistance.test.js"
    ],
    "number": 267
  },
  {
    "chapterGroup": "string",
    "chapter": "hamming-distance",
    "algo": "hamming-distance_hammingDistance",
    "name": "hammingDistance should calculate difference between two strings@hammingDistance.test.js",
    "label": "hammingDistance should calculate difference between two strings",
    "testNamePattern": "hammingDistance should calculate difference between two strings",
    "testFilePaths": [
      "src/algorithms/string/hamming-distance/__test__/hammingDistance.test.js"
    ],
    "number": 268
  },
  {
    "chapterGroup": "string",
    "chapter": "knuth-morris-pratt",
    "algo": "knuth-morris-pratt_knuthMorrisPratt",
    "name": "knuthMorrisPratt should find word position in given text@knuthMorrisPratt.test.js",
    "label": "knuthMorrisPratt should find word position in given text",
    "testNamePattern": "knuthMorrisPratt should find word position in given text",
    "testFilePaths": [
      "src/algorithms/string/knuth-morris-pratt/__test__/knuthMorrisPratt.test.js"
    ],
    "number": 269
  },
  {
    "chapterGroup": "string",
    "chapter": "levenshtein-distance",
    "algo": "levenshtein-distance_levenshteinDistance",
    "name": "levenshteinDistance should calculate edit distance between two strings@levenshteinDistance.test.js",
    "label": "levenshteinDistance should calculate edit distance between two strings",
    "testNamePattern": "levenshteinDistance should calculate edit distance between two strings",
    "testFilePaths": [
      "src/algorithms/string/levenshtein-distance/__test__/levenshteinDistance.test.js"
    ],
    "number": 270
  },
  {
    "chapterGroup": "string",
    "chapter": "longest-common-substring",
    "algo": "longest-common-substring_longestCommonSubstring",
    "name": "longestCommonSubstring should find longest common substring between two strings@longestCommonSubstring.test.js",
    "label": "longestCommonSubstring should find longest common substring between two strings",
    "testNamePattern": "longestCommonSubstring should find longest common substring between two strings",
    "testFilePaths": [
      "src/algorithms/string/longest-common-substring/__test__/longestCommonSubstring.test.js"
    ],
    "number": 271
  },
  {
    "chapterGroup": "string",
    "chapter": "longest-common-substring",
    "algo": "longest-common-substring_longestCommonSubstring",
    "name": "longestCommonSubstring should handle unicode correctly@longestCommonSubstring.test.js",
    "label": "longestCommonSubstring should handle unicode correctly",
    "testNamePattern": "longestCommonSubstring should handle unicode correctly",
    "testFilePaths": [
      "src/algorithms/string/longest-common-substring/__test__/longestCommonSubstring.test.js"
    ],
    "number": 272
  },
  {
    "chapterGroup": "string",
    "chapter": "palindrome",
    "algo": "palindrome_isPalindrome",
    "name": "palindromeCheck should return whether or not the string is a palindrome@isPalindrome.test.js",
    "label": "palindromeCheck should return whether or not the string is a palindrome",
    "testNamePattern": "palindromeCheck should return whether or not the string is a palindrome",
    "testFilePaths": [
      "src/algorithms/string/palindrome/__test__/isPalindrome.test.js"
    ],
    "number": 273
  },
  {
    "chapterGroup": "string",
    "chapter": "rabin-karp",
    "algo": "rabin-karp_rabinKarp",
    "name": "rabinKarp should find substring in a string@rabinKarp.test.js",
    "label": "rabinKarp should find substring in a string",
    "testNamePattern": "rabinKarp should find substring in a string",
    "testFilePaths": [
      "src/algorithms/string/rabin-karp/__test__/rabinKarp.test.js"
    ],
    "number": 274
  },
  {
    "chapterGroup": "string",
    "chapter": "rabin-karp",
    "algo": "rabin-karp_rabinKarp",
    "name": "rabinKarp should work with bigger texts@rabinKarp.test.js",
    "label": "rabinKarp should work with bigger texts",
    "testNamePattern": "rabinKarp should work with bigger texts",
    "testFilePaths": [
      "src/algorithms/string/rabin-karp/__test__/rabinKarp.test.js"
    ],
    "number": 275
  },
  {
    "chapterGroup": "string",
    "chapter": "rabin-karp",
    "algo": "rabin-karp_rabinKarp",
    "name": "rabinKarp should work with UTF symbols@rabinKarp.test.js",
    "label": "rabinKarp should work with UTF symbols",
    "testNamePattern": "rabinKarp should work with UTF symbols",
    "testFilePaths": [
      "src/algorithms/string/rabin-karp/__test__/rabinKarp.test.js"
    ],
    "number": 276
  },
  {
    "chapterGroup": "string",
    "chapter": "regular-expression-matching",
    "algo": "regular-expression-matching_regularExpressionMatching",
    "name": "regularExpressionMatching should match regular expressions in a string@regularExpressionMatching.test.js",
    "label": "regularExpressionMatching should match regular expressions in a string",
    "testNamePattern": "regularExpressionMatching should match regular expressions in a string",
    "testFilePaths": [
      "src/algorithms/string/regular-expression-matching/__test__/regularExpressionMatching.test.js"
    ],
    "number": 277
  },
  {
    "chapterGroup": "string",
    "chapter": "z-algorithm",
    "algo": "z-algorithm_zAlgorithm",
    "name": "zAlgorithm should find word positions in given text@zAlgorithm.test.js",
    "label": "zAlgorithm should find word positions in given text",
    "testNamePattern": "zAlgorithm should find word positions in given text",
    "testFilePaths": [
      "src/algorithms/string/z-algorithm/__test__/zAlgorithm.test.js"
    ],
    "number": 278
  },
  {
    "chapterGroup": "tree",
    "chapter": "breadth-first-search",
    "algo": "breadth-first-search_breadthFirstSearch",
    "name": "breadthFirstSearch should perform BFS operation on tree@breadthFirstSearch.test.js",
    "label": "breadthFirstSearch should perform BFS operation on tree",
    "testNamePattern": "breadthFirstSearch should perform BFS operation on tree",
    "testFilePaths": [
      "src/algorithms/tree/breadth-first-search/__test__/breadthFirstSearch.test.js"
    ],
    "number": 279
  },
  {
    "chapterGroup": "tree",
    "chapter": "breadth-first-search",
    "algo": "breadth-first-search_breadthFirstSearch",
    "name": "breadthFirstSearch allow users to redefine node visiting logic@breadthFirstSearch.test.js",
    "label": "breadthFirstSearch allow users to redefine node visiting logic",
    "testNamePattern": "breadthFirstSearch allow users to redefine node visiting logic",
    "testFilePaths": [
      "src/algorithms/tree/breadth-first-search/__test__/breadthFirstSearch.test.js"
    ],
    "number": 280
  },
  {
    "chapterGroup": "tree",
    "chapter": "depth-first-search",
    "algo": "depth-first-search_depthFirstSearch",
    "name": "depthFirstSearch should perform DFS operation on tree@depthFirstSearch.test.js",
    "label": "depthFirstSearch should perform DFS operation on tree",
    "testNamePattern": "depthFirstSearch should perform DFS operation on tree",
    "testFilePaths": [
      "src/algorithms/tree/depth-first-search/__test__/depthFirstSearch.test.js"
    ],
    "number": 281
  },
  {
    "chapterGroup": "tree",
    "chapter": "depth-first-search",
    "algo": "depth-first-search_depthFirstSearch",
    "name": "depthFirstSearch allow users to redefine node visiting logic@depthFirstSearch.test.js",
    "label": "depthFirstSearch allow users to redefine node visiting logic",
    "testNamePattern": "depthFirstSearch allow users to redefine node visiting logic",
    "testFilePaths": [
      "src/algorithms/tree/depth-first-search/__test__/depthFirstSearch.test.js"
    ],
    "number": 282
  },
  {
    "chapterGroup": "uncategorized",
    "chapter": "best-time-to-buy-sell-stocks",
    "algo": "best-time-to-buy-sell-stocks_accumulatorBestTimeToBuySellStocks",
    "name": "accumulatorBestTimeToBuySellStocks should find the best time to buy and sell stocks@accumulatorBestTimeToBuySellStocks.test.js",
    "label": "accumulatorBestTimeToBuySellStocks should find the best time to buy and sell stocks",
    "testNamePattern": "accumulatorBestTimeToBuySellStocks should find the best time to buy and sell stocks",
    "testFilePaths": [
      "src/algorithms/uncategorized/best-time-to-buy-sell-stocks/__tests__/accumulatorBestTimeToBuySellStocks.test.js"
    ],
    "number": 283
  },
  {
    "chapterGroup": "uncategorized",
    "chapter": "best-time-to-buy-sell-stocks",
    "algo": "best-time-to-buy-sell-stocks_peakvalleyBestTimeToBuySellStocks",
    "name": "peakvalleyBestTimeToBuySellStocks should find the best time to buy and sell stocks@peakvalleyBestTimeToBuySellStocks.test.js",
    "label": "peakvalleyBestTimeToBuySellStocks should find the best time to buy and sell stocks",
    "testNamePattern": "peakvalleyBestTimeToBuySellStocks should find the best time to buy and sell stocks",
    "testFilePaths": [
      "src/algorithms/uncategorized/best-time-to-buy-sell-stocks/__tests__/peakvalleyBestTimeToBuySellStocks.test.js"
    ],
    "number": 284
  },
  {
    "chapterGroup": "uncategorized",
    "chapter": "best-time-to-buy-sell-stocks",
    "algo": "best-time-to-buy-sell-stocks_dqBestTimeToBuySellStocks",
    "name": "dqBestTimeToBuySellStocks should find the best time to buy and sell stocks@dqBestTimeToBuySellStocks.test.js",
    "label": "dqBestTimeToBuySellStocks should find the best time to buy and sell stocks",
    "testNamePattern": "dqBestTimeToBuySellStocks should find the best time to buy and sell stocks",
    "testFilePaths": [
      "src/algorithms/uncategorized/best-time-to-buy-sell-stocks/__tests__/dqBestTimeToBuySellStocks.test.js"
    ],
    "number": 285
  },
  {
    "chapterGroup": "uncategorized",
    "chapter": "best-time-to-buy-sell-stocks",
    "algo": "best-time-to-buy-sell-stocks_dpBestTimeToBuySellStocks",
    "name": "dpBestTimeToBuySellStocks should find the best time to buy and sell stocks@dpBestTimeToBuySellStocks.test.js",
    "label": "dpBestTimeToBuySellStocks should find the best time to buy and sell stocks",
    "testNamePattern": "dpBestTimeToBuySellStocks should find the best time to buy and sell stocks",
    "testFilePaths": [
      "src/algorithms/uncategorized/best-time-to-buy-sell-stocks/__tests__/dpBestTimeToBuySellStocks.test.js"
    ],
    "number": 286
  },
  {
    "chapterGroup": "uncategorized",
    "chapter": "hanoi-tower",
    "algo": "hanoi-tower_hanoiTower",
    "name": "hanoiTower should solve tower of hanoi puzzle with 2 discs@hanoiTower.test.js",
    "label": "hanoiTower should solve tower of hanoi puzzle with 2 discs",
    "testNamePattern": "hanoiTower should solve tower of hanoi puzzle with 2 discs",
    "testFilePaths": [
      "src/algorithms/uncategorized/hanoi-tower/__test__/hanoiTower.test.js"
    ],
    "number": 287
  },
  {
    "chapterGroup": "uncategorized",
    "chapter": "hanoi-tower",
    "algo": "hanoi-tower_hanoiTower",
    "name": "hanoiTower should solve tower of hanoi puzzle with 3 discs@hanoiTower.test.js",
    "label": "hanoiTower should solve tower of hanoi puzzle with 3 discs",
    "testNamePattern": "hanoiTower should solve tower of hanoi puzzle with 3 discs",
    "testFilePaths": [
      "src/algorithms/uncategorized/hanoi-tower/__test__/hanoiTower.test.js"
    ],
    "number": 288
  },
  {
    "chapterGroup": "uncategorized",
    "chapter": "hanoi-tower",
    "algo": "hanoi-tower_hanoiTower",
    "name": "hanoiTower should solve tower of hanoi puzzle with 6 discs@hanoiTower.test.js",
    "label": "hanoiTower should solve tower of hanoi puzzle with 6 discs",
    "testNamePattern": "hanoiTower should solve tower of hanoi puzzle with 6 discs",
    "testFilePaths": [
      "src/algorithms/uncategorized/hanoi-tower/__test__/hanoiTower.test.js"
    ],
    "number": 289
  },
  {
    "chapterGroup": "uncategorized",
    "chapter": "jump-game",
    "algo": "jump-game_backtrackingJumpGame",
    "name": "backtrackingJumpGame should solve Jump Game problem in backtracking manner@backtrackingJumpGame.test.js",
    "label": "backtrackingJumpGame should solve Jump Game problem in backtracking manner",
    "testNamePattern": "backtrackingJumpGame should solve Jump Game problem in backtracking manner",
    "testFilePaths": [
      "src/algorithms/uncategorized/jump-game/__test__/backtrackingJumpGame.test.js"
    ],
    "number": 290
  },
  {
    "chapterGroup": "uncategorized",
    "chapter": "jump-game",
    "algo": "jump-game_dpBottomUpJumpGame",
    "name": "dpBottomUpJumpGame should solve Jump Game problem in bottom-up dynamic programming manner@dpBottomUpJumpGame.test.js",
    "label": "dpBottomUpJumpGame should solve Jump Game problem in bottom-up dynamic programming manner",
    "testNamePattern": "dpBottomUpJumpGame should solve Jump Game problem in bottom-up dynamic programming manner",
    "testFilePaths": [
      "src/algorithms/uncategorized/jump-game/__test__/dpBottomUpJumpGame.test.js"
    ],
    "number": 291
  },
  {
    "chapterGroup": "uncategorized",
    "chapter": "jump-game",
    "algo": "jump-game_dpTopDownJumpGame",
    "name": "dpTopDownJumpGame should solve Jump Game problem in top-down dynamic programming manner@dpTopDownJumpGame.test.js",
    "label": "dpTopDownJumpGame should solve Jump Game problem in top-down dynamic programming manner",
    "testNamePattern": "dpTopDownJumpGame should solve Jump Game problem in top-down dynamic programming manner",
    "testFilePaths": [
      "src/algorithms/uncategorized/jump-game/__test__/dpTopDownJumpGame.test.js"
    ],
    "number": 292
  },
  {
    "chapterGroup": "uncategorized",
    "chapter": "jump-game",
    "algo": "jump-game_greedyJumpGame",
    "name": "greedyJumpGame should solve Jump Game problem in greedy manner@greedyJumpGame.test.js",
    "label": "greedyJumpGame should solve Jump Game problem in greedy manner",
    "testNamePattern": "greedyJumpGame should solve Jump Game problem in greedy manner",
    "testFilePaths": [
      "src/algorithms/uncategorized/jump-game/__test__/greedyJumpGame.test.js"
    ],
    "number": 293
  },
  {
    "chapterGroup": "uncategorized",
    "chapter": "knight-tour",
    "algo": "knight-tour_knightTour",
    "name": "knightTour should not find solution on 3x3 board@knightTour.test.js",
    "label": "knightTour should not find solution on 3x3 board",
    "testNamePattern": "knightTour should not find solution on 3x3 board",
    "testFilePaths": [
      "src/algorithms/uncategorized/knight-tour/__test__/knightTour.test.js"
    ],
    "number": 294
  },
  {
    "chapterGroup": "uncategorized",
    "chapter": "knight-tour",
    "algo": "knight-tour_knightTour",
    "name": "knightTour should find one solution to do knight tour on 5x5 board@knightTour.test.js",
    "label": "knightTour should find one solution to do knight tour on 5x5 board",
    "testNamePattern": "knightTour should find one solution to do knight tour on 5x5 board",
    "testFilePaths": [
      "src/algorithms/uncategorized/knight-tour/__test__/knightTour.test.js"
    ],
    "number": 295
  },
  {
    "chapterGroup": "uncategorized",
    "chapter": "n-queens",
    "algo": "n-queens_nQueens",
    "name": "nQueens should not hae solution for 3 queens@nQueens.test.js",
    "label": "nQueens should not hae solution for 3 queens",
    "testNamePattern": "nQueens should not hae solution for 3 queens",
    "testFilePaths": [
      "src/algorithms/uncategorized/n-queens/__test__/nQueens.test.js"
    ],
    "number": 296
  },
  {
    "chapterGroup": "uncategorized",
    "chapter": "n-queens",
    "algo": "n-queens_nQueens",
    "name": "nQueens should solve n-queens problem for 4 queens@nQueens.test.js",
    "label": "nQueens should solve n-queens problem for 4 queens",
    "testNamePattern": "nQueens should solve n-queens problem for 4 queens",
    "testFilePaths": [
      "src/algorithms/uncategorized/n-queens/__test__/nQueens.test.js"
    ],
    "number": 297
  },
  {
    "chapterGroup": "uncategorized",
    "chapter": "n-queens",
    "algo": "n-queens_nQueens",
    "name": "nQueens should solve n-queens problem for 6 queens@nQueens.test.js",
    "label": "nQueens should solve n-queens problem for 6 queens",
    "testNamePattern": "nQueens should solve n-queens problem for 6 queens",
    "testFilePaths": [
      "src/algorithms/uncategorized/n-queens/__test__/nQueens.test.js"
    ],
    "number": 298
  },
  {
    "chapterGroup": "uncategorized",
    "chapter": "n-queens",
    "algo": "n-queens_QueensPosition",
    "name": "QueenPosition should store queen position on chessboard@QueensPosition.test.js",
    "label": "QueenPosition should store queen position on chessboard",
    "testNamePattern": "QueenPosition should store queen position on chessboard",
    "testFilePaths": [
      "src/algorithms/uncategorized/n-queens/__test__/QueensPosition.test.js"
    ],
    "number": 299
  },
  {
    "chapterGroup": "uncategorized",
    "chapter": "n-queens",
    "algo": "n-queens_nQueensBitwise",
    "name": "nQueensBitwise should have solutions for 4 to N queens@nQueensBitwise.test.js",
    "label": "nQueensBitwise should have solutions for 4 to N queens",
    "testNamePattern": "nQueensBitwise should have solutions for 4 to N queens",
    "testFilePaths": [
      "src/algorithms/uncategorized/n-queens/__test__/nQueensBitwise.test.js"
    ],
    "number": 300
  },
  {
    "chapterGroup": "uncategorized",
    "chapter": "rain-terraces",
    "algo": "rain-terraces_dpRainTerraces",
    "name": "dpRainTerraces should find the amount of water collected after raining@dpRainTerraces.test.js",
    "label": "dpRainTerraces should find the amount of water collected after raining",
    "testNamePattern": "dpRainTerraces should find the amount of water collected after raining",
    "testFilePaths": [
      "src/algorithms/uncategorized/rain-terraces/__test__/dpRainTerraces.test.js"
    ],
    "number": 301
  },
  {
    "chapterGroup": "uncategorized",
    "chapter": "rain-terraces",
    "algo": "rain-terraces_bfRainTerraces",
    "name": "bfRainTerraces should find the amount of water collected after raining@bfRainTerraces.test.js",
    "label": "bfRainTerraces should find the amount of water collected after raining",
    "testNamePattern": "bfRainTerraces should find the amount of water collected after raining",
    "testFilePaths": [
      "src/algorithms/uncategorized/rain-terraces/__test__/bfRainTerraces.test.js"
    ],
    "number": 302
  },
  {
    "chapterGroup": "uncategorized",
    "chapter": "recursive-staircase",
    "algo": "recursive-staircase_recursiveStaircaseMEM",
    "name": "recursiveStaircaseMEM should calculate number of variants using Brute Force with Memoization@recursiveStaircaseMEM.test.js",
    "label": "recursiveStaircaseMEM should calculate number of variants using Brute Force with Memoization",
    "testNamePattern": "recursiveStaircaseMEM should calculate number of variants using Brute Force with Memoization",
    "testFilePaths": [
      "src/algorithms/uncategorized/recursive-staircase/__test__/recursiveStaircaseMEM.test.js"
    ],
    "number": 303
  },
  {
    "chapterGroup": "uncategorized",
    "chapter": "recursive-staircase",
    "algo": "recursive-staircase_recursiveStaircaseIT",
    "name": "recursiveStaircaseIT should calculate number of variants using Iterative solution@recursiveStaircaseIT.test.js",
    "label": "recursiveStaircaseIT should calculate number of variants using Iterative solution",
    "testNamePattern": "recursiveStaircaseIT should calculate number of variants using Iterative solution",
    "testFilePaths": [
      "src/algorithms/uncategorized/recursive-staircase/__test__/recursiveStaircaseIT.test.js"
    ],
    "number": 304
  },
  {
    "chapterGroup": "uncategorized",
    "chapter": "recursive-staircase",
    "algo": "recursive-staircase_recursiveStaircaseDP",
    "name": "recursiveStaircaseDP should calculate number of variants using Dynamic Programming solution@recursiveStaircaseDP.test.js",
    "label": "recursiveStaircaseDP should calculate number of variants using Dynamic Programming solution",
    "testNamePattern": "recursiveStaircaseDP should calculate number of variants using Dynamic Programming solution",
    "testFilePaths": [
      "src/algorithms/uncategorized/recursive-staircase/__test__/recursiveStaircaseDP.test.js"
    ],
    "number": 305
  },
  {
    "chapterGroup": "uncategorized",
    "chapter": "recursive-staircase",
    "algo": "recursive-staircase_recursiveStaircaseBF",
    "name": "recursiveStaircaseBF should calculate number of variants using Brute Force solution@recursiveStaircaseBF.test.js",
    "label": "recursiveStaircaseBF should calculate number of variants using Brute Force solution",
    "testNamePattern": "recursiveStaircaseBF should calculate number of variants using Brute Force solution",
    "testFilePaths": [
      "src/algorithms/uncategorized/recursive-staircase/__test__/recursiveStaircaseBF.test.js"
    ],
    "number": 306
  },
  {
    "chapterGroup": "uncategorized",
    "chapter": "square-matrix-rotation",
    "algo": "square-matrix-rotation_squareMatrixRotation",
    "name": "squareMatrixRotation should rotate matrix #0 in-place@squareMatrixRotation.test.js",
    "label": "squareMatrixRotation should rotate matrix #0 in-place",
    "testNamePattern": "squareMatrixRotation should rotate matrix #0 in-place",
    "testFilePaths": [
      "src/algorithms/uncategorized/square-matrix-rotation/__test__/squareMatrixRotation.test.js"
    ],
    "number": 307
  },
  {
    "chapterGroup": "uncategorized",
    "chapter": "square-matrix-rotation",
    "algo": "square-matrix-rotation_squareMatrixRotation",
    "name": "squareMatrixRotation should rotate matrix #1 in-place@squareMatrixRotation.test.js",
    "label": "squareMatrixRotation should rotate matrix #1 in-place",
    "testNamePattern": "squareMatrixRotation should rotate matrix #1 in-place",
    "testFilePaths": [
      "src/algorithms/uncategorized/square-matrix-rotation/__test__/squareMatrixRotation.test.js"
    ],
    "number": 308
  },
  {
    "chapterGroup": "uncategorized",
    "chapter": "square-matrix-rotation",
    "algo": "square-matrix-rotation_squareMatrixRotation",
    "name": "squareMatrixRotation should rotate matrix #2 in-place@squareMatrixRotation.test.js",
    "label": "squareMatrixRotation should rotate matrix #2 in-place",
    "testNamePattern": "squareMatrixRotation should rotate matrix #2 in-place",
    "testFilePaths": [
      "src/algorithms/uncategorized/square-matrix-rotation/__test__/squareMatrixRotation.test.js"
    ],
    "number": 309
  },
  {
    "chapterGroup": "uncategorized",
    "chapter": "square-matrix-rotation",
    "algo": "square-matrix-rotation_squareMatrixRotation",
    "name": "squareMatrixRotation should rotate matrix #3 in-place@squareMatrixRotation.test.js",
    "label": "squareMatrixRotation should rotate matrix #3 in-place",
    "testNamePattern": "squareMatrixRotation should rotate matrix #3 in-place",
    "testFilePaths": [
      "src/algorithms/uncategorized/square-matrix-rotation/__test__/squareMatrixRotation.test.js"
    ],
    "number": 310
  },
  {
    "chapterGroup": "uncategorized",
    "chapter": "unique-paths",
    "algo": "unique-paths_btUniquePaths",
    "name": "btUniquePaths should find the number of unique paths on board@btUniquePaths.test.js",
    "label": "btUniquePaths should find the number of unique paths on board",
    "testNamePattern": "btUniquePaths should find the number of unique paths on board",
    "testFilePaths": [
      "src/algorithms/uncategorized/unique-paths/__test__/btUniquePaths.test.js"
    ],
    "number": 311
  },
  {
    "chapterGroup": "uncategorized",
    "chapter": "unique-paths",
    "algo": "unique-paths_dpUniquePaths",
    "name": "dpUniquePaths should find the number of unique paths on board@dpUniquePaths.test.js",
    "label": "dpUniquePaths should find the number of unique paths on board",
    "testNamePattern": "dpUniquePaths should find the number of unique paths on board",
    "testFilePaths": [
      "src/algorithms/uncategorized/unique-paths/__test__/dpUniquePaths.test.js"
    ],
    "number": 312
  },
  {
    "chapterGroup": "uncategorized",
    "chapter": "unique-paths",
    "algo": "unique-paths_uniquePaths",
    "name": "uniquePaths should find the number of unique paths on board@uniquePaths.test.js",
    "label": "uniquePaths should find the number of unique paths on board",
    "testNamePattern": "uniquePaths should find the number of unique paths on board",
    "testFilePaths": [
      "src/algorithms/uncategorized/unique-paths/__test__/uniquePaths.test.js"
    ],
    "number": 313
  }
]