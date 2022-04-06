module.exports = {
  module: {
    rules: [
      {
        loader: 'babel-loader',
        test: /\.js/,
        include() { return true; }
      }
    ]
  }
};