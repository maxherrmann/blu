import { defineConfig } from "tsdown"

const buildDate = new Date()

export default defineConfig({
	attw: {
		level: "error",
		profile: "esm-only",
	},
	banner: {
		dts: `/// <reference types="web-bluetooth" />`,
		js:
			`/**\n` +
			` * Blu (blutooth) ` +
			`${process.env.npm_package_version}\n` +
			` * Copyright (c) ${buildDate.getFullYear()} ` +
			`Max Herrmann\n` +
			` * https://github.com/maxherrmann/blu/blob/main/LICENSE\n` +
			` * (Built on ${buildDate.toUTCString()})\n` +
			` */`,
	},
	clean: true,
	deps: {
		neverBundle: [/^node:/],
	},
	entry: ["./src/index.ts", "./src/index.node.ts"],
	outDir: "./dist",
	platform: "neutral",
	publint: {
		level: "error",
		strict: true,
	},
	sourcemap: true,
})
