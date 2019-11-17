

module.exports = {
  "env": {
    "browser": true,
    "commonjs": true,
    "es6": true
  },
  "globals": {
    "$": true,
    "console": true,
    "mixpanel": true
  },
  "extends": "eslint:recommended",
  "parserOptions": {
    "ecmaVersion": 2019,
    "sourceType": "module"
  },
  "parser": "babel-eslint",
  "rules": {
    "no-console": 0,
    "no-debugger": 0,
    "no-extra-boolean-cast": 0,
    "no-unused-vars": "off",
    "no-restricted-globals": "off",
    "default-case": "off",
    "no-mixed-operators": "off"
    // "no-use-before-define": "error"
  },
  overrides: [
    Object.assign(
      {
        files: ['**/*.test.js'],
        env: { jest: true },
        plugins: ['jest'],
      },
      require('eslint-plugin-jest').configs.recommended
    )
  ]
}