import EventTarget, { type EventMap } from "jaset"
import type { BluBluetoothRemoteGATTService } from "./bluetoothInterface.js"
import type BluCharacteristic from "./characteristic.js"
import type { BluServiceDescription } from "./descriptions.js"
import type BluDevice from "./device.js"

/**
 * Bluetooth service.
 */
export default class BluService<
	Device extends BluDevice = BluDevice,
	Events extends EventMap<Events> = EventMap,
> extends EventTarget<Events> {
	/**
	 * The device associated with this service.
	 * @readonly
	 */
	readonly device: Device

	/**
	 * The service's description.
	 * @readonly
	 */
	readonly description: BluServiceDescription

	/**
	 * The service's discovered characteristics.
	 * @readonly
	 */
	readonly characteristics: BluCharacteristic[] = []

	/**
	 * The service's underlying Bluetooth interface endpoint.
	 * @readonly
	 */
	readonly _bluetoothService: BluBluetoothRemoteGATTService

	/**
	 * Construct a Bluetooth service.
	 * @param device - The device associated with this service.
	 * @param bluetoothService - The service's underlying Bluetooth interface
	 *  endpoint.
	 * @param description - The service's description.
	 */
	constructor({
		device,
		bluetoothService,
		description,
	}: {
		device: Device
		bluetoothService: BluBluetoothRemoteGATTService
		description: BluServiceDescription
	}) {
		super()

		this.device = device
		this.description = description

		this._bluetoothService = bluetoothService
	}

	/**
	 * The service's UUID.
	 * @readonly
	 */
	get uuid() {
		return this._bluetoothService.uuid
	}

	/**
	 * Function that is invoked when the service is about to become ready to
	 * use.
	 * @remarks Can be used to execute asynchronous tasks, like reading or
	 *  writing, before the service is deemed ready to use. Meant to be
	 *  overridden by class extensions.
	 * @virtual
	 */
	beforeReady(): void | Promise<void> {
		return
	}
}
