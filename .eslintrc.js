module.exports = {
	"env": {
		"browser": true,
		"commonjs": true,
		"es6": true,
		"node": true
	},
	"globals": {
		"console": true
	},
	"parserOptions": {
		"ecmaFeatures": {
			"jsx": true
		},
		"sourceType": "module"
	},
	"rules": {
		"no-const-assign": "warn",
		"no-this-before-super": "warn",
		"no-undef": "warn",
		"no-unreachable": "warn",
		"no-unused-vars": "warn",
		"constructor-super": "warn",
		"valid-typeof": "warn",
		"no-empty-function": 0,
		"class-methods-use-this": "warn",
		"import/prefer-default-export": 0,
		"import/no-nodejs-modules": 0,
		"prefer-arrow-callback": 0,
		"no-else-return": 0,
		"no-debugger": 0,
		"operator-assignment": 0
	}
};