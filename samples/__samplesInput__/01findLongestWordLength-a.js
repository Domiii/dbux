function findLongestWordLength(str) {
  const words = str.split(' ');
  let longest = 0;
  for (const word of words) {
    if (word.length > longest.length) {
      longest = word;
    }
  }
  return longest.length;
}

findLongestWordLength("The quick brown fox jumped over the lazy dog");
