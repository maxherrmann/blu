import CssMinimizerPlugin from "css-minimizer-webpack-plugin"
import HtmlBundlerPlugin from "html-bundler-webpack-plugin"
import { createRequire } from "node:module"
import path from "path"
import TerserPlugin from "terser-webpack-plugin"

const require = createRequire(import.meta.url)
const packageJson = require("./package.json")
const buildDate = new Date()
const additionalResources = /\.(hex)$/i

export default (_env, argv) => {
	return {
		mode: argv.mode,
		devtool:
			argv.mode === "production"
				? "source-map"
				: "eval-cheap-module-source-map",
		stats: "minimal",
		performance: {
			hints: false,
		},
		cache: true,
		entry:
			argv.name === "package"
				? {
						package: {
							import: "./src/index.ts",
							filename: "blu.min.js",
						},
					}
				: undefined,
		module: {
			rules: [
				{
					test: /\.tsx?$/i,
					use: ["ts-loader"],
					exclude: /node_modules/,
				},
				{
					test: /\.css$/i,
					use: ["css-loader"],
				},
				{
					test: /\.png$/i,
					type: "asset",
				},
				{
					test: additionalResources,
					type: "asset/resource",
					generator: {
						filename: "assets/other/[name][ext]",
					},
				},
			],
		},
		resolve: {
			alias: {
				"@blu.js/blu$": path.join(process.cwd(), "./src/index.ts"),
			},
			extensions: [".ts", ".tsx", ".js", ".jsx"],
		},
		output: {
			path: path.join(process.cwd(), "dist"),
			chunkFilename: "assets/js/[name].js",
			module: true,
			library: {
				type: "module",
			},
			clean: true,
		},
		experiments: {
			outputModule: true,
		},
		optimization: {
			minimize: argv.mode === "production",
			minimizer: [
				new TerserPlugin({
					parallel: true,
					extractComments: false,
					terserOptions: {
						module: true,
						keep_classnames: true,
						format: {
							preamble:
								`/**\n` +
								` * Blu ${packageJson.version} |` +
								` ${buildDate.toUTCString()}\n` +
								` * Copyright (c) ${buildDate.getFullYear()} Max Herrmann\n` +
								` * https://github.com/maxherrmann/blu/blob/main/LICENSE\n` +
								` */`,
						},
					},
				}),
				new CssMinimizerPlugin(),
			],
		},
		plugins: [
			argv.name === "package"
				? false
				: new HtmlBundlerPlugin({
						minify: "auto",
						entry: "./src/playground/",
						js: {
							filename: "assets/js/[name].js",
						},
						css: {
							filename: "assets/css/[name].css",
						},
						loaderOptions: {
							sources: [
								{
									tag: "a",
									attributes: ["href"],
									filter: ({ value }) => {
										return (
											value.match(additionalResources) !==
											null
										)
									},
								},
							],
							preprocessor: false,
						},
						watchFiles: {
							paths: ["./src"],
						},
					}),
		],
	}
}
