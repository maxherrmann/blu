import bluetooth from "./bluetooth"
import configuration from "./configuration"
import BluDevice from "./device"
import { BluEnvironmentError, BluScannerError } from "./errors"

import type { BluConfigurationOptions } from "./configuration"

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
	 *  active {@link configuration}.
	 * @throws A {@link BluScannerError} when something went wrong.
	 */
	async getDevice<DeviceType extends BluDevice = BluDevice>() {
		try {
			if (!bluetooth.isSupported) {
				throw new BluEnvironmentError("Web Bluetooth")
			}

			const webBluetoothDevice =
				await globalThis.navigator.bluetooth.requestDevice(
					configuration.options.scannerConfig,
				)

			return new configuration.options.deviceType(
				webBluetoothDevice,
			) as DeviceType
		} catch (error) {
			throw new BluScannerError("Could not get device.", error)
		}
	}

	/**
	 * ⚠️ Get all paired Bluetooth devices.
	 * @remarks Experimental feature. Only supported by some environments. See
	 *  the
	 *  {@link https://github.com/WebBluetoothCG/web-bluetooth/blob/main/implementation-status.md | Web Bluetooth CG's implementation status}
	 *  of `getDevices()` for details. Paired devices are devices that the user
	 *  has granted access to. They include devices that are not available at
	 *  the moment, due to being out of range or switched off.
	 * @returns A `Promise` that resolves with the paired
	 *  {@link BluDevice | devices}.
	 * @throws A {@link BluScannerError} when something went wrong.
	 */
	async getPairedDevices() {
		try {
			if (!bluetooth.isSupported) {
				throw new BluEnvironmentError("Web Bluetooth")
			}

			if (
				typeof globalThis.navigator.bluetooth.getDevices !== "function"
			) {
				throw new BluEnvironmentError("Paired device retrieval")
			}

			const devices = await globalThis.navigator.bluetooth.getDevices()

			return devices.map(device => {
				return new BluDevice(device)
			})
		} catch (error) {
			throw new BluScannerError("Could not get paired devices.", error)
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
