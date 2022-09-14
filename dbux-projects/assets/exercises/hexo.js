const configs = [
  {
    // → not a challenge to find the bug (?)
    // → runs too many tests, resulting in a ginormous, messy ACG
    // https://github.com/BugsJS/hexo/releases/tag/Bug-1-test
    // https://github.com/BugsJS/hexo/commit/257794e187864a18cefec5f83e03f1cf2d48331e
    id: 1,
    testRe: '',
    testFilePaths: ['test/scripts/console/generate.js']
  },
  // {
  //   // not a challenge to find the bug, multiple lines, change in dependency, very much about domain knowledge
  //   // https://github.com/BugsJS/hexo/commit/efa4aa39b437f708d4238903bf928dcbca3373ff
  //   id: 2,
  //   testRe: 'read.*() - escape BOM',
  //   testFilePaths: ['test/scripts/box/file.js']
  // }
  // {
  //   // not a challenge to find the bug
  //   id: 3,
  //   testRe: 'is_home',
  //   testFilePaths: ['test/scripts/helpers/is.js']
  // }

  {
    // → probably a good bug candidate
    id: 4,
    testRe: 'asset_img.*with space',
    testFilePaths: ['test/scripts/tags/asset_img.js'],
    bugLocations: [
      {
        file: 'lib/models/post_asset.js',
        line: 21
      }
    ]
  },
  // 5: stale.yml (not js)
  // 6: url_for helper: Don't prepend root if url is started with #
  // 7: version in `package.json` (not js)
  // 8: appveyor: add node.js 7 testing environment (not js)

  {
    /**
     * @see https://github.com/BugsJS/hexo/commit/34f34ab2acba87776c78be5af9b27a8b3da3d435
     */
    id: 9,
    testRe: 'context|current = 0',
    testFilePaths: ['test/scripts/helpers/paginator.js']
  },
  {
    /**
     * @see https://github.com/BugsJS/hexo/commit/d08b4694de636432b0a992f32b3a5c2548c662e2
     */
    id: 10,
    testRe: '_generate() - return nothing in generator',
    testFilePaths: ['test/scripts/hexo/hexo.js']
  },
  {
    /**
     * @see https://github.com/BugsJS/hexo/commit/0348931634d60a074597d5482c5ffae8a8f9cae6
     */
    id: 11,
    testRe: 'constructs mutli-config',
    testFilePaths: ['test/scripts/hexo/hexo.js']
  },
  {
    /**
     * @see https://github.com/BugsJS/hexo/commit/59a6920df0233584505e44cd43be2cc788b8f2b2
     */
    id: 12,
    testRe: 'non-string title',
    testFilePaths: ['test/scripts/hexo/post.js']
  }
];

module.exports = configs;