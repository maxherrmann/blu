/**
 * Blu: The type-safe framework for interacting with Bluetooth Low Energy
 * devices from the browser and Node.js.
 * @packageDocumentation
 */

/// <reference types="node" />

import { createRequire } from "node:module"
import blu, { BluError } from "./index.js"

export * from "./index.js"
export { default as default } from "./index.js"

try {
	const require = createRequire(import.meta.url)
	const { bluetooth } =
		require("webbluetooth") as typeof import("webbluetooth")
	blu.configuration.useBluetoothInterface(bluetooth)
} catch (error) {
	console.warn(
		new BluError(
			"Warning: Could not initialize the Node.js version of Blu in " +
				"the current environment. This warning can be ignored if " +
				"you are seeing it in an SSR context.",
			error,
		).message,
	)
}
