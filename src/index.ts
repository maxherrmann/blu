/**
 * Blu: The type-safe framework for interacting with Bluetooth Low Energy
 * devices from the web.
 * @packageDocumentation
 */

import bluetooth from "./bluetooth"
import configuration from "./configuration"
import logger from "./logger"
import scanner from "./scanner"
import version from "./version"

export { BluBluetooth, default as bluetooth } from "./bluetooth"
export {
	default as BluCharacteristic,
	BluCharacteristicProperties,
} from "./characteristic"
export {
	BluConfiguration,
	BluConfigurationOptions,
	default as configuration,
} from "./configuration"
export * from "./descriptions"
export { default as BluDescriptor } from "./descriptor"
export { default as BluDevice } from "./device"
export * from "./errors"
export { BluLogger, default as logger } from "./logger"
export { default as BluRequest } from "./request"
export { default as BluResponse } from "./response"
export { BluScanner, default as scanner } from "./scanner"
export { default as BluService } from "./service"
export { default as version } from "./version"

/**
 * Blu's default export.
 */
export default {
	bluetooth: bluetooth,
	configuration: configuration,
	logger: logger,
	scanner: scanner,
	version: version,
}

export type { BluBluetoothEvents } from "./bluetooth"
export type { BluCharacteristicEvents } from "./characteristic"
export type { BluDescriptorEvents } from "./descriptor"
export type { BluDeviceEvents } from "./device"
export type { BluEventEmitter, eventEmitter } from "./eventEmitter"
export type { BluServiceEvents } from "./service"
