function findLongestWordLength(str) {
  const words = str.split(' ');
  return words.reduce((a, w) => Math.max(a, w.length), 0);
}

findLongestWordLength("The quick brown fox jumped over the lazy dog");
