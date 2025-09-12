import esLint from "@eslint/js"
import prettierEsLintConfig from "eslint-config-prettier"
import { defineConfig } from "eslint/config"
import tsEsLint from "typescript-eslint"

export default defineConfig(
	{
		ignores: ["*.js", "**/build/", "**/dist/"],
	},
	esLint.configs.recommended,
	tsEsLint.configs.strictTypeChecked,
	prettierEsLintConfig,
	{
		languageOptions: {
			parserOptions: {
				projectService: true,
				warnOnUnsupportedTypeScriptVersion: false,
				tsconfigRootDir: import.meta.dirname,
			},
		},
	},
)
