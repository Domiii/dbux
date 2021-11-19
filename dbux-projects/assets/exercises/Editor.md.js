// git diff --color=never --ignore-cr-at-eol > ../../dbux-projects/assets/_patches_/Editor.md/baseline.patch | unix2dos
const config = [
  {
    label: 'full',
    // patch: 'patch1',
    description: 'Basic example of Editor.md',
    runArgs: [],
    /**
     * future-work: use `html-loader` to automatically transform the html file instead
     * @see https://webpack.js.org/loaders/html-loader/
     */
    websitePath: 'dbux-examples/full.html',
    // websitePath: 'examples/full.html'
    // bugLocations: [
    //   {
    //     file: 'src/controller.js',
    //     line: 65
    //   }
    // ]
  },
  {
    label: 'full-onload',
    patch: 'onload',
    description: 'Basic example of Editor.md (with loadCSS + loadScript ACG nodes connected)',
    runArgs: [],
    /**
     * future-work: use `html-loader` to automatically transform the html file instead
     * @see https://webpack.js.org/loaders/html-loader/
     */
    websitePath: 'dbux-examples/full.html',
    // websitePath: 'examples/full.html'
    // bugLocations: [
    //   {
    //     file: 'src/controller.js',
    //     line: 65
    //   }
    // ]
  }
];

module.exports = config;