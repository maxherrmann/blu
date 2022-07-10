const TerserPlugin = require("terser-webpack-plugin")

const buildVersion = require("./src/version.js")
const buildDate = new Date()

const esmConfig = {
	mode: "production",
	entry: {
		dist: { import: "./blu.esm.js", filename: "blu.esm.min.js" }
	},
	output: {
		module: true,
		library: {
			type: "module"
		}
	},
	devtool: "source-map",
	optimization: {
		minimizer: [
			new TerserPlugin({
				parallel: true,
				terserOptions: {
					module: true,
					keep_classnames: true,
					format: {
						preamble: getPreamble("ESM Minified")
					}
				}
			})
		]
	},
	experiments: {
		outputModule: true
	}
}

const umdConfig = {
	mode: "production",
	entry: {
		dist: { import: "./blu.umd.js", filename: "blu.umd.min.js" }
	},
	output: {
		library: {
			name: "blu",
			type: "umd"
		},
		globalObject: "this"
	},
	devtool: "source-map",
	optimization: {
		minimizer: [
			new TerserPlugin({
				parallel: true,
				terserOptions: {
					keep_classnames: true,
					format: {
						preamble: getPreamble("UMD Minified")
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

module.exports = [
	esmConfig,
	umdConfig
]