const Device = require("./device.js")

const BluError = require("../utils/bluError.js")
const isSubclass = require("../utils/isSubclass.js")

class Configuration {
	#scannerConfig = { acceptAllDevices: true }
	#deviceType = Device
	#autoListenToNotifiableCharacteristics = true

	get scannerConfig() {
		return this.#scannerConfig
	}

	get deviceType() {
		return this.#deviceType
	}

	get autoListenToNotifiableCharacteristics() {
		return this.#autoListenToNotifiableCharacteristics
	}

	use(scannerConfig, deviceType) {
		if (scannerConfig) {
			this.useScannerConfig(scannerConfig)
		}

		if (deviceType) {
			this.useDeviceType(deviceType)
		}
	}

	useScannerConfig(scannerConfig) {
		if (typeof scannerConfig !== "object") {
			throw new BluConfigurationError(
				`Argument "scannerConfig" must be an object.`
			)
		}

		// TODO: Validate scannerConfig here once it is typed.
		// See: https://developer.mozilla.org/en-US/docs/Web/API/Bluetooth/requestDevice#parameters

		this.#scannerConfig = scannerConfig
	}

	useDeviceType(deviceType) {
		if (!isSubclass(deviceType, Device)) {
			throw new BluConfigurationError(
				`Argument "deviceType" must be ` +
				`a class that is or extends "Device".`
			)
		}

		this.#deviceType = deviceType
	}

	setAutoListenToNotifiableCharacteristics(value) {
		if (typeof value !== "boolean") {
			throw new BluConfigurationError(
				`Argument "value" must be of type "boolean".`
			)
		}

		this.#autoListenToNotifiableCharacteristics = value
	}
}

class BluConfigurationError extends BluError {}

module.exports = new Configuration()