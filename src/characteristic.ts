import type { BluBluetoothRemoteGATTCharacteristic } from "./bluetoothInterface"
import configuration from "./configuration"
import type { BluCharacteristicDescription } from "./descriptions"
import type BluDescriptor from "./descriptor"
import {
	BluCharacteristicNotificationTimeoutError,
	BluCharacteristicOperationError,
	BluResponseConstructionError,
} from "./errors"
import type { BluEventTarget } from "./eventTarget"
import BluRequest from "./request"
import BluResponse from "./response"
import type BluService from "./service"
import isArray from "./utils/isArray"
import isBufferSource from "./utils/isBufferSource"

/**
 * Bluetooth characteristic.
 */
export default class BluCharacteristic extends (EventTarget as BluCharacteristicEventTarget) {
	/**
	 * The service associated with this characteristic.
	 * @readonly
	 */
	readonly service: BluService

	/**
	 * The characteristic's description.
	 * @readonly
	 */
	readonly description: BluCharacteristicDescription

	/**
	 * The characteristic's properties.
	 * @readonly
	 */
	readonly properties: BluCharacteristicProperties

	/**
	 * The characteristic's discovered descriptors.
	 * @readonly
	 */
	readonly descriptors: BluDescriptor[] = []

	/**
	 * The characteristic's default response type.
	 * @remarks Will be used for constructing a response for every generic, i.e.
	 *  not manually requested, notification that is received from the
	 *  characteristic.
	 * @readonly
	 * @virtual
	 */
	readonly responseType = BluResponse

	/**
	 * The characteristic's underlying Bluetooth interface endpoint.
	 * @readonly
	 */
	readonly _bluetoothCharacteristic: BluBluetoothRemoteGATTCharacteristic

	/**
	 * Construct a Bluetooth characteristic.
	 * @param service - The service associated with this characteristic.
	 * @param bluetoothCharacteristic - The characteristic's underlying
	 *  Bluetooth interface endpoint.
	 * @param description - The characteristic's description.
	 */
	constructor({
		service,
		bluetoothCharacteristic,
		description,
	}: {
		service: BluService
		bluetoothCharacteristic: BluBluetoothRemoteGATTCharacteristic
		description: BluCharacteristicDescription
	}) {
		super()

		this.service = service
		this.description = description
		this.properties = new BluCharacteristicProperties(
			bluetoothCharacteristic.properties,
		)

		this._bluetoothCharacteristic = bluetoothCharacteristic

		this.addEventListener("notification", event => {
			if (
				configuration.options.logging &&
				configuration.options.dataTransferLogging
			) {
				console.debug(
					`${this.service.device.name} ` +
						`(${this.service.device.constructor.name}): ` +
						`${this.description.name}: Notification:`,
					event.response.data,
				)
			}
		})
	}

	/**
	 * The characteristic's UUID.
	 * @readonly
	 */
	get uuid() {
		return this._bluetoothCharacteristic.uuid
	}

	/**
	 * The characteristic's last known value.
	 * @remarks Updated whenever {@link BluCharacteristic.read} is invoked.
	 * @returns The value or `undefined` if the value has never been read.
	 * @readonly
	 */
	get value() {
		return this._bluetoothCharacteristic.value
	}

	/**
	 * Has the characteristic all expected properties?
	 * @readonly
	 */
	get hasExpectedProperties() {
		if (this.description.expectedProperties === undefined) {
			return true
		}

		return (
			(this.description.expectedProperties.authenticatedSignedWrites ===
				undefined ||
				this.description.expectedProperties
					.authenticatedSignedWrites ===
					this.properties.authenticatedSignedWrites) &&
			(this.description.expectedProperties.broadcast === undefined ||
				this.description.expectedProperties.broadcast ===
					this.properties.broadcast) &&
			(this.description.expectedProperties.indicate === undefined ||
				this.description.expectedProperties.indicate ===
					this.properties.indicate) &&
			(this.description.expectedProperties.read === undefined ||
				this.description.expectedProperties.read ===
					this.properties.read) &&
			(this.description.expectedProperties.reliableWrite === undefined ||
				this.description.expectedProperties.reliableWrite ===
					this.properties.reliableWrite) &&
			(this.description.expectedProperties.write === undefined ||
				this.description.expectedProperties.write ===
					this.properties.write) &&
			(this.description.expectedProperties.writeWithoutResponse ===
				undefined ||
				this.description.expectedProperties.writeWithoutResponse ===
					this.properties.writeWithoutResponse) &&
			(this.description.expectedProperties.notify === undefined ||
				this.description.expectedProperties.notify ===
					this.properties.notify) &&
			(this.description.expectedProperties.writableAuxiliaries ===
				undefined ||
				this.description.expectedProperties.writableAuxiliaries ===
					this.properties.writableAuxiliaries)
		)
	}

	/**
	 * Function that is invoked when the characteristic is about to become ready
	 * to use.
	 * @remarks Can be used to execute asynchronous tasks, like reading or
	 *  writing, before the characteristic is deemed ready to use. Meant to be
	 *  overridden by class extensions.
	 * @virtual
	 */
	beforeReady(): void | Promise<void> {
		return
	}

	/**
	 * Read from the characteristic.
	 * @remarks Constructs a dummy, i.e. fake, {@link BluResponse} of the
	 *  {@link BluCharacteristic.responseType} with the characteristic's value as
	 *  data. This is meant as a convenience method and can also be done
	 *  manually.
	 * @typeParam ResponseType - The type of the expected response. Defaults to
	 *  {@link BluResponse}.
	 * @returns A `Promise` that resolves with a {@link BluResponse} of the given
	 *  `ResponseType`.
	 * @throws A {@link BluCharacteristicOperationError} when something went wrong.
	 * @throws A {@link BluResponseConstructionError} when the response could not
	 *  be constructed.
	 */
	async read<ResponseType extends BluResponse = BluResponse>() {
		return new this.responseType(await this.readValue()) as ResponseType
	}

	/**
	 * Read the characteristic's value.
	 * @throws A {@link BluCharacteristicOperationError} when something went wrong.
	 */
	async readValue() {
		if (!this.properties.read) {
			throw new BluCharacteristicOperationError(
				this,
				"Could not read from a non-readable characteristic.",
			)
		}

		try {
			const value =
				await this.service.device.performGATTOperation<DataView>(() => {
					return this._bluetoothCharacteristic.readValue()
				})

			if (
				configuration.options.logging &&
				configuration.options.dataTransferLogging
			) {
				console.debug(
					`${this.service.device.name} ` +
						`(${this.service.device.constructor.name}): ` +
						`${this.description.name}: Read:`,
					value,
				)
			}

			return value
		} catch (error) {
			throw new BluCharacteristicOperationError(
				this,
				"Could not read value.",
				error,
			)
		}
	}

	/**
	 * Write the characteristic's value.
	 * @param value - The value.
	 * @param withoutResponse - Write without waiting for a
	 *  response?
	 * @throws A {@link BluCharacteristicOperationError} when something went wrong.
	 */
	async write(value: BufferSource, withoutResponse = false) {
		if (withoutResponse && !this.properties.writeWithoutResponse) {
			throw new BluCharacteristicOperationError(
				this,
				"Could not write without response to a characteristic " +
					"that is not writable without response.",
			)
		}

		if (!withoutResponse && !this.properties.write) {
			throw new BluCharacteristicOperationError(
				this,
				"Could not write to a non-writable characteristic.",
			)
		}

		if (!isBufferSource(value)) {
			throw new BluCharacteristicOperationError(
				this,
				`Argument "value" must be of type "BufferSource".`,
			)
		}

		if (
			configuration.options.logging &&
			configuration.options.dataTransferLogging
		) {
			console.debug(
				`${this.service.device.name} ` +
					`(${this.service.device.constructor.name}): ` +
					`${this.description.name}: Write:`,
				value,
			)
		}

		try {
			if (withoutResponse) {
				await this.service.device.performGATTOperation(() => {
					return this._bluetoothCharacteristic.writeValueWithoutResponse(
						value,
					)
				})
			} else {
				await this.service.device.performGATTOperation(() => {
					return this._bluetoothCharacteristic.writeValueWithResponse(
						value,
					)
				})
			}
		} catch (error) {
			throw new BluCharacteristicOperationError(
				this,
				"Could not write.",
				error,
			)
		}
	}

	/**
	 * Send a request to the characteristic.
	 * @typeParam ResponseType - The type of the expected response. Defaults to
	 *  {@link BluResponse}.
	 * @param request - The request.
	 * @param timeout - The time to wait for an answer
	 *  (a notification) in milliseconds before the request fails. Defaults to
	 *  5000 milliseconds.
	 * @returns A `Promise` that resolves with a {@link BluResponse} of the given
	 *  {@link BluRequest.responseType}.
	 * @throws A {@link BluCharacteristicOperationError} when something went wrong.
	 * @throws A {@link BluCharacteristicNotificationTimeoutError} when the request
	 *  timed out.
	 * @throws A {@link BluResponseConstructionError} when a response could not be
	 *  constructed.
	 */
	request<ResponseType extends BluResponse = BluResponse>(
		request: BluRequest,
		timeout = 5000,
	) {
		return new Promise<ResponseType>((resolve, reject) => {
			if (!(request instanceof BluRequest)) {
				reject(
					new BluCharacteristicOperationError(
						this,
						`Argument "request" must be a valid instance of "BluRequest".`,
					),
				)

				return
			}

			if (timeout !== undefined && typeof timeout !== "number") {
				reject(
					new BluCharacteristicOperationError(
						this,
						`Argument "timeout" must be either "undefined" or of type` +
							`"number".`,
					),
				)

				return
			}

			let timeoutTimer: ReturnType<typeof setTimeout>
			let isTimeoutReached = false

			if (
				configuration.options.logging &&
				configuration.options.dataTransferLogging
			) {
				console.debug(
					`${this.service.device.name} ` +
						`(${this.service.device.constructor.name}): ` +
						`${this.description.name}: Request:`,
					request,
				)
			}

			const onResponse = (event: BluCharacteristicNotificationEvent) => {
				if (
					!isTimeoutReached &&
					request.responseType.validatorFunction(event.response)
				) {
					clearTimeout(timeoutTimer)

					this.removeEventListener("notification", onResponse)

					const response = new request.responseType(
						event.response.data,
					) as ResponseType

					if (
						configuration.options.logging &&
						configuration.options.dataTransferLogging
					) {
						console.debug(
							`${this.service.device.name} ` +
								`(${this.service.device.constructor.name}): ` +
								`${this.description.name}: Response:`,
							response,
						)
					}

					resolve(response)
				}
			}

			this.addEventListener("notification", onResponse)

			if (timeout) {
				timeoutTimer = setTimeout(() => {
					isTimeoutReached = true

					this.removeEventListener("notification", onResponse)

					reject(
						new BluCharacteristicNotificationTimeoutError(
							`Did not receive an expected notification ` +
								`from the device within ${timeout} ms.`,
						),
					)
				}, timeout)
			}

			this.write(request.data).catch(error => {
				if (isTimeoutReached) {
					return
				}

				clearTimeout(timeoutTimer)

				this.removeEventListener("notification", onResponse)

				reject(
					new BluCharacteristicOperationError(
						this,
						"Could not request from characteristic.",
						error,
					),
				)
			})
		})
	}

	/**
	 * Send multiple requests to the characteristic.
	 * @typeParam ResponseTypes - The types of the expected responses. Defaults
	 *  to {@link BluResponse}[]. The order of response types matches the order
	 *  of requests.
	 * @param requests - The requests.
	 * @param timeout - The time to wait for each answer
	 *  (notification) in milliseconds before the respective request fails.
	 *  Defaults to 5000 milliseconds.
	 * @returns A `Promise` that resolves with an array of {@link BluResponse}s
	 *  of their respectively given {@link BluRequest.responseType}s. The order
	 *  of responses matches the order of requests.
	 * @throws A {@link BluCharacteristicOperationError} when something went
	 *  wrong.
	 * @throws A {@link BluCharacteristicNotificationTimeoutError} when a
	 *  request timed out.
	 * @throws A {@link BluResponseConstructionError} when a response could not
	 *  be constructed.
	 */
	async requestAll<ResponseTypes extends BluResponse[] = BluResponse[]>(
		requests: BluRequest[],
		timeout = 5000,
	) {
		if (
			!isArray(requests) ||
			!requests.every(request => request instanceof BluRequest)
		) {
			throw new BluCharacteristicOperationError(
				this,
				`Argument "requests" must be an array of "BluRequest".`,
			)
		}

		if (timeout !== undefined && typeof timeout !== "number") {
			throw new BluCharacteristicOperationError(
				this,
				`Argument "timeout" must be either "undefined", or of type` +
					`"number".`,
			)
		}

		const responses: BluResponse[] = []

		for (const request of requests) {
			responses.push(await this.request(request, timeout))
		}

		return responses as ResponseTypes
	}

	/**
	 * Start listening for notifications.
	 * @throws A {@link BluCharacteristicOperationError} when something went
	 *  wrong.
	 */
	async startListeningForNotifications() {
		if (!this.properties.notify) {
			throw new BluCharacteristicOperationError(
				this,
				"Could not start listening for notifications on a " +
					"non-notifying characteristic.",
			)
		}

		if (this.properties.isListening) {
			throw new BluCharacteristicOperationError(
				this,
				"Could not start listening for notifications on a " +
					"characteristic that is already listening for " +
					"notifications.",
			)
		}

		try {
			await this.service.device.performGATTOperation(() => {
				return this._bluetoothCharacteristic.startNotifications()
			})

			this._bluetoothCharacteristic.addEventListener(
				"characteristicvaluechanged",
				this.#onNotification.bind(this),
			)

			this.properties.isListening = true

			if (configuration.options.logging) {
				console.debug(
					`${this.service.device.name} ` +
						`(${this.service.device.constructor.name}): ` +
						`${this.description.name}: Started listening for ` +
						`notifications.`,
				)
			}
		} catch (error) {
			throw new BluCharacteristicOperationError(
				this,
				"Could not start listening for notifications.",
				error,
			)
		}
	}

	/**
	 * Stop listening for notifications.
	 * @throws A {@link BluCharacteristicOperationError} when something went
	 *  wrong.
	 */
	async stopListeningForNotifications() {
		if (!this.properties.isListening) {
			throw new BluCharacteristicOperationError(
				this,
				"Could not stop listening for notifications on a " +
					"characteristic that is not yet listening for " +
					"notifications.",
			)
		}

		try {
			await this.service.device.performGATTOperation(() => {
				return this._bluetoothCharacteristic.stopNotifications()
			})

			this._bluetoothCharacteristic.removeEventListener(
				"characteristicvaluechanged",
				this.#onNotification.bind(this),
			)

			this.properties.isListening = false

			if (configuration.options.logging) {
				console.debug(
					`${this.service.device.name} ` +
						`(${this.service.device.constructor.name}): ` +
						`${this.description.name}: Stopped listening for ` +
						`notifications.`,
				)
			}
		} catch (error) {
			throw new BluCharacteristicOperationError(
				this,
				"Could not stop listening for notifications.",
				error,
			)
		}
	}

	/**
	 * Event handler that is invoked whenever a notification is received.
	 */
	#onNotification() {
		this.dispatchEvent(
			new BluCharacteristicNotificationEvent(
				new this.responseType(this.value),
			),
		)
	}
}

/**
 * Properties of a characteristic.
 */
export class BluCharacteristicProperties
	implements BluetoothCharacteristicProperties
{
	/**
	 * Has the characteristic the "read" property?
	 * @readonly
	 */
	readonly read: boolean

	/**
	 * Has the characteristic the "write" property?
	 * @readonly
	 */
	readonly write: boolean

	/**
	 * Has the characteristic the "write without response" property?
	 * @readonly
	 */
	readonly writeWithoutResponse: boolean

	/**
	 * Has the characteristic the "notify" property?
	 * @readonly
	 */
	readonly notify: boolean

	/**
	 * Has the characteristic the "broadcast" property?
	 * @readonly
	 */
	readonly broadcast: boolean

	/**
	 * Has the characteristic the "indicate" property?
	 * @readonly
	 */
	readonly indicate: boolean

	/**
	 * Has the characteristic the "authenticated signed writes" property?
	 * @readonly
	 */
	readonly authenticatedSignedWrites: boolean

	/**
	 * Has the characteristic the "reliable write" property?
	 * @readonly
	 */
	readonly reliableWrite: boolean

	/**
	 * Has the characteristic the "writable auxiliaries" property?
	 * @readonly
	 */
	readonly writableAuxiliaries: boolean

	/**
	 * Is the characteristic currently listening for notifications?
	 * @remarks `undefined` if {@link BluCharacteristicProperties.notify} is
	 *  `false`.
	 */
	isListening?: boolean

	/**
	 * Construct a characteristic property dictionary.
	 * @param properties - The characteristic's properties, taken from the
	 *  {@link https://developer.mozilla.org/en-US/docs/Web/API/Web_Bluetooth_API | Web Bluetooth API}.
	 */
	constructor(properties: BluetoothRemoteGATTCharacteristic["properties"]) {
		this.read = properties.read
		this.write = properties.write
		this.writeWithoutResponse = properties.writeWithoutResponse
		this.notify = properties.notify
		this.broadcast = properties.broadcast
		this.indicate = properties.indicate
		this.authenticatedSignedWrites = properties.authenticatedSignedWrites
		this.reliableWrite = properties.reliableWrite
		this.writableAuxiliaries = properties.writableAuxiliaries

		if (this.notify) {
			this.isListening = false
		}
	}
}

/**
 * Characteristic notification event.
 */
export class BluCharacteristicNotificationEvent extends Event {
	/**
	 * The response, constructed from the characteristic's new value.
	 * @readonly
	 */
	readonly response: BluResponse

	/**
	 * Construct a characteristic notification event.
	 * @param response - The response, constructed from the characteristic's new
	 *  value.
	 */
	constructor(response: BluResponse) {
		super("notification")

		this.response = response
	}
}

/**
 * Characteristic event target.
 */
type BluCharacteristicEventTarget = BluEventTarget<{
	/**
	 * A notification has been received from the characteristic.
	 */
	notification: BluCharacteristicNotificationEvent

	/**
	 * Custom event.
	 */
	[key: string]: Event | CustomEvent
}>
