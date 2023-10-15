import blu from "@blu.js/blu"

import type { BluConfigurationOptions, BluDevice } from "@blu.js/blu"

/**
 * Global namespace.
 */
declare global {
	interface Window {
		blu: typeof blu
		device?: BluDevice
	}

	/**
	 * Interface for a Blu Playground example.
	 */
	interface BluPlaygroundExample {
		/**
		 * The example's ID, which is also the name of its root directory.
		 * @remarks Must be unique. Must match the name of the example's root
		 *  directory.
		 */
		readonly id: string

		/**
		 * The example's name.
		 */
		readonly name: string

		/**
		 * The example's description.
		 */
		readonly description: string

		/**
		 * The Blu configuration that this example should use.
		 */
		readonly bluConfig: BluConfigurationOptions

		/**
		 * The project's onLoad function.
		 * @remarks Invoked when the example is selected in the playground.
		 */
		readonly onLoad: () => void
	}
}
