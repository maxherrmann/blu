/**
 * Blu: The type-safe framework for interacting with Bluetooth Low Energy
 * devices from the web.
 * @packageDocumentation
 */

import bluetooth from "./bluetoothState.js"
import configuration from "./configuration.js"
import convert from "./converter.js"
import scanner from "./scanner.js"

export {
	BluBluetoothDisabledEvent,
	BluBluetoothEnabledEvent,
	default as bluetooth,
} from "./bluetoothState.js"
export {
	default as BluCharacteristic,
	BluCharacteristicNotificationEvent,
} from "./characteristic.js"
export { default as BluCompoundResponse } from "./compoundResponse.js"
export { default as configuration } from "./configuration.js"
export { default as convert } from "./converter.js"
export * from "./descriptions.js"
export { default as BluDescriptor } from "./descriptor.js"
export {
	default as BluDevice,
	BluDeviceAdvertisedEvent,
	BluDeviceConnectionEvent,
} from "./device.js"
export * from "./errors.js"
export { default as BluRequest } from "./request.js"
export { default as BluResponse } from "./response.js"
export { default as BluResponseThreadManager } from "./responseThreadManager.js"
export { BluScannerAdvertisementEvent, default as scanner } from "./scanner.js"
export { default as BluService } from "./service.js"

export type * from "./bluetoothInterface.js"
export type * from "./bluetoothState.js"
export type * from "./characteristic.js"
export type * from "./configuration.js"
export type * from "./converter.js"
export type * from "./descriptor.js"
export type * from "./device.js"
export type * from "./scanner.js"
export type * from "./service.js"

export default {
	bluetooth: bluetooth,
	configuration: configuration,
	convert: convert,
	scanner: scanner,
}
