import { BluEventEmitter, BluEvents } from "./eventEmitter"

import type BluDevice from "./device"

/**
 * Bluetooth handler.
 * @sealed
 * @public
 */
export class BluBluetooth extends BluEventEmitter<BluBluetoothEvents> {
	/**
	 * Collection of connected devices.
	 */
	readonly #connectedDevices = new Set<BluDevice>()

	/**
	 * Construct a Bluetooth handler.
	 */
	constructor() {
		super()

		if (this.isSupported) {
			globalThis.navigator.bluetooth.addEventListener(
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
	 * Is Bluetooth supported?
	 * @readonly
	 */
	get isSupported() {
		return !!globalThis?.navigator?.bluetooth
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
	 * Is Bluetooth available?
	 * @returns A `Promise` that resolves with the availability.
	 */
	async isAvailable() {
		if (this.isSupported) {
			return await globalThis.navigator.bluetooth.getAvailability()
		} else {
			return false
		}
	}
}

/**
 * Bluetooth events.
 * @sealed
 * @public
 */
export interface BluBluetoothEvents extends BluEvents {
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
 * Blu's global Bluetooth handler.
 * @remarks Handles everything related to the state of Bluetooth.
 * @public
 */
const bluetooth = new BluBluetooth()
export default bluetooth
