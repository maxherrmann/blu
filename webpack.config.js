import TerserPlugin from "terser-webpack-plugin"

import { version as buildVersion } from "./src/version.js"
const buildDate = new Date()

const esMinConfig = {
	mode: "production",
	entry: {
		dist: { import: "./index.js", filename: "blu.min.js" }
	},
	output: {
		module: true,
		library: {
			type: "module"
		}
	},
	devtool: "source-map",
	experiments: {
		outputModule: true
	},
	optimization: {
		minimizer: [
			new TerserPlugin({
				parallel: true,
				terserOptions: {
					module: true,
					keep_classnames: true,
					format: {
						preamble: getPreamble("Minified ECMAScript Module")
					}
				}
			})
		]
	}
}

const cjsMinConfig = {
	mode: "production",
	entry: {
		dist: { import: "./index.js", filename: "blu.min.cjs" }
	},
	output: {
		library: {
			type: "commonjs2",
			export: "default"
		}
	},
	devtool: "source-map",
	optimization: {
		minimizer: [
			new TerserPlugin({
				parallel: true,
				terserOptions: {
					keep_classnames: true,
					format: {
						preamble: getPreamble("Minified CommonJS Module")
					}
				}
			})
		]
	}
}

function getPreamble(exportType) {
	return `/**\n` +
	` * Blu ${buildVersion} (${exportType}) | ${buildDate.toUTCString()}\n` +
	` * Copyright (c) ${buildDate.getFullYear()} Max Herrmann\n` +
	` * https://github.com/maxherrmann/blu/blob/main/LICENSE\n` +
	` */`
}

export default [
	esMinConfig,
	cjsMinConfig
]