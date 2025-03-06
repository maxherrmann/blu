import esBuild from "esbuild"

const buildDate = new Date()

await esBuild.build({
	banner: {
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
	bundle: true,
	entryPoints: ["src/index.ts"],
	external: ["zod", "jaset"],
	format: "esm",
	keepNames: true,
	minify: true,
	outfile: "dist/index.js",
	sourcemap: true,
	target: "es2019",
	treeShaking: true,
})
