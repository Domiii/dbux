module.exports = {
  ignorePatterns: [
    '**/dist/*',
    'dbux_projects/**/*'
  ],
  extends: [
    "airbnb-base"
  ],
  env: {
    commonjs: true,
    es6: true,
    jest: true
  },
  globals: {
    console: true,
    /**
     * stage-3
     * not finalized yet - https://github.com/eslint/eslint/issues/11553
     */
    globalThis: false,
    BigInt: true,

    /**
     * @see https://webpack.js.org/api/module-variables/#__non_webpack_require__-webpack-specific
     */
    __non_webpack_require__: true
  },

  parser: "@babel/eslint-parser",

  parserOptions: {
    /**
     * Make sure, eslint works, even without babel config?
     * @see https://github.com/babel/babel/issues/11975#issuecomment-798832457
     */
    requireConfigFile: false,
    // babelOptions: {
    //   configFile: './babel.config.js'
    // }
  },
  //   ecmaVersion: "2018",
  //   ecmaFeatures: {
  //     jsx: true
  //   },
  //   sourceType: "module",
  //   extraFileExtensions: [
  //     ".ts"
  //   ]
  // },
  rules: {
    "no-const-assign": "warn",
    "no-this-before-super": "warn",
    "no-undef": "error",
    "no-unreachable": "warn",
    "no-unused-vars": ["warn", { varsIgnorePattern: "e|evt|err", args: 'after-used' }],
    "no-else-return": 0,
    "no-debugger": 0,
    "no-console": "error",
    "no-invalid-this": 0,
    "no-useless-constructor": 0,
    "no-underscore-dangle": 0,
    "no-restricted-syntax": 0,
    "no-trailing-spaces": 0,
    "no-multi-spaces": ["error", { ignoreEOLComments: true }],
    "no-continue": 0,
    "no-plusplus": 0,
    "no-unused-expressions": 0,
    "no-return-assign": 0,
    "no-param-reassign": 0,
    "no-empty-function": 0,
    "no-multi-assign": 0,
    "no-mixed-operators": 0,
    "no-use-before-define": ["error", { functions: false, classes: true }],
    "no-confusing-arrow": 0,
    "no-cond-assign": ["error", "except-parens"],
    "no-await-in-loop": 0,
    "no-bitwise": 0,
    "no-multiple-empty-lines": 0,
    "no-path-concat": 0,
    "no-return-await": 0,
    "no-lonely-if": 0,
    quotes: 0,
    camelcase: ["warn", { ignoreGlobals: true }],
    "constructor-super": "warn",
    "valid-typeof": "warn",
    // "class-methods-use-this": "warn",
    "class-methods-use-this": 0,
    "import/prefer-default-export": 0,
    "import/no-nodejs-modules": 0,
    "import/no-mutable-exports": "warn",
    "import/order": "warn",
    "operator-assignment": 0,
    "operator-linebreak": 0,
    "prefer-const": 0,
    "prefer-arrow-callback": 0,
    "prefer-template": 0, // string templates
    "prefer-spread": 0,
    "eol-last": 0,
    "arrow-parens": 0,
    "arrow-body-style": 0,
    "lines-between-class-members": 0,
    "comma-dangle": 0,
    "object-curly-newline": 0,
    "brace-style": 0,
    "max-classes-per-file": 0,
    "guard-for-in": 0,
    "func-names": 0,
    "wrap-iife": ["warn", "inside"],
    "implicit-arrow-linebreak": 0,
    "function-paren-newline": 0,
    "linebreak-style": 0,
    "spaced-comment": 0,
    "max-len": ["warn", { code: 180, ignoreComments: true }],
    "one-var": 0,
    "one-var-declaration-per-line": 0,
    "dot-location": 0,
    "default-case": 0,
    "object-shorthand": 0,
    "generator-star-spacing": 0,
    "no-nested-ternary": 0
  },

  settings: {
    'import/resolver': {
      node: {}, // placed above other resolver configs
      // webpack: {}
    }
  },

  overrides: [
    {
      files: [
        '**/src/testing/*.js',
        './*.js',
        './scripts/**/*.js',
        './config/**/*.js'
      ],
      rules: {
        "import/no-extraneous-dependencies": ["error", { devDependencies: true }],
        "no-console": 0
      },
      env: {
        node: true
      }
    },
    // {
    //   files: [
    //     'dbux_projects/**/*'
    //   ],
    //   rules: {
    //     "import/no-extraneous-dependencies": ["error", { devDependencies: true }],
    //     "no-console": 0
    //   },
    //   env: {
    //     node: true
    //   }
    // }
  ]
};