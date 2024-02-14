import configuration from "./configuration"
import { BluEventEmitter, BluEvents } from "./eventEmitter"

import type BluDevice from "./device"

/**
 * Bluetooth state handler.
 * @sealed
 * @public
 */
export class BluBluetoothState extends BluEventEmitter<BluBluetoothStateEvents> {
	/**
	 * Collection of connected devices.
	 */
	readonly #connectedDevices = new Set<BluDevice>()

	/**
	 * Construct a Bluetooth state handler.
	 */
	constructor() {
		super()

		if (this.isSupported()) {
			configuration.bluetoothInterface.addEventListener(
				"availabilitychanged",
				event => {
					if ((event as AvailabilityChangedEvent).value) {
						this.emit("bluetooth-enabled")
					} else {
						this.emit("bluetooth-disabled")
					}
				},
			)

			this.on("bluetooth-disabled", () => {
				this.#connectedDevices.clear()
			})

			this.on("device-connected", device => {
				this.#connectedDevices.add(device)
			})

			this.on("device-disconnected", device => {
				this.#connectedDevices.delete(device)
			})

			this.on("device-connection-lost", device => {
				this.#connectedDevices.delete(device)
			})
		}
	}

	/**
	 * All connected devices.
	 * @readonly
	 */
	get connectedDevices() {
		return Array.from(this.#connectedDevices)
	}

	/**
	 * The primary, i.e. first connected, device. `null` if there is no device
	 * connected.
	 * @readonly
	 */
	get connectedDevice() {
		return this.connectedDevices[this.connectedDevices.length - 1] ?? null
	}

	/**
	 * Is Bluetooth supported?
	 */
	isSupported() {
		return !!configuration.bluetoothInterface
	}

	/**
	 * Is Bluetooth available?
	 * @returns A `Promise` that resolves with the availability.
	 */
	async isAvailable() {
		if (this.isSupported()) {
			return await configuration.bluetoothInterface.getAvailability()
		} else {
			return false
		}
	}
}

/**
 * Bluetooth state events.
 * @sealed
 * @public
 */
export interface BluBluetoothStateEvents extends BluEvents {
	/**
	 * Bluetooth has been enabled.
	 * @eventProperty
	 */
	"bluetooth-enabled": () => void

	/**
	 * Bluetooth has been disabled.
	 * @eventProperty
	 */
	"bluetooth-disabled": () => void

	/**
	 * A Bluetooth device has been connected.
	 * @param device - The device.
	 * @eventProperty
	 */
	"device-connected": (device: BluDevice) => void

	/**
	 * A Bluetooth device has been disconnected.
	 * @remarks You must reconnect the device if you want to use it again.
	 * @param device - The device.
	 * @eventProperty
	 */
	"device-disconnected": (device: BluDevice) => void

	/**
	 * The connection to a Bluetooth device has been lost.
	 * @remarks You must reconnect the device if you want to use it again.
	 * @param device - The device.
	 * @eventProperty
	 */
	"device-connection-lost": (device: BluDevice) => void
}

interface AvailabilityChangedEvent extends Event {
	readonly value: boolean
}

/**
 * Blu's global Bluetooth state handler.
 * @public
 */
const bluetooth = new BluBluetoothState()
export default bluetooth
