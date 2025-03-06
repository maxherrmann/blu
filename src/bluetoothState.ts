import configuration from "./configuration.js"
import type BluDevice from "./device.js"
import { BluDeviceConnectionEvent } from "./device.js"
import EventTarget, { type EventMap } from "jaset"

/**
 * Bluetooth state handler.
 */
export class BluBluetoothState extends EventTarget<BluBluetoothStateEvents> {
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
	get connectedDevices(): BluDevice[] {
		return Array.from(this.#connectedDevices)
	}

	/**
	 * The primary, i.e. first connected, device. `null` if there is no device
	 * connected.
	 * @readonly
	 */
	get connectedDevice(): BluDevice | null {
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
			(event) => {
				this.emit(
					(event as AvailabilityChangedEvent).value
						? new BluBluetoothEnabledEvent()
						: new BluBluetoothDisabledEvent(),
				)
			},
		)

		this.on("bluetooth-disabled", () => {
			this.#connectedDevices.clear()
		})

		this.on("connected", (event) => {
			this.#connectedDevices.add(event.device)
		})

		this.on("disconnected", (event) => {
			this.#connectedDevices.delete(event.device)
		})

		this.on("connection-lost", (event) => {
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
 * Bluetooth enabled event.
 */
export class BluBluetoothEnabledEvent extends Event {
	/**
	 * Construct a Bluetooth enabled event.
	 */
	constructor() {
		super("bluetooth-enabled")
	}
}

/**
 * Bluetooth disabled event.
 */
export class BluBluetoothDisabledEvent extends Event {
	/**
	 * Construct a Bluetooth disabled event.
	 */
	constructor() {
		super("bluetooth-disabled")
	}
}

/**
 * Bluetooth state event target.
 */
type BluBluetoothStateEvents = EventMap<{
	/**
	 * Bluetooth has been enabled.
	 */
	"bluetooth-enabled": BluBluetoothEnabledEvent

	/**
	 * Bluetooth has been disabled.
	 */
	"bluetooth-disabled": BluBluetoothDisabledEvent

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
