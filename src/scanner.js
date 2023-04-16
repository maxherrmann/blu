import bluetooth from "./bluetooth.js"
import configuration from "./configuration.js"

import BluError from "../utils/bluError.js"

class Scanner {
	getDevice() {
		return new Promise(async (resolve, reject) => {
			if (!bluetooth.isSupported) {
				reject(
					new BluError(
						"Blu is not compatible with this browser."
					)
				)

				return
			}

			try {
				let device = await globalThis.navigator.bluetooth.requestDevice(
					configuration.scannerConfig
				)

				device = device === undefined ? null : new configuration.deviceType(device)

				resolve(device)
			}
			catch(error) {
				if (error.name === "NotFoundError") {
					// Device chooser has been closed on the client side.
					resolve(null)
				}
				else {
					reject(
						new ScannerError("An error occurred.", error)
					)
				}
			}
		})
	}

	getPairedDevices() {
		// Experimental feature.
		// Compatibility: https://developer.mozilla.org/en-US/docs/Web/API/Bluetooth/getDevices#browser_compatibility

		return new Promise(async (resolve, reject) => {
			if (typeof globalThis.navigator?.bluetooth?.getDevices !== "function") {
				reject(
					new ScannerError(
						"This feature is not supported by this browser."
					)
				)

				return
			}

			try {
				let devices = await globalThis.navigator.bluetooth.getDevices()

				resolve(devices)
			}
			catch(error) {
				reject(
					new ScannerError("An error occurred.", error)
				)
			}
		})
	}
}

class ScannerError extends BluError {}

export default new Scanner()