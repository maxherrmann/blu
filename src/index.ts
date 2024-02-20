/**
 * Blu: The type-safe framework for interacting with Bluetooth Low Energy
 * devices from the web.
 * @packageDocumentation
 */

import bluetooth from "./bluetoothState"
import configuration from "./configuration"
import convert from "./converter"
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
export { default as BluDevice, BluDeviceConnectionEvent } from "./device"
export { default as BluDeviceAdvertisement } from "./deviceAdvertisement"
export * from "./errors"
export { default as BluRequest } from "./request"
export { default as BluResponse } from "./response"
export { default as scanner } from "./scanner"
export { default as BluService } from "./service"
export { default as version } from "./version"

export type * from "./bluetoothInterface"
export type * from "./bluetoothState"
export type * from "./characteristic"
export type * from "./configuration"
export type * from "./converter"
export type * from "./descriptor"
export type * from "./device"
export type * from "./eventTarget"
export type * from "./scanner"
export type * from "./service"

/**
 * Blu's default export.
 */
export default {
	bluetooth: bluetooth,
	configuration: configuration,
	convert: convert,
	scanner: scanner,
	version: version,
}
