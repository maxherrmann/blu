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

		if (
			Object.getOwnPropertyNames(configuration).every(propertyName => {
				return [
					"ensureCompleteDeviceBluetoothInterface",
					"autoListenToNotifiableCharacteristics"
				]
				.includes(propertyName)
			})
		) {
			if (Object.hasOwn(configuration, "ensureCompleteDeviceBluetoothInterface")) {
				if (typeof configuration.ensureCompleteDeviceBluetoothInterface !== "boolean") {
					throw new BluConfigurationError(
						`Configuration property "ensureCompleteDeviceBluetoothInterface" ` +
						`must be of type "boolean".`
					)
				}

				this.#ensureCompleteDeviceBluetoothInterface =
					configuration.ensureCompleteDeviceBluetoothInterface
			}

			if (Object.hasOwn(configuration, "autoListenToNotifiableCharacteristics")) {
				if (typeof configuration.autoListenToNotifiableCharacteristics !== "boolean") {
					throw new BluConfigurationError(
						`Configuration property "autoListenToNotifiableCharacteristics" ` +
						`must be of type "boolean".`
					)
				}

				this.#autoListenToNotifiableCharacteristics =
					configuration.autoListenToNotifiableCharacteristics
			}
		}
		else {
			throw new BluConfigurationError(
				`Argument "configuration" must contain an object with valid configuration options.`
			)
		}
	}
}

class BluConfigurationError extends BluError {}

module.exports = new Configuration()