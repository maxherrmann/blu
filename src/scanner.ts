import bluetooth from "./bluetooth"
import configuration from "./configuration"
import { BluError, BluScannerError } from "./errors"

import type { BluConfigurationOptions } from "./configuration"
import type BluDevice from "./device"

/**
 * Scanner for Bluetooth devices.
 * @sealed
 * @public
 */
export class BluScanner {
	/**
	 * Get a Bluetooth device.
	 * @remarks Displays the browser's device chooser to the user, instructing
	 *  them to pair a device. Filters advertising devices according to the
	 *  {@link BluConfigurationOptions.scannerConfig | `scannerConfig`} from the
	 *  active {@link configuration}.
	 * @returns A `Promise` that resolves with the selected
	 *  {@link BluDevice | device} of
	 *  the {@link BluConfigurationOptions.deviceType | `deviceType`} from the
	 *  active {@link configuration}. `null` if no device was selected or found.
	 * @throws A {@link BluScannerError} when something went wrong.
	 */
	async getDevice() {
		if (!bluetooth.isSupported) {
			throw new BluScannerError(
				"Could not get device.",
				new BluError(
					"Blu is not compatible with this browser, because it " +
						"does not support Web Bluetooth.",
				),
			)
		}

		try {
			const webBluetoothDevice =
				await globalThis.navigator.bluetooth.requestDevice(
					configuration.options.scannerConfig,
				)

			return new configuration.options.deviceType(webBluetoothDevice)
		} catch (error) {
			throw new BluScannerError("Could not get device.", error)
		}
	}
}

/**
 * Blu's global Bluetooth device scanner.
 * @remarks Handles everything related to Bluetooth device scanning.
 * @public
 */
const scanner = new BluScanner()
export default scanner
