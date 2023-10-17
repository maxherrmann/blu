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
	 * @typeParam DeviceType - The type of the returned device. Defaults to
	 *  {@link BluDevice}.
	 * @returns A `Promise` that resolves with the selected
	 *  {@link BluDevice | device} of the
	 *  {@link BluConfigurationOptions.deviceType | `deviceType`} from the
	 *  active {@link configuration}. `null` if no device was selected or found.
	 * @throws A {@link BluScannerError} when something went wrong.
	 */
	async getDevice<DeviceType extends BluDevice = BluDevice>() {
		try {
			if (!bluetooth.isSupported) {
				throw new BluError(
					"Blu is not compatible with this browser, because it " +
						"does not support Web Bluetooth.",
				)
			}

			const webBluetoothDevice =
				await globalThis.navigator.bluetooth.requestDevice(
					configuration.options.scannerConfig,
				)

			return new configuration.options.deviceType(
				webBluetoothDevice,
			) as DeviceType
		} catch (error) {
			if (error instanceof Error && error.name === "NotFoundError") {
				// Device chooser has been closed on the client side.
				return null
			}

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
