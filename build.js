import esbuild from "esbuild"

const buildDate = new Date()

await esbuild.build({
	bundle: true,
	entryPoints: ["src/index.ts"],
	external: ["zod"],
	format: "esm",
	keepNames: true,
	minifySyntax: true,
	minifyWhitespace: true,
	outfile: "dist/index.js",
	sourcemap: true,
	target: "es2020",
	treeShaking: true,
	banner: {
		js:
			`/**\n` +
			` * @blu.js/blu ` +
			`${process.env.npm_package_version}\n` +
			` * Copyright (c) ${buildDate.getFullYear()} ` +
			`Max Herrmann\n` +
			` * https://github.com/maxherrmann/blu/blob/main/LICENSE\n` +
			` * (Built on ${buildDate.toUTCString()})\n` +
			` */`,
	},
})
