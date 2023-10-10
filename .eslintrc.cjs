module.exports = {
	root: true,
	env: {
		browser: true,
		es2023: true,
	},
	extends: [
		"plugin:@typescript-eslint/recommended-type-checked",
		"plugin:@typescript-eslint/stylistic-type-checked",
		"prettier",
	],
	overrides: [{ files: ["*.ts", "*.tsx"] }],
	ignorePatterns: ["*.js", "*.jsx"],
	parser: "@typescript-eslint/parser",
	parserOptions: {
		ecmaVersion: "es2023",
		project: true,
		tsConfigRootDir: __dirname,
	},
	plugins: ["@typescript-eslint", "eslint-plugin-tsdoc"],
	rules: {
		"@typescript-eslint/no-empty-interface": ["off"],
		"@typescript-eslint/no-unused-vars": [
			"warn",
			{ argsIgnorePattern: "^_", varsIgnorePattern: "^[A-Z]" },
		],
		"tsdoc/syntax": "warn",
	},
}
