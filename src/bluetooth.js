const EventEmitter = require("../utils/eventEmitter.js")

class Bluetooth extends EventEmitter {
	#connectedDevices = new Set()
	#isDataTransferLoggingEnabled = false

	constructor() {
		super(true)

		this.addChannel("bluetooth-enabled")
		this.addChannel("bluetooth-disabled")

		this.addChannel("device-connected")
		this.addChannel("device-connection-lost")
		this.addChannel("device-disconnected")

		if (this.isSupported) {
			globalThis.navigator.bluetooth.addEventListener("availabilitychanged", event => {
				this.emit(
					event.value ?
					"bluetooth-enabled" :
					"bluetooth-disabled"
				)
			})
		}

		this.on("bluetooth-disabled", () => {
			this.#connectedDevices.clear()
		})

		this.on("device-connected", device => {
			this.#connectedDevices.add(device)
		})

		this.on("device-disconnected", device => {
			this.#connectedDevices.delete(device)
		})
	}

	get isSupported() {
		return !!globalThis.navigator?.bluetooth
	}

	get isDataTransferLoggingEnabled() {
		return this.#isDataTransferLoggingEnabled
	}

	get connectedDevices() {
		return Array.from(this.#connectedDevices)
	}

	get connectedDevice() {
		return this.connectedDevices[this.connectedDevices.length - 1] ?? null
	}

	isAvailable() {
		if (!this.isSupported) {
			return false
		}

		return globalThis.navigator.bluetooth.getAvailability()
	}

	enableDataTransferLogging() {
		this.#isDataTransferLoggingEnabled = true
	}

	disableDataTransferLogging() {
		this.#isDataTransferLoggingEnabled = false
	}
}

module.exports = new Bluetooth()