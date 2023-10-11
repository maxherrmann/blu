import configuration from "./configuration"
import {
	BluDescriptorOperationError,
	BluResponseConstructionError,
} from "./errors"
import { BluEventEmitter, BluEvents } from "./eventEmitter"
import logger from "./logger"
import BluResponse from "./response"
import isBufferSource from "./utils/isBufferSource"

import type BluCharacteristic from "./characteristic"
import type { BluDescriptorDescription } from "./descriptions"

/**
 * Bluetooth descriptor.
 * @public
 */
export default class BluDescriptor extends BluEventEmitter<BluDescriptorEvents> {
	/**
	 * The characteristic associated with this descriptor.
	 * @readonly
	 * @sealed
	 */
	readonly characteristic: BluCharacteristic

	/**
	 * The descriptor's description.
	 * @readonly
	 * @sealed
	 */
	readonly description: BluDescriptorDescription

	/**
	 * The descriptor's default response type.
	 * @remarks Will be used for constructing a response for every generic, i.e.
	 *  not manually requested, notification that is received from the
	 *  descriptor.
	 * @readonly
	 * @virtual
	 */
	readonly responseType = BluResponse

	/**
	 * The descriptor's underlying {@link https://developer.mozilla.org/en-US/docs/Web/API/Web_Bluetooth_API | Web Bluetooth API} object.
	 * @readonly
	 * @sealed
	 */
	readonly _bluetoothDescriptor: BluetoothRemoteGATTDescriptor

	/**
	 * Construct a Bluetooth descriptor.
	 * @param characteristic - The characteristic associated with this
	 *  descriptor.
	 * @param bluetoothDescriptor - The descriptor's object from the {@link https://developer.mozilla.org/en-US/docs/Web/API/Web_Bluetooth_API | Web Bluetooth API}.
	 * @param description - The descriptor's description.
	 */
	constructor({
		characteristic,
		bluetoothDescriptor,
		description,
	}: {
		characteristic: BluCharacteristic
		bluetoothDescriptor: BluetoothRemoteGATTDescriptor
		description: BluDescriptorDescription
	}) {
		super()

		this.characteristic = characteristic
		this.description = description

		this._bluetoothDescriptor = bluetoothDescriptor
	}

	/**
	 * Get the descriptor's UUID.
	 * @readonly
	 * @sealed
	 */
	get uuid() {
		return this._bluetoothDescriptor.uuid
	}

	/**
	 * The descriptor's last known value.
	 * @remarks Updated whenever {@link BluDescriptor.read} is invoked.
	 * @returns The value or `undefined` if the value has never been read.
	 * @readonly
	 * @sealed
	 */
	get value() {
		return this._bluetoothDescriptor.value
	}

	/**
	 * Function that is invoked when the descriptor is about to become ready to
	 * use.
	 * @remarks Can be used to execute asynchronous tasks, like reading or
	 *  writing, before the descriptor is deemed ready to use. Meant to be
	 *  overridden by class extensions.
	 * @virtual
	 */
	beforeReady(): void | Promise<void> {
		return
	}

	/**
	 * Read from the descriptor and get a dummy {@link BluResponse}.
	 * @remarks Constructs a dummy, i.e. fake {@link BluResponse} of the
	 *  descriptor's `responseType` with the descriptor's value as data.
	 *  This is meant as a convenience method and can also be done manually.
	 * @sealed
	 */
	/**
	 * Read from the descriptor.
	 * @remarks Constructs a dummy, i.e. fake, {@link BluResponse} of the
	 *  {@link BluDescriptor.responseType} with the descriptor's value as data.
	 *  This is meant as a convenience method and can also be done manually.
	 * @typeParam ResponseType - The type of the expected response. Defaults to
	 *  {@link BluResponse}.
	 * @returns A `Promise` that resolves with a {@link BluResponse} of the given
	 *  `ResponseType`.
	 * @throws A {@link BluDescriptorOperationError} when something went wrong.
	 * @throws A {@link BluResponseConstructionError} when the response could not
	 *  be constructed.
	 * @sealed
	 */
	async read<ResponseType extends BluResponse = BluResponse>() {
		return new this.responseType(await this.readValue()) as ResponseType
	}

	/**
	 * Read the descriptor's value.
	 * @throws A {@link BluDescriptorOperationError} when something went wrong.
	 * @sealed
	 */
	async readValue() {
		try {
			await this.characteristic.service.device.performGATTOperation(
				() => {
					return this._bluetoothDescriptor.readValue()
				},
			)

			if (configuration.options.dataTransferLogging) {
				logger.target.debug(
					`${this.description.name}: Read value:`,
					this.value,
				)
			}

			return this.value
		} catch (error) {
			throw new BluDescriptorOperationError(
				this,
				"Could not read value.",
				error,
			)
		}
	}

	/**
	 * Write the descriptor's value.
	 * @param value - The value.
	 * @throws A {@link BluDescriptorOperationError} when something went wrong.
	 * @sealed
	 */
	async write(value: BufferSource) {
		if (!isBufferSource(value)) {
			throw new BluDescriptorOperationError(
				this,
				`Argument "value" must be a buffer source.`,
			)
		}

		if (configuration.options.dataTransferLogging) {
			logger.target.debug(`${this.description.name}: Write:`, value)
		}

		try {
			await this.characteristic.service.device.performGATTOperation(
				() => {
					return this._bluetoothDescriptor.writeValue(value)
				},
			)
		} catch (error) {
			throw new BluDescriptorOperationError(
				this,
				"Could not write value.",
				error,
			)
		}
	}
}

/**
 * Descriptor events.
 * @sealed
 * @public
 */
export interface BluDescriptorEvents extends BluEvents {}
