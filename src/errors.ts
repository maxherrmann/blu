import type BluCharacteristic from "./characteristic"
import type BluDescriptor from "./descriptor"
import type BluDevice from "./device"

/**
 * Generic Blu error.
 * @public
 */
export class BluError extends Error {
	/**
	 * Construct a Blu error.
	 * @param message - The error message.
	 * @param underlyingErrors - A collection of any underlying
	 *  errors.
	 */
	constructor(message: string, ...underlyingErrors: unknown[]) {
		super(message)

		this.name = this.constructor.name

		for (const underlyingError of underlyingErrors) {
			if (underlyingError instanceof Error) {
				this.message +=
					`\n\u0020 \u2937 ${underlyingError.name}: ` +
					underlyingError.message
			} else if (typeof underlyingError === "string") {
				this.message += `\n\u0020 \u2937 ${underlyingError}`
			}

			if (!this.cause) {
				this.cause = underlyingError
			}
		}
	}
}

// Characteristic

/**
 * Characteristic operation error.
 * @sealed
 * @public
 */
export class BluCharacteristicOperationError extends BluError {
	/**
	 * The characteristic that threw the error.
	 */
	readonly characteristic: BluCharacteristic

	/**
	 * Construct a characteristic operation error.
	 * @param characteristic - The characteristic that throws the error.
	 * @param message - The error message.
	 * @param underlyingErrors - A collection of any underlying
	 *  errors.
	 */
	constructor(
		characteristic: BluCharacteristic,
		message: string,
		...underlyingErrors: unknown[]
	) {
		super(
			`${characteristic.service.device.name} \u2192 ` +
				`${characteristic.service.description.name} \u2192 ` +
				`${characteristic.description.name}: ${message}`,
			...underlyingErrors,
		)

		this.characteristic = characteristic
	}
}

/**
 * Characteristic notification timeout error.
 * @sealed
 * @public
 */
export class BluCharacteristicNotificationTimeoutError extends BluError {}

// Configuration

/**
 * Configuration error.
 * @sealed
 * @public
 */
export class BluConfigurationError extends BluError {}

// Description

/**
 * Description construction error.
 * @sealed
 * @public
 */
export class BluDescriptionConstructionError extends BluError {}

// Descriptor

/**
 * Description operation error.
 * @sealed
 * @public
 */
export class BluDescriptorOperationError extends BluError {
	/**
	 * The descriptor that threw the error.
	 */
	descriptor: BluDescriptor

	/**
	 * Construct a descriptor operation error.
	 * @param descriptor - The descriptor that throws the error.
	 * @param message - The error message.
	 * @param underlyingErrors - A collection of any underlying
	 *  errors.
	 */
	constructor(
		descriptor: BluDescriptor,
		message: string,
		...underlyingErrors: unknown[]
	) {
		super(
			`${descriptor.characteristic.service.device.name} \u2192 ` +
				`${descriptor.characteristic.service.description.name} \u2192 ` +
				`${descriptor.characteristic.description.name} \u2192 ` +
				`${descriptor.description.name}: ${message}`,
			...underlyingErrors,
		)

		this.descriptor = descriptor
	}
}

// Device

/**
 * Device construction error.
 * @sealed
 * @public
 */
export class BluDeviceConstructionError extends BluError {}

/**
 * Device operation error.
 * @sealed
 * @public
 */
export class DeviceOperationError extends BluError {
	/**
	 * The device that threw the error.
	 */
	device: BluDevice

	/**
	 * Construct a device operation error.
	 * @param device - The device that throws the error.
	 * @param message - The error message.
	 * @param underlyingErrors - A collection of any underlying
	 *  errors.
	 */
	constructor(
		device: BluDevice,
		message: string,
		...underlyingErrors: unknown[]
	) {
		super(`${device.name}: ${message}`, ...underlyingErrors)

		this.device = device
	}
}

/**
 * Device connection error.
 * @sealed
 * @public
 */
export class BluDeviceConnectionError extends BluError {
	/**
	 * The device that threw the error.
	 */
	device: BluDevice

	/**
	 * Construct a device connection error.
	 * @param device - The device that throws the error.
	 * @param message - The error message.
	 * @param underlyingErrors - A collection of any underlying
	 *  errors.
	 */
	constructor(
		device: BluDevice,
		message: string,
		...underlyingErrors: unknown[]
	) {
		super(`${device.name}: ${message}`, ...underlyingErrors)

		this.device = device
	}
}

/**
 * Device protocol discovery error.
 * @sealed
 * @public
 */
export class BluDeviceProtocolDiscoveryError extends BluError {
	/**
	 * The device that threw the error.
	 */
	device: BluDevice

	/**
	 * Construct a device protocol discovery error.
	 * @param device - The device that throws the error.
	 * @param message - The error message.
	 * @param underlyingErrors - A collection of any underlying
	 *  errors.
	 */
	constructor(
		device: BluDevice,
		message: string,
		...underlyingErrors: unknown[]
	) {
		super(`${device.name}: ${message}`, ...underlyingErrors)

		this.device = device
	}
}

/**
 * Device protocol matching error.
 * @sealed
 * @public
 */
export class BluDeviceProtocolMatchingError extends BluError {
	/**
	 * The device that threw the error.
	 */
	device: BluDevice

	/**
	 * Construct a device protocol matching error.
	 * @param device - The device that throws the error.
	 * @param message - The error message.
	 * @param underlyingErrors - A collection of any underlying
	 *  errors.
	 */
	constructor(
		device: BluDevice,
		message: string,
		...underlyingErrors: unknown[]
	) {
		super(`${device.name}: ${message}`, ...underlyingErrors)

		this.device = device
	}
}

// GATTOperationQueue

/**
 * GATT operation queue error.
 * @sealed
 * @public
 */
export class BluGATTOperationQueueError extends BluError {}

/**
 * GATT operation error.
 * @sealed
 * @public
 */
export class BluGATTOperationError extends BluError {}

// Logger

/**
 * Logger error.
 * @sealed
 * @public
 */
export class BluLoggerError extends BluError {}

// Request

/**
 * Request construction error.
 * @sealed
 * @public
 */
export class BluRequestConstructionError extends BluError {}

// Response

/**
 * Response construction error.
 * @sealed
 * @public
 */
export class BluResponseConstructionError extends BluError {}

// Scanner

/**
 * Scanner error.
 * @sealed
 * @public
 */
export class BluScannerError extends BluError {}
