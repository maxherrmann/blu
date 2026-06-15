import EventTarget, { type EventMap } from "jaset"
import type { BluBluetooth } from "./bluetooth-interface.js"
import configuration from "./configuration.js"
import type BluDevice from "./device.js"
import { BluDeviceConnectionEvent } from "./device.js"

/**
 * Bluetooth state handler.
 */
export class BluBluetoothState extends EventTarget<BluBluetoothStateEvents> {
	/**
	 * Collection of connected devices.
	 */
	readonly #connectedDevices = new Set<BluDevice>()

	/**
	 * The Bluetooth interface that the `availabilitychanged` event listener is
	 * currently attached to.
	 */
	#bluetoothInterfaceWithListener?: BluBluetooth

	/**
	 * Event handler that is invoked whenever Bluetooth availability changes.
	 */
	readonly #onAvailabilityChanged = (event: Event) => {
		this.emit(
			(event as AvailabilityChangedEvent).value
				? new BluBluetoothEnabledEvent()
				: new BluBluetoothDisabledEvent(),
		)
	}

	/**
	 * Construct a Bluetooth state handler.
	 */
	constructor() {
		super()

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
	 * The primary, i.e. last connected, device.
	 * @remarks `null` if there is no device connected.
	 * @readonly
	 */
	get connectedDevice(): BluDevice | null {
		return this.connectedDevices[this.connectedDevices.length - 1] ?? null
	}

	/**
	 * Initialize the Bluetooth state handler.
	 */
	initialize() {
		if (!this.isSupported()) {
			return
		}

		const bluetoothInterface = configuration.bluetoothInterface

		if (this.#bluetoothInterfaceWithListener === bluetoothInterface) {
			return
		}

		this.#bluetoothInterfaceWithListener?.removeEventListener(
			"availabilitychanged",
			this.#onAvailabilityChanged,
		)

		bluetoothInterface.addEventListener(
			"availabilitychanged",
			this.#onAvailabilityChanged,
		)

		this.#bluetoothInterfaceWithListener = bluetoothInterface
	}

	/**
	 * Is Bluetooth supported?
	 */
	isSupported() {
		return !!configuration.bluetoothInterface
	}

	/**
	 * Is Bluetooth available?
	 * @returns A `Promise` that resolves to the availability.
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
