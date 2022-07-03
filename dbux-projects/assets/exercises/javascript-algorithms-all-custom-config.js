module.exports = {
  chapters: [
    {
      // hackfix: this generates too many samples
      name: 'weighted-random',
      ignore: true,
      failedReason: 'too many samples'
    },
    {
      // hackfix: this generates too many samples
      name: 'polynomial-hash',
      ignore: true,
      failedReason: 'too many samples'
    },
    {
      name: 'permutations',
      ignore: true,
      failedReason: 'too large'
    },
    {
      name: 'combinations',
      ignore: true,
      failedReason: 'too large'
    }
  ],
  exercises: [
  ]
};