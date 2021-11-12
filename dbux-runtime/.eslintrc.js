const path = require('path');

module.exports = {
  rules: {
    "import/no-extraneous-dependencies": ["error", { devDependencies: true }]
  },
  extends: [path.join(__dirname, '../config/.eslintrc.package.js')]
};