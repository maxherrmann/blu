import logger from "./logger.js"
import bluetooth from "./bluetooth.js"

import Response from "./response.js"

import BluError from "../utils/bluError.js"
import isArray from "../utils/isArray.js"
import isTypedArray from "../utils/isTypedArray.js"

export default class Descriptor {
	characteristic
	description
	responseType = Response

	_bluetoothDescriptor

	constructor(characteristic, bluetoothDescriptor, description) {
		this.characteristic = characteristic
		this.description = description

		this._bluetoothDescriptor = bluetoothDescriptor
	}

	get uuid() {
		return this._bluetoothDescriptor.uuid
	}

	get value() {
		return this._bluetoothDescriptor.value
	}

	async onceReady() {}

	readValue() {
		return new Promise(async (resolve, reject) => {
			try {
				await this.characteristic.service.device.performGATTOperation(() => {
					return this._bluetoothDescriptor.readValue()
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
					new DescriptorOperationError(
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
					new DescriptorOperationError(
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

	write(value) {
		return new Promise(async (resolve, reject) => {
			if (!isTypedArray(value)) {
				if (isArray(value)) {
					if (!value.every(entry => typeof entry === "number")) {
						reject(
							new DescriptorOperationError(
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
							new DescriptorOperationError(
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

				await this.characteristic.service.device.performGATTOperation(() => {
					return this._bluetoothDescriptor.writeValue(value)
				})

				resolve()
			}
			catch(error) {
				reject(
					new DescriptorOperationError(
						this,
						"Cannot write value.",
						error
					)
				)
			}
		})
	}
}

class DescriptorOperationError extends BluError {
	descriptor

	constructor(descriptor, message, underlyingError) {
		super(message, underlyingError)

		this.descriptor = descriptor
	}
}