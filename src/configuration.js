const Device = require("./device.js")

const BluError = require("../utils/bluError.js")
const isSubclass = require("../utils/isSubclass.js")

class Configuration {
	#scannerConfig
	#deviceType
	#ensureCompleteDeviceBluetoothInterface
	#autoListenToNotifiableCharacteristics

	constructor() {
		this.restoreDefaults()
	}

	get scannerConfig() {
		return this.#scannerConfig
	}

	get deviceType() {
		return this.#deviceType
	}

	get ensureCompleteDeviceBluetoothInterface() {
		return this.#ensureCompleteDeviceBluetoothInterface
	}

	get autoListenToNotifiableCharacteristics() {
		return this.#autoListenToNotifiableCharacteristics
	}

	restoreDefaults() {
		this.#scannerConfig = { acceptAllDevices: true }
		this.#deviceType = Device
		this.#ensureCompleteDeviceBluetoothInterface = true
		this.#autoListenToNotifiableCharacteristics = true
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

	set(configuration) {
		if (typeof configuration !== "object") {
			throw new BluConfigurationError(
				`Argument "configuration" must be an object.`
			)
		}

		let value

		if (value = configuration.ensureCompleteDeviceBluetoothInterface) {
			if (typeof value !== "boolean") {
				throw new BluConfigurationError(
					`Configuration property "ensureCompleteDeviceBluetoothInterface" ` +
					`must be of type "boolean".`
				)
			}

			this.#ensureCompleteDeviceBluetoothInterface = value
		}

		if (value = configuration.autoListenToNotifiableCharacteristics) {
			if (typeof value !== "boolean") {
				throw new BluConfigurationError(
					`Configuration property "autoListenToNotifiableCharacteristics" ` +
					`must be of type "boolean".`
				)
			}

			this.#autoListenToNotifiableCharacteristics = value
		}
	}
}

class BluConfigurationError extends BluError {}

module.exports = new Configuration()