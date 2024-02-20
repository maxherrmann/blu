import type { BluBluetoothLEScan } from "./bluetoothInterface"
import bluetooth from "./bluetoothState"
import type { BluConfigurationOptions } from "./configuration"
import configuration from "./configuration"
import BluDevice from "./device"
import BluDeviceAdvertisement from "./deviceAdvertisement"
import {
	BluEnvironmentError,
	BluScannerError,
	BluScannerOperationError,
} from "./errors"
import type { BluEventTarget } from "./eventTarget"

/**
 * Scanner for Bluetooth devices.
 */
export class BluScanner extends (EventTarget as BluScannerEventTarget) {
	/**
	 * An ongoing advertisement scan.
	 */
	#advertisementScan?: BluBluetoothLEScan

	/**
	 * Get a Bluetooth device.
	 * @remarks Displays the browser's device chooser to the user, instructing
	 *  them to pair a device. Filters advertising devices according to the
	 *  {@link BluConfigurationOptions.deviceScannerConfig | `deviceScannerConfig`}
	 *  from the active {@link configuration}.
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
			if (!bluetooth.isSupported()) {
				throw new BluEnvironmentError("Web Bluetooth")
			}

			const scannerConfig = configuration.options.deviceScannerConfig

			scannerConfig.optionalServices =
				configuration.options.deviceType.interface
					.filter(
						serviceDescription => !serviceDescription.advertised,
					)
					.map(serviceDescription => serviceDescription.uuid)

			const webBluetoothDevice =
				await configuration.bluetoothInterface.requestDevice(
					scannerConfig,
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
			if (!bluetooth.isSupported()) {
				throw new BluEnvironmentError("Web Bluetooth")
			}

			if (
				typeof configuration.bluetoothInterface.getDevices !==
				"function"
			) {
				throw new BluEnvironmentError("Paired device retrieval")
			}

			const devices = await configuration.bluetoothInterface.getDevices()

			return devices.map(device => {
				return new BluDevice(device)
			})
		} catch (error) {
			throw new BluScannerError("Could not get paired devices.", error)
		}
	}

	/**
	 * ⚠️ Start scanning for advertisements.
	 * @remarks Experimental feature. Only supported by some environments. See
	 *  the
	 *  {@link https://github.com/WebBluetoothCG/web-bluetooth/blob/main/implementation-status.md | Web Bluetooth CG's implementation status}
	 *  of `Advertisements Scanning` for details. Opens a prompt that asks the
	 *  user for permission to scan for devices. Once the permission has been
	 *  granted, {@link BluScannerEvents.advertisement | `advertisement`}
	 *  events will be emitted.
	 * @throws A {@link BluScannerError} when something went wrong.
	 */
	async startScanningForAdvertisements() {
		try {
			if (!bluetooth.isSupported()) {
				throw new BluEnvironmentError("Web Bluetooth")
			}

			if (
				typeof configuration.bluetoothInterface.requestLEScan !==
				"function"
			) {
				throw new BluEnvironmentError("Advertisement scanning")
			}

			navigator.bluetooth.onadvertisementreceived = (
				event: BluetoothAdvertisingEvent,
			) => {
				this.dispatchEvent(
					new BluScannerAdvertisementEvent(
						new BluDeviceAdvertisement(event),
					),
				)
			}

			this.#advertisementScan =
				await configuration.bluetoothInterface.requestLEScan(
					configuration.options.advertisementScannerConfig,
				)
		} catch (error) {
			throw new BluScannerError(
				"Could not start scanning for advertisements.",
				error,
			)
		}
	}

	/**
	 * ⚠️ Stop scanning for advertisements.
	 * @remarks Experimental feature. Only supported by some environments. See
	 *  the
	 *  {@link https://github.com/WebBluetoothCG/web-bluetooth/blob/main/implementation-status.md | Web Bluetooth CG's implementation status}
	 *  of `Advertisements Scanning` for details.
	 * @throws A {@link BluScannerOperationError} when the scanner is not
	 *  scanning for advertisements.
	 */
	stopScanningForAdvertisements() {
		if (!this.#advertisementScan) {
			throw new BluScannerOperationError(
				"Cannot stop scanning for advertisements when not scanning.",
			)
		}

		this.#advertisementScan.stop()
	}
}

/**
 * Scanner advertisement event.
 */
export class BluScannerAdvertisementEvent extends Event {
	/**
	 * The advertisement.
	 */
	readonly advertisement: BluDeviceAdvertisement

	/**
	 * Construct a device advertised event.
	 * @param advertisement - The advertisement.
	 */
	constructor(advertisement: BluDeviceAdvertisement) {
		super("advertisement")

		this.advertisement = advertisement
	}
}

/**
 * Scanner event target.
 */
type BluScannerEventTarget = BluEventTarget<{
	/**
	 * ⚠️ An advertisement has been received.
	 * @remarks Experimental feature. Only supported by some environments. See
	 *  the
	 *  {@link https://github.com/WebBluetoothCG/web-bluetooth/blob/main/implementation-status.md | Web Bluetooth CG's implementation status}
	 *  of `Advertisements Scanning` for details.
	 */
	advertisement: BluScannerAdvertisementEvent
}>

/**
 * Blu's global Bluetooth device scanner.
 * @remarks Handles everything related to Bluetooth device scanning.
 */
const scanner = new BluScanner()
export default scanner
