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
 * Characteristic error.
 * @public
 */
export class BluCharacteristicError extends BluError {
	/**
	 * The characteristic that this error belongs to.
	 */
	readonly characteristic: BluCharacteristic

	/**
	 * Construct a characteristic error.
	 * @param characteristic - The characteristic that this error belongs to.
	 * @param message - The error message.
	 * @param underlyingErrors - A collection of any underlying
	 *  errors.
	 */
	constructor(
		characteristic: BluCharacteristic,
		message: string,
		...underlyingErrors: unknown[]
	) {
		super(message, ...underlyingErrors)

		this.characteristic = characteristic
	}
}

/**
 * Characteristic operation error.
 * @sealed
 * @public
 */
export class BluCharacteristicOperationError extends BluCharacteristicError {
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
			characteristic,
			`${characteristic.service.device.name} \u2192 ` +
				`${characteristic.service.description.name} \u2192 ` +
				`${characteristic.description.name}: ${message}`,
			...underlyingErrors,
		)
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
 * Descriptor error.
 * @public
 */
export class BluDescriptorError extends BluError {
	/**
	 * The descriptor that this error belongs to.
	 */
	readonly descriptor: BluDescriptor

	/**
	 * Construct a descriptor error.
	 * @param descriptor - The descriptor that this error belongs to.
	 * @param message - The error message.
	 * @param underlyingErrors - A collection of any underlying
	 *  errors.
	 */
	constructor(
		descriptor: BluDescriptor,
		message: string,
		...underlyingErrors: unknown[]
	) {
		super(message, ...underlyingErrors)

		this.descriptor = descriptor
	}
}

/**
 * Descriptor operation error.
 * @sealed
 * @public
 */
export class BluDescriptorOperationError extends BluDescriptorError {
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
			descriptor,
			`${descriptor.characteristic.service.device.name} \u2192 ` +
				`${descriptor.characteristic.service.description.name} \u2192 ` +
				`${descriptor.characteristic.description.name} \u2192 ` +
				`${descriptor.description.name}: ${message}`,
			...underlyingErrors,
		)
	}
}

// Device

/**
 * Device error.
 * @public
 */
export class BluDeviceError extends BluError {
	/**
	 * The device that this error belongs to.
	 */
	device: BluDevice

	/**
	 * Construct a device error.
	 * @param device - The device that the error belongs to.
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
 * Device construction error.
 * @sealed
 * @public
 */
export class BluDeviceConstructionError extends BluDeviceError {}

/**
 * Device operation error.
 * @sealed
 * @public
 */
export class BluDeviceOperationError extends BluDeviceError {}

/**
 * Device connection error.
 * @sealed
 * @public
 */
export class BluDeviceConnectionError extends BluDeviceError {}

/**
 * Device connection timeout error.
 * @sealed
 * @public
 */
export class BluDeviceConnectionTimeoutError extends BluDeviceError {}

/**
 * Device protocol discovery error.
 * @sealed
 * @public
 */
export class BluDeviceProtocolDiscoveryError extends BluDeviceError {}

/**
 * Device protocol matching error.
 * @sealed
 * @public
 */
export class BluDeviceProtocolMatchingError extends BluDeviceError {}

/**
 * Device advertisement reporting error.
 * @sealed
 * @public
 */
export class BluDeviceAdvertisementReportingError extends BluDeviceError {}

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

/**
 * Scanner operation error.
 * @sealed
 * @public
 */
export class BluScannerOperationError extends BluError {}

// Environment

/**
 * Environment error.
 * @sealed
 * @public
 */
export class BluEnvironmentError extends BluError {
	constructor(feature: string) {
		super(`${feature} is not supported by the current environment.`)
	}
}
