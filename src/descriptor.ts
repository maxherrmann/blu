import EventTarget, { type EventMap } from "jaset"
import type { BluBluetoothRemoteGATTDescriptor } from "./bluetoothInterface.js"
import type BluCharacteristic from "./characteristic.js"
import configuration from "./configuration.js"
import type { BluDescriptorDescription } from "./descriptions.js"
import { BluDescriptorOperationError } from "./errors.js"
import BluResponse from "./response.js"
import isBufferSource from "./utils/isBufferSource.js"

/**
 * Bluetooth descriptor.
 */
export default class BluDescriptor<
	Characteristic extends BluCharacteristic = BluCharacteristic,
	Events extends EventMap<Events> = EventMap,
> extends EventTarget<Events> {
	/**
	 * The characteristic associated with this descriptor.
	 * @readonly
	 */
	readonly characteristic: Characteristic

	/**
	 * The descriptor's description.
	 * @readonly
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
	 * The descriptor's underlying Bluetooth interface endpoint.
	 * @readonly
	 */
	readonly _bluetoothDescriptor: BluBluetoothRemoteGATTDescriptor

	/**
	 * Construct a Bluetooth descriptor.
	 * @param characteristic - The characteristic associated with this
	 *  descriptor.
	 * @param bluetoothDescriptor - The descriptor's underlying Bluetooth
	 *  interface endpoint.
	 * @param description - The descriptor's description.
	 */
	constructor({
		characteristic,
		bluetoothDescriptor,
		description,
	}: {
		characteristic: Characteristic
		bluetoothDescriptor: BluBluetoothRemoteGATTDescriptor
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
	 */
	get uuid() {
		return this._bluetoothDescriptor.uuid
	}

	/**
	 * The descriptor's last known value.
	 * @remarks Updated whenever {@link BluDescriptor.read} is invoked.
	 * @returns The value or `undefined` if the value has never been read.
	 * @readonly
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
	 */
	async read<ResponseType extends BluResponse = BluResponse>() {
		return new this.responseType(await this.readValue()) as ResponseType
	}

	/**
	 * Read the descriptor's value.
	 * @throws A {@link BluDescriptorOperationError} when something went wrong.
	 */
	async readValue() {
		try {
			await this.characteristic.service.device.performGATTOperation(
				() => {
					return this._bluetoothDescriptor.readValue()
				},
			)

			if (
				configuration.options.logging &&
				configuration.options.dataTransferLogging
			) {
				console.debug(
					`${this.characteristic.service.device.name} ` +
						`(${this.characteristic.service.device.constructor.name}): ` +
						`${this.characteristic.description.name}: ` +
						`${this.description.name}: Read:`,
					this.value,
				)
			}

			return this.value
		} catch (error) {
			throw new BluDescriptorOperationError(
				this as never,
				"Could not read value.",
				error,
			)
		}
	}

	/**
	 * Write the descriptor's value.
	 * @param value - The value.
	 * @throws A {@link BluDescriptorOperationError} when something went wrong.
	 */
	async write(value: BufferSource) {
		if (!isBufferSource(value)) {
			throw new BluDescriptorOperationError(
				this as never,
				`Argument "value" must be a buffer source.`,
			)
		}

		if (
			configuration.options.logging &&
			configuration.options.dataTransferLogging
		) {
			console.debug(
				`${this.characteristic.service.device.name} ` +
					`(${this.characteristic.service.device.constructor.name}): ` +
					`${this.characteristic.description.name}: ` +
					`${this.description.name}: Write:`,
				value,
			)
		}

		try {
			await this.characteristic.service.device.performGATTOperation(
				() => {
					return this._bluetoothDescriptor.writeValue(value)
				},
			)
		} catch (error) {
			throw new BluDescriptorOperationError(
				this as never,
				"Could not write value.",
				error,
			)
		}
	}
}
