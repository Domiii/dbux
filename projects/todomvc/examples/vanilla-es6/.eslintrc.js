module.exports = {
  "env": {
    "browser": true,
    "commonjs": true,
    "es6": true,
    // "jest/globals": true
  },
  "globals": {
    "$": true,
    "console": true,
    "mixpanel": true
  },
  "extends": ["eslint:recommended", "plugin:jest/all"],
  "parserOptions": {
    "ecmaVersion": 2019,
    "sourceType": "module"
  },
  // "plugins": ['jest'],
  "parser": "babel-eslint",
  "rules": {
    "no-console": 0,
    "no-debugger": 0,
    "no-extra-boolean-cast": 0,
    "no-unused-vars": "off",
    "no-restricted-globals": "off",
    "default-case": "off",
    "no-mixed-operators": "off",
    // "no-use-before-define": "error",

    // jest
    "jest/prefer-expect-assertions": 0,
    "jest/lowercase-name": 0,
    "jest/expect-expect": 0
  },
  // overrides: [

  //   // see: https://stackoverflow.com/questions/31629389/how-to-use-eslint-with-jest
  //   Object.assign(
  //     {
  //       files: ['**/*.test.js'],
  //       env: { jest: true },
  //       plugins: ['jest'],
  //     },
  //     require('eslint-plugin-jest').configs.recommended
  //   )
  // ]
}