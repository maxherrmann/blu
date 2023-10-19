import configuration from "./configuration"
import {
	BluCharacteristicNotificationTimeoutError,
	BluCharacteristicOperationError,
	BluResponseConstructionError,
} from "./errors"
import { BluEventEmitter, BluEvents } from "./eventEmitter"
import logger from "./logger"
import BluRequest from "./request"
import BluResponse from "./response"
import isArray from "./utils/isArray"
import isBufferSource from "./utils/isBufferSource"

import type { BluCharacteristicDescription } from "./descriptions"
import type BluDescriptor from "./descriptor"
import type BluService from "./service"

/**
 * Bluetooth characteristic.
 * @public
 */
export default class BluCharacteristic extends BluEventEmitter<BluCharacteristicEvents> {
	/**
	 * The service associated with this characteristic.
	 * @readonly
	 * @sealed
	 */
	readonly service: BluService

	/**
	 * The characteristic's description.
	 * @readonly
	 * @sealed
	 */
	readonly description: BluCharacteristicDescription

	/**
	 * The characteristic's properties.
	 * @readonly
	 * @sealed
	 */
	readonly properties: BluCharacteristicProperties

	/**
	 * The characteristic's discovered descriptors.
	 * @readonly
	 * @sealed
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
	 * The characteristic's underlying {@link https://developer.mozilla.org/en-US/docs/Web/API/Web_Bluetooth_API | Web Bluetooth API} object.
	 * @readonly
	 * @sealed
	 */
	readonly _bluetoothCharacteristic: BluetoothRemoteGATTCharacteristic

	/**
	 * Construct a Bluetooth characteristic.
	 * @param service - The service associated with this characteristic.
	 * @param bluetoothCharacteristic - The characteristic's object from the {@link https://developer.mozilla.org/en-US/docs/Web/API/Web_Bluetooth_API | Web Bluetooth API}.
	 * @param description - The characteristic's description.
	 */
	constructor({
		service,
		bluetoothCharacteristic,
		description,
	}: {
		service: BluService
		bluetoothCharacteristic: BluetoothRemoteGATTCharacteristic
		description: BluCharacteristicDescription
	}) {
		super()

		this.service = service
		this.description = description
		this.properties = new BluCharacteristicProperties(
			bluetoothCharacteristic.properties,
		)

		this._bluetoothCharacteristic = bluetoothCharacteristic

		this.on("notification", response => {
			if (configuration.options.dataTransferLogging) {
				logger.target.debug(
					`${this.description.name}: Notification received:`,
					response,
				)
			}
		})
	}

	/**
	 * The characteristic's UUID.
	 * @readonly
	 * @sealed
	 */
	get uuid() {
		return this._bluetoothCharacteristic.uuid
	}

	/**
	 * The characteristic's last known value.
	 * @remarks Updated whenever {@link BluCharacteristic.read} is invoked.
	 * @returns The value or `undefined` if the value has never been read.
	 * @readonly
	 * @sealed
	 */
	get value() {
		return this._bluetoothCharacteristic.value
	}

	/**
	 * Has the characteristic all expected properties?
	 * @sealed
	 * @readonly
	 */
	get hasExpectedProperties() {
		return (
			this.description.expectedProperties === null ||
			this.properties.toString() === this.description.expectedProperties
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
	 * @sealed
	 */
	async read<ResponseType extends BluResponse = BluResponse>() {
		return new this.responseType(await this.readValue()) as ResponseType
	}

	/**
	 * Read the characteristic's value.
	 * @throws A {@link BluCharacteristicOperationError} when something went wrong.
	 * @sealed
	 */
	async readValue() {
		if (!this.properties.read) {
			throw new BluCharacteristicOperationError(
				this,
				"Could not read from a non-readable characteristic.",
			)
		}

		try {
			await this.service.device.performGATTOperation(() => {
				return this._bluetoothCharacteristic.readValue()
			})

			if (configuration.options.dataTransferLogging) {
				logger.target.debug(
					`${this.description.name}: Read value:`,
					this.value,
				)
			}

			return this.value
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
	 * @sealed
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

		if (configuration.options.dataTransferLogging) {
			logger.target.debug(`${this.description.name}: Write:`, value)
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
	 * @sealed
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

			let timeoutTimer: NodeJS.Timeout
			let isTimeoutReached = false

			if (configuration.options.dataTransferLogging) {
				logger.target.debug(
					`${this.description.name}: Request:`,
					request,
				)
			}

			const onResponse = (response: BluResponse) => {
				if (
					!isTimeoutReached &&
					request.responseType.validatorFunction(response)
				) {
					clearTimeout(timeoutTimer)

					this.off("notification", onResponse)

					resolve(
						new request.responseType(response.data) as ResponseType,
					)
				}
			}

			this.on("notification", onResponse)

			if (timeout) {
				timeoutTimer = setTimeout(() => {
					isTimeoutReached = true

					this.off("notification", onResponse)

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

				this.off("notification", onResponse)

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
	 * @sealed
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
	 * @sealed
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

			logger.debug("Started listening for notifications.", this)
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
	 * @sealed
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

			logger.debug("Stopped listening for notifications.", this)
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
		this.emit("notification", new this.responseType(this.value))
	}
}

/**
 * Characteristic events.
 * @sealed
 * @public
 */
export interface BluCharacteristicEvents extends BluEvents {
	/**
	 * A notification has been received from the characteristic.
	 * @param response - The response, constructed from the characteristic's
	 *  new value.
	 * @eventProperty
	 */
	notification: (response: BluResponse) => void
}

/**
 * Properties of a characteristic.
 * @sealed
 * @public
 */
export class BluCharacteristicProperties {
	/**
	 * Has the characteristic the "Read" capability?
	 * @readonly
	 */
	readonly read: boolean

	/**
	 * Has the characteristic the "Write" capability?
	 * @readonly
	 */
	readonly write: boolean

	/**
	 * Has the characteristic the "Write without response" capability?
	 * @readonly
	 */
	readonly writeWithoutResponse: boolean

	/**
	 * Has the characteristic the "Notify" capability?
	 * @readonly
	 */
	readonly notify: boolean

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

		if (this.notify) {
			this.isListening = false
		}
	}

	/**
	 * Get the characteristic's properties formatted as an indicator string.
	 * @remarks
	 *  **Indicators**
	 *
	 *  1. `R`: Read
	 *
	 *  2. `W`: Write
	 *
	 *  3. `w`: Write without response
	 *
	 *  4. `N`: Notify
	 *
	 *  Missing capabilities are represented by `-`.
	 *
	 *  **Examples**
	 *
	 *  1. `"RW-N"`: Represents a characteristic that is readable, writable and
	 *  notifiable.
	 *
	 *  2. `"--w-"`: Represents a characteristic that is writable without
	 *  response.
	 */
	toString() {
		const indicators: string[] = [
			this.read ? "R" : "-",
			this.write ? "W" : "-",
			this.writeWithoutResponse ? "w" : "-",
			this.notify ? "N" : "-",
		]

		return indicators.join("")
	}
}
