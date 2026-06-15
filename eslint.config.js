import js from "@eslint/js"
import eslintConfigPrettier from "eslint-config-prettier/flat"
import { defineConfig } from "eslint/config"
import globals from "globals"
import tseslint from "typescript-eslint"
import { includeIgnoreFile } from "@eslint/compat"
import { fileURLToPath } from "node:url"
import tsdoc from "eslint-plugin-tsdoc"

export default defineConfig([
	includeIgnoreFile(fileURLToPath(new URL(".gitignore", import.meta.url))),
	{
		files: ["**/*.{ts,mts,cts}"],
		ignores: ["*", "!src/**/*"],
		plugins: { js, tsdoc },
		extends: ["js/recommended"],
		languageOptions: { globals: globals.browser },
		rules: {
			"tsdoc/syntax": "error",
		},
	},
	tseslint.configs.recommended,
	eslintConfigPrettier,
])
