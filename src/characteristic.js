import logger from "./logger.js"
import bluetooth from "./bluetooth.js"

import Request from "./request.js"
import Response from "./response.js"

import BluError from "../utils/bluError.js"
import EventEmitter from "../utils/eventEmitter.js"
import isArray from "../utils/isArray.js"
import isTypedArray from "../utils/isTypedArray.js"

export default class Characteristic extends EventEmitter {
	service
	description
	properties
	descriptors
	responseType = Response

	_bluetoothCharacteristic

	constructor(service, bluetoothCharacteristic, description) {
		super()

		this.service = service
		this.description = description
		this.properties = new CharacteristicProperties(
			bluetoothCharacteristic.properties
		)
		this.descriptors = []

		this._bluetoothCharacteristic = bluetoothCharacteristic

		this.on("notification", response => {
			if (bluetooth.isDataTransferLoggingEnabled) {
				logger.target.debug(
					`${this.description.name}: Notification received:`,
					response
				)
			}
		})
	}

	get uuid() {
		return this._bluetoothCharacteristic.uuid
	}

	get value() {
		return this._bluetoothCharacteristic.value
	}

	get hasExpectedProperties() {
		return this.properties.string === this.description.expectedIndicators
	}

	async onceReady() {}

	readValue() {
		return new Promise(async (resolve, reject) => {
			if (!this.properties.read) {
				reject(
					new CharacteristicOperationError(
						this,
						`Cannot read from a non-readable characteristic.`
					)
				)

				return
			}

			try {
				await this.service.device.performGATTOperation(() => {
					return this._bluetoothCharacteristic.readValue()
				})

				if (bluetooth.isDataTransferLoggingEnabled) {
					logger.target.debug(
						`${this.description.name}: Read value:`,
						this.value
					)
				}

				resolve(this.value)
			}
			catch(error) {
				reject(
					new CharacteristicOperationError(
						this,
						"Cannot read value.",
						error
					)
				)
			}
		})
	}

	read(responseProperty) {
		return new Promise(async (resolve, reject) => {
			if (typeof responseProperty !== "string") {
				reject(
					new CharacteristicOperationError(
						this,
						`Argument "responseProperty" must be of type "string".`
					)
				)

				return
			}

			try {
				let value = await this.readValue()

				resolve(new this.responseType(value)[responseProperty])
			}
			catch(error) {
				reject(error)
			}
		})
	}

	write(value, withoutResponse = false) {
		return new Promise(async (resolve, reject) => {
			if (withoutResponse && !this.properties.writeWithoutResponse) {
				reject(
					new CharacteristicOperationError(
						this,
						`Cannot write without response to a characteristic ` +
						`that is not writable without response.`
					)
				)

				return
			}

			if (!withoutResponse && !this.properties.write) {
				reject(
					new CharacteristicOperationError(
						this,
						`Cannot write to a non-writable characteristic.`
					)
				)

				return
			}

			if (!isTypedArray(value)) {
				if (isArray(value)) {
					if (!value.every(entry => typeof entry === "number")) {
						reject(
							new CharacteristicOperationError(
								this,
								`Argument "value" must be an array of items ` +
								`that are all of type "number".`
							)
						)

						return
					}

					value = new Uint8Array(value)
				}
				else {
					if (typeof value !== "number") {
						reject(
							new CharacteristicOperationError(
								this,
								`Argument "value" must be of type "number".`
							)
						)

						return
					}

					value = new Uint8Array([value])
				}
			}

			try {
				if (bluetooth.isDataTransferLoggingEnabled) {
					logger.target.debug(
						`${this.description.name}: Write:`,
						value
					)
				}

				if (withoutResponse) {
					await this.service.device.performGATTOperation(() => {
						return this._bluetoothCharacteristic.writeValueWithoutResponse(value)
					})
				}
				else {
					await this.service.device.performGATTOperation(() => {
						return this._bluetoothCharacteristic.writeValueWithResponse(value)
					})
				}

				resolve()
			}
			catch(error) {
				reject(
					new CharacteristicOperationError(
						this,
						"Cannot write value.",
						error
					)
				)
			}
		})
	}

	request(request, timeout = REQUEST_TIMEOUT) {
		return new Promise(async (resolve, reject) => {
			if (!(request instanceof Request)) {
				reject(
					new CharacteristicOperationError(
						this,
						`Argument "request" must be a valid instance of "Request". ` +
						`Got "${request?.constructor.name}".`
					)
				)

				return
			}

			if (
				timeout !== undefined &&
				timeout !== null &&
				typeof timeout !== "number"
			) {
				reject(
					new CharacteristicOperationError(
						this,
						`Argument "timeout" must be either "undefined", "null" or ` +
						`of type "number". `
					)
				)

				return
			}

			if (bluetooth.isDataTransferLoggingEnabled) {
				logger.target.debug(
					`${this.description.name}: Request:`,
					request
				)
			}

			let onResponse = response => {
				if (request.responseType.validatorFunction(response)) {
					clearTimeout(timeoutTimer)

					this.off("notification", onResponse)

					resolve(new request.responseType(response.data))
				}
			}

			this.on("notification", onResponse)

			if (timeout) {
				var timeoutTimer = setTimeout(() => {
					this.off("notification", onResponse)

					reject(
						new NotificationTimeoutError(
							`Did not receive an expected notification ` +
							`from the device within ${timeout} ms.`
						)
					)
				}, timeout)
			}

			this.write(request.data)
			.catch(error => {
				clearTimeout(timeoutTimer)

				this.off("notification", onResponse)

				reject(
					new CharacteristicOperationError(
						this,
						"Cannot request from characteristic.",
						error
					)
				)
			})
		})
	}

	requestAll(requests, timeout = REQUEST_TIMEOUT) {
		return new Promise(async (resolve, reject) => {
			if (
				!isArray(requests) ||
				!requests.every(request => request instanceof Request)
			) {
				reject(
					new CharacteristicOperationError(
						this,
						`Argument "requests" must be an array of instances of "Request".`
					)
				)

				return
			}

			if (
				timeout !== undefined &&
				timeout !== null &&
				typeof timeout !== "number"
			) {
				reject(
					new CharacteristicOperationError(
						this,
						`Argument "timeout" must be either "undefined", "null" or ` +
						`of type "number". `
					)
				)

				return
			}

			try {
				let responses = []

				for (const request of requests) {
					responses.push(await this.request(request, timeout))
				}

				resolve(responses)
			}
			catch(error) {
				reject(error)
			}
		})
	}

	startListeningForNotifications() {
		return new Promise(async (resolve, reject) => {
			if (!this.properties.notify) {
				reject(
					new CharacteristicOperationError(
						this,
						"Cannot start listening to a non-notifying characteristic."
					)
				)

				return
			}

			try {
				await this.service.device.performGATTOperation(() => {
					return this._bluetoothCharacteristic.startNotifications()
				})

				this._bluetoothCharacteristic.addEventListener(
					"characteristicvaluechanged",
					this.#onNotification.bind(this)
				)

				this.properties.isListening = true

				logger.debug("Started listening for notifications.", this)

				resolve()
			}
			catch(error) {
				reject(
					new CharacteristicOperationError(
						this,
						"Cannot start listening to characteristic.",
						error
					)
				)
			}
		})
	}

	stopListeningForNotifications() {
		return new Promise(async (resolve, reject) => {
			if (!this.properties.isListening) {
				reject(
					new CharacteristicOperationError(
						this,
						"Cannot stop listening to a characteristic that is not yet listened to."
					)
				)

				return
			}

			try {
				await this.service.device.performGATTOperation(() => {
					return this._bluetoothCharacteristic.stopNotifications()
				})

				this._bluetoothCharacteristic.removeEventListener(
					"characteristicvaluechanged",
					this.#onNotification.bind(this)
				)

				this.properties.isListening = false

				logger.debug("Stopped listening for notifications.", this)

				resolve()
			}
			catch(error) {
				reject(
					new CharacteristicOperationError(
						this,
						"Cannot stop listening to characteristic.",
						error
					)
				)
			}
		})
	}

	#onNotification() {
		this.emit("notification", new this.responseType(this.value))
	}
}

const REQUEST_TIMEOUT = 5000

class CharacteristicProperties {
	read
	write
	writeWithoutResponse
	notify

	constructor(bluetoothCharacteristicProperties) {
		this.read = bluetoothCharacteristicProperties.read
		this.write = bluetoothCharacteristicProperties.write
		this.writeWithoutResponse = bluetoothCharacteristicProperties.writeWithoutResponse
		this.notify = bluetoothCharacteristicProperties.notify

		if (this.notify) {
			this.isListening = false
		}
	}

	get string() {
		return this.toString()
	}

	toString() {
		let indicators = [
			this.read ? "R" : "-",
			this.write ? "W" : "-",
			this.writeWithoutResponse ? "w" : "-",
			this.notify ? "N" : "-"
		]

		return indicators.join("")
	}
}

class CharacteristicOperationError extends BluError {
	characteristic

	constructor(characteristic, message, underlyingError) {
		super(message, underlyingError)

		this.characteristic = characteristic
	}
}

class NotificationTimeoutError extends BluError {}