const bluetooth = require("./bluetooth.js")

const BluError = require("../utils/bluError.js")

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
				const { scannerConfig, deviceType } = require("./configuration.js")

				let device = await globalThis.navigator.bluetooth.requestDevice(scannerConfig)

				device = device === undefined ? null : new deviceType(device)

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

module.exports = new Scanner()