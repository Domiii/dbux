module.exports = {
	"extends": [
		"airbnb-base"
	],
	"env": {
		"commonjs": true,
		"es6": true
	},
	"globals": {
		"console": true,
		"globalThis": false // stage-3, not finalized yet - https://github.com/eslint/eslint/issues/11553
	},
	"parser": "babel-eslint",
	// "parserOptions": {
	// 	"ecmaVersion": "2018",
	// 	"ecmaFeatures": {
	// 		"jsx": true
	// 	},
	// 	"sourceType": "module",
	// 	"extraFileExtensions": [
	// 		".ts"
	// 	]
	// },
	"rules": {
		"no-const-assign": "warn",
		"no-this-before-super": "warn",
		"no-undef": "error",
		"no-unreachable": "warn",
		"no-unused-vars": "warn",
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
		"no-use-before-define": ["error", { "functions": false, "classes": true }],
		"no-confusing-arrow": 0,
		"constructor-super": "warn",
		"valid-typeof": "warn",
		// "class-methods-use-this": "warn",
		"class-methods-use-this": 0,
		"import/prefer-default-export": 0,
		"import/no-nodejs-modules": 0,
		"import/no-mutable-exports": 0,
		"operator-assignment": 0,
		"operator-linebreak": 0,
		"prefer-const": 0,
		"prefer-arrow-callback": 0,
		"prefer-template": 0, // string templates
		"eol-last": 0,
		"arrow-parens": 0,
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
		"linebreak-style": 0
	}
};