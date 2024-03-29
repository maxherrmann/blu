import configuration from "./configuration"
import type BluDevice from "./device"
import { BluDeviceConnectionEvent } from "./device"
import type { BluEventTarget } from "./eventTarget"

/**
 * Bluetooth state handler.
 */
export class BluBluetoothState extends (EventTarget as BluBluetoothStateEventTarget) {
	/**
	 * Is the Bluetooth state handler initialized?
	 */
	#initialized = false

	/**
	 * Collection of connected devices.
	 */
	readonly #connectedDevices = new Set<BluDevice>()

	/**
	 * Construct a Bluetooth state handler.
	 */
	constructor() {
		super()

		this.initialize()
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
	 * Initialize the Bluetooth state handler.
	 */
	initialize() {
		if (this.#initialized || !this.isSupported()) {
			return
		}

		configuration.bluetoothInterface.addEventListener(
			"availabilitychanged",
			event => {
				if ((event as AvailabilityChangedEvent).value) {
					this.dispatchEvent(
						new BluBluetoothStateChangeEvent("bluetooth-enabled"),
					)
				} else {
					this.dispatchEvent(
						new BluBluetoothStateChangeEvent("bluetooth-disabled"),
					)
				}
			},
		)

		this.addEventListener("bluetooth-disabled", () => {
			this.#connectedDevices.clear()
		})

		this.addEventListener("connected", event => {
			this.#connectedDevices.add(event.device)
		})

		this.addEventListener("disconnected", event => {
			this.#connectedDevices.delete(event.device)
		})

		this.addEventListener("connection-lost", event => {
			this.#connectedDevices.delete(event.device)
		})

		this.#initialized = true
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
 * Bluetooth state change event.
 */
export class BluBluetoothStateChangeEvent extends Event {
	/**
	 * Construct a Bluetooth state change event.
	 * @param type - The event type.
	 */
	constructor(type: "bluetooth-enabled" | "bluetooth-disabled") {
		super(type)
	}
}

/**
 * Bluetooth state event target.
 */
type BluBluetoothStateEventTarget = BluEventTarget<{
	/**
	 * Bluetooth has been enabled.
	 */
	"bluetooth-enabled": BluBluetoothStateChangeEvent

	/**
	 * Bluetooth has been disabled.
	 */
	"bluetooth-disabled": BluBluetoothStateChangeEvent

	/**
	 * A Bluetooth device has been connected.
	 */
	connected: BluDeviceConnectionEvent

	/**
	 * A Bluetooth device has been disconnected.
	 * @remarks You must reconnect the device if you want to use it again.
	 */
	disconnected: BluDeviceConnectionEvent

	/**
	 * The connection to a Bluetooth device has been lost.
	 * @remarks You must reconnect the device if you want to use it again.
	 */
	"connection-lost": BluDeviceConnectionEvent
}>

interface AvailabilityChangedEvent extends Event {
	readonly value: boolean
}

/**
 * Blu's global Bluetooth state handler.
 */
const bluetoothState = new BluBluetoothState()
export default bluetoothState
