/**
 * Blu: The type-safe framework for interacting with Bluetooth Low Energy
 * devices from the browser and Node.js.
 * @packageDocumentation
 */

import { bluetooth } from "webbluetooth"
import blu from "./index.js"

export * from "./index.js"
export { default as default } from "./index.js"

blu.configuration.useBluetoothInterface(bluetooth)
