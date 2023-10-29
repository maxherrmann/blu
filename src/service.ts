import { BluEventEmitter, BluEvents } from "./eventEmitter"

import type BluCharacteristic from "./characteristic"
import type { BluServiceDescription } from "./descriptions"
import type BluDevice from "./device"

/**
 * Bluetooth service.
 * @public
 */
export default class BluService extends BluEventEmitter<BluServiceEvents> {
	/**
	 * The device associated with this service.
	 * @readonly
	 * @sealed
	 */
	readonly device: BluDevice

	/**
	 * The service's description.
	 * @readonly
	 * @sealed
	 */
	readonly description: BluServiceDescription

	/**
	 * The service's discovered characteristics.
	 * @readonly
	 * @sealed
	 */
	readonly characteristics: BluCharacteristic[] = []

	/**
	 * The service's underlying
	 * {@link https://developer.mozilla.org/en-US/docs/Web/API/Web_Bluetooth_API | Web Bluetooth API}
	 * object.
	 * @readonly
	 * @sealed
	 */
	readonly _bluetoothService: BluetoothRemoteGATTService

	/**
	 * Construct a Bluetooth service.
	 * @param device - The device associated with this service.
	 * @param bluetoothService - The service's object from the Web Bluetooth
	 *  API.
	 * @param description - The service's description.
	 */
	constructor({
		device,
		bluetoothService,
		description,
	}: {
		device: BluDevice
		bluetoothService: BluetoothRemoteGATTService
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
	 * @sealed
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
 * Service events.
 * @sealed
 * @public
 */
export interface BluServiceEvents extends BluEvents {}
