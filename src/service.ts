import type { BluBluetoothRemoteGATTService } from "./bluetoothInterface"
import type BluCharacteristic from "./characteristic"
import type { BluServiceDescription } from "./descriptions"
import type BluDevice from "./device"
import type { BluEventTarget } from "./eventTarget"

/**
 * Bluetooth service.
 */
export default class BluService extends (EventTarget as BluServiceEventTarget) {
	/**
	 * The device associated with this service.
	 * @readonly
	 */
	readonly device: BluDevice

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
		device: BluDevice
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

/**
 * Service event target.
 */
type BluServiceEventTarget = BluEventTarget<Record<string, Event | CustomEvent>>
