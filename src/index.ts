/**
 * Blu: The type-safe framework for interacting with Bluetooth Low Energy
 * devices from the web.
 * @packageDocumentation
 */

import bluetooth from "./bluetoothState"
import configuration from "./configuration"
import convert from "./converter"
import logger from "./logger"
import scanner from "./scanner"
import version from "./version"

export { default as bluetooth } from "./bluetoothState"
export {
	default as BluCharacteristic,
	BluCharacteristicProperties,
} from "./characteristic"
export { default as configuration } from "./configuration"
export { default as convert } from "./converter"
export * from "./descriptions"
export { default as BluDescriptor } from "./descriptor"
export { default as BluDevice } from "./device"
export { default as BluDeviceAdvertisement } from "./deviceAdvertisement"
export * from "./errors"
export { default as logger } from "./logger"
export { default as BluRequest } from "./request"
export { default as BluResponse } from "./response"
export { default as scanner } from "./scanner"
export { default as BluService } from "./service"
export { default as version } from "./version"

/**
 * Blu's default export.
 */
export default {
	bluetooth: bluetooth,
	configuration: configuration,
	convert: convert,
	logger: logger,
	scanner: scanner,
	version: version,
}

export type * from "./bluetoothInterface"
export type {
	BluBluetoothState,
	BluBluetoothStateEvents,
} from "./bluetoothState"
export type { BluCharacteristicEvents } from "./characteristic"
export type { BluConfiguration, BluConfigurationOptions } from "./configuration"
export type { BluConverter } from "./converter"
export type { BluDescriptorEvents } from "./descriptor"
export type { BluDeviceEvents } from "./device"
export type { BluEventEmitter, eventEmitter } from "./eventEmitter"
export type { BluLogger } from "./logger"
export type { BluScanner, BluScannerEvents } from "./scanner"
export type { BluServiceEvents } from "./service"
