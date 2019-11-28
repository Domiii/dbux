const path = require('path');

const root = path.join(__dirname, '../..');

module.exports = outFile => ({
  contentBase: [
    path.join(root, 'www'),
    path.join(root, 'src/dbux')
    // path.join(root, 'dist')
  ],
  host: '0.0.0.0',
  hot: true,
  port: 3000,
  writeToDisk: true,
  // publicPath: outputFolder,
  // filename: outFile,
  historyApiFallback: {
    verbose: true,
    rewrites: [
      { from: /^\/dist\/bundle\.js$/, to: '/bundle.js' },
      { from: /^test1.js$/, to: '/samples/test1.js' },
      // { from: /^\/tags[/?#].*$/, to: '/tags.html' },
      // {
      // https://github.com/bripkens/connect-history-api-fallback#rewrites
      // from: /^\/somethingElse\/.*$/, 
      // to: function (context) {
      //   return `${context.parsedUrl.pathname.toLowerCase()}.html`;
      // }
      // }
    ]
  }
});