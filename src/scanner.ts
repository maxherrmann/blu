import EventTarget, { type EventMap } from "jaset"
import type {
	BluBluetooth,
	BluBluetoothAdvertisingEvent,
	BluBluetoothLEScan,
} from "./bluetooth-interface.js"
import bluetooth from "./bluetooth-state.js"
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import type { BluConfigurationOptions } from "./configuration.js"
import configuration from "./configuration.js"
import BluDeviceAdvertisement from "./device-advertisement.js"
import BluDevice from "./device.js"
import {
	BluDeviceConstructionError,
	BluEnvironmentError,
	BluError,
	BluScannerError,
	BluScannerOperationError,
} from "./errors.js"

/**
 * Scanner for Bluetooth devices.
 */
export class BluScanner extends EventTarget<BluScannerEvents> {
	/**
	 * An ongoing advertisement scan.
	 */
	#advertisementScan?: BluBluetoothLEScan

	/**
	 * The Bluetooth interface that the ongoing advertisement scan's event
	 * listener is attached to.
	 */
	#advertisementScanInterface?: BluBluetooth

	/**
	 * Event handler that is invoked whenever an advertisement has been received.
	 */
	readonly #onAdvertisementReceived = (event: Event) => {
		this.emit(
			new BluScannerAdvertisementEvent(
				new BluDeviceAdvertisement(
					event as BluBluetoothAdvertisingEvent,
				),
			),
		)
	}

	/**
	 * Get a Bluetooth device.
	 * @remarks Displays the browser's device chooser to the user, instructing
	 *  them to pair a device. Filters advertising devices according to the
	 *  active {@link BluConfigurationOptions.deviceScannerConfiguration}.
	 * @typeParam DeviceType - The type of the returned device. Defaults to
	 *  {@link BluDevice}.
	 * @returns A `Promise` that resolves to the selected
	 *  {@link BluDevice | device}. The type of the device is determined through
	 *  the active {@link BluConfigurationOptions.devices} configuration.
	 * @throws A {@link BluEnvironmentError} when the environment does not
	 *  support the operation.
	 * @throws A {@link BluDeviceConstructionError} when the device was selected
	 *  but an error occurred during the construction of the corresponding
	 *  {@link BluDevice}.
	 * @throws A {@link BluScannerError} when something went wrong.
	 */
	async getDevice<DeviceType extends BluDevice = BluDevice>() {
		try {
			if (!bluetooth.isSupported()) {
				throw new BluEnvironmentError("Web Bluetooth")
			}

			const optionalServices = configuration.options.devices
				.map((device) => device.type.interface)
				.flat()
				.filter((serviceDescription) => !serviceDescription.advertised)
				.map((serviceDescription) => serviceDescription.uuid)
				.filter((uuid, index, self) => self.indexOf(uuid) === index)

			const requestDeviceOptions: RequestDeviceOptions = {
				...configuration.options.deviceScannerConfiguration,
				optionalServices,
			}

			const genericDevice =
				await configuration.bluetoothInterface.requestDevice(
					requestDeviceOptions,
				)

			for (const device of configuration.options.devices) {
				if (device.validator(genericDevice)) {
					return new device.type(genericDevice) as DeviceType
				}
			}

			throw new BluDeviceConstructionError(
				new BluDevice(genericDevice),
				"Could not find a matching device type for the selected device.",
			)
		} catch (error) {
			if (error instanceof BluError) {
				throw error
			}

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
	 * @typeParam DeviceType - The type of the returned devices. Defaults to
	 *  {@link BluDevice}.
	 * @returns A `Promise` that resolves to the paired
	 *  {@link BluDevice | devices}.
	 * @throws A {@link BluEnvironmentError} when the environment does not
	 *  support the operation.
	 * @throws A {@link BluScannerError} when something went wrong.
	 */
	async getPairedDevices<DeviceType extends BluDevice = BluDevice>(): Promise<
		DeviceType[]
	> {
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

			const genericDevices =
				await configuration.bluetoothInterface.getDevices()

			const devices: DeviceType[] = []

			for (const genericDevice of genericDevices) {
				for (const device of configuration.options.devices) {
					if (device.validator(genericDevice)) {
						devices.push(
							new device.type(genericDevice) as DeviceType,
						)
						break
					}
				}
			}

			return devices
		} catch (error) {
			if (error instanceof BluError) {
				throw error
			}

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
	 * @throws A {@link BluEnvironmentError} when the environment does not
	 *  support the operation.
	 * @throws A {@link BluScannerOperationError} when the scanner is already
	 *  scanning for advertisements.
	 * @throws A {@link BluScannerError} when something went wrong.
	 */
	async startScanningForAdvertisements() {
		try {
			if (this.#advertisementScan) {
				throw new BluScannerOperationError(
					"Already scanning for advertisements.",
				)
			}

			if (!bluetooth.isSupported()) {
				throw new BluEnvironmentError("Web Bluetooth")
			}

			const bluetoothInterface = configuration.bluetoothInterface

			if (typeof bluetoothInterface.requestLEScan !== "function") {
				throw new BluEnvironmentError("Advertisement scanning")
			}

			bluetoothInterface.addEventListener(
				"advertisementreceived",
				this.#onAdvertisementReceived,
			)

			this.#advertisementScanInterface = bluetoothInterface
			this.#advertisementScan = await bluetoothInterface.requestLEScan(
				configuration.options.advertisementScannerConfiguration,
			)
		} catch (error) {
			if (error instanceof BluError) {
				throw error
			}

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

		this.#advertisementScanInterface?.removeEventListener(
			"advertisementreceived",
			this.#onAdvertisementReceived,
		)

		this.#advertisementScan.stop()
		this.#advertisementScan = undefined
		this.#advertisementScanInterface = undefined
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
 * Scanner event map.
 */
type BluScannerEvents = EventMap<{
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
