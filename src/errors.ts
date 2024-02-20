import type BluCharacteristic from "./characteristic"
import type BluDescriptor from "./descriptor"
import type BluDevice from "./device"

/**
 * Generic Blu error.
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
		}
	}
}

// Characteristic

/**
 * Characteristic error.
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
 */
export class BluCharacteristicNotificationTimeoutError extends BluError {}

// Configuration

/**
 * Configuration error.
 */
export class BluConfigurationError extends BluError {}

// Interface description

/**
 * Interface description construction error.
 */
export class BluInterfaceDescriptionConstructionError extends BluError {}

// Descriptor

/**
 * Descriptor error.
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
 */
export class BluDeviceConstructionError extends BluDeviceError {}

/**
 * Device operation error.
 */
export class BluDeviceOperationError extends BluDeviceError {}

/**
 * Device connection error.
 */
export class BluDeviceConnectionError extends BluDeviceError {}

/**
 * Device connection timeout error.
 */
export class BluDeviceConnectionTimeoutError extends BluDeviceError {}

/**
 * Device interface discovery error.
 */
export class BluDeviceInterfaceDiscoveryError extends BluDeviceError {}

/**
 * Device interface matching error.
 */
export class BluDeviceInterfaceMatchingError extends BluDeviceError {}

/**
 * Device advertisement reporting error.
 */
export class BluDeviceAdvertisementReportingError extends BluDeviceError {}

// GATTOperationQueue

/**
 * GATT operation queue error.
 */
export class BluGATTOperationQueueError extends BluError {}

/**
 * GATT operation error.
 */
export class BluGATTOperationError extends BluError {}

// Request

/**
 * Request construction error.
 */
export class BluRequestConstructionError extends BluError {}

// Response

/**
 * Response construction error.
 */
export class BluResponseConstructionError extends BluError {}

// Scanner

/**
 * Scanner error.
 */
export class BluScannerError extends BluError {}

/**
 * Scanner operation error.
 */
export class BluScannerOperationError extends BluError {}

// Environment

/**
 * Environment error.
 */
export class BluEnvironmentError extends BluError {
	constructor(feature: string) {
		super(`${feature} is not supported by the current environment.`)
	}
}
