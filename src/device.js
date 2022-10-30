const logger = require("./logger.js")
const configuration = require("./configuration.js")
const bluetooth = require("./bluetooth.js")

const Service = require("./service.js")
const Characteristic = require("./characteristic.js")
const Descriptor = require("./descriptor.js")
const GATTOperationQueue = require("./gattOperationQueue.js")
const {
	ServiceDescription,
	CharacteristicDescription,
	DescriptorDescription
} = require("./descriptions.js")

const BluError = require("../utils/bluError.js")
const EventEmitter = require("../utils/eventEmitter.js")

class Device extends EventEmitter {
	id
	name
	properties
	services = []
	serviceDescriptions = []

	_bluetoothDevice

	#gattOperationQueue = new GATTOperationQueue()
	#willDisconnect = false

	constructor(bluetoothDevice) {
		super(true)

		this.id = bluetoothDevice.id
		this.name = bluetoothDevice.name

		this._bluetoothDevice = bluetoothDevice

		this.addChannel("advertised")
		this.addChannel("connected")
		this.addChannel("connection-lost")
		this.addChannel("disconnected")

		this.#initialize()
	}

	get characteristics() {
		let characteristics = []

		for (const service of this.services) {
			characteristics.push(...service.characteristics)
		}

		return characteristics
	}

	get isConnected() {
		return this._bluetoothDevice.gatt.connected
	}

	async onceReady() {}

	connect() {
		return new Promise(async (resolve, reject) => {
			try {
				await this._bluetoothDevice.gatt.connect()
			}
			catch(error) {
				reject(
					new DeviceConnectionError(
						"Could not connect to device.",
						error
					)
				)

				return
			}

			try {
				await this.#discoverBluetoothInterface()

				this._bluetoothDevice.addEventListener(
					"gattserverdisconnected",
					this.#onDisconnected.bind(this),
					{ once: true }
				)

				this._bluetoothDevice.addEventListener(
					"gattserverdisconnected",
					this.#onConnectionLost.bind(this),
					{ once: true }
				)

				await this.onceReady()

				this.emit("connected")

				resolve()
			}
			catch(error) {
				reject(error)
			}
		})
	}

	disconnect() {
		return new Promise(async (resolve, reject) => {
			this.#willDisconnect = true

			try {
				await this._bluetoothDevice.gatt.disconnect()

				resolve()
			}
			catch(error) {
				reject(
					new DeviceConnectionError(
						"Could not disconnect from device.",
						error
					)
				)
			}

			this.#willDisconnect = false
		})
	}

	performGATTOperation(callback) {
		return this.#gattOperationQueue.await(callback)
	}

	async #initialize() {
		this.on("connected", () => {
			logger.log("Connected.", this)
			bluetooth.emit("device-connected", this)
		})

		this.on("connection-lost", () => {
			logger.warn("Connection lost.", this)
			bluetooth.emit("device-connection-lost", this)
		})

		this.on("disconnected", () => {
			logger.log("Disconnected.", this)
			bluetooth.emit("device-disconnected", this)
		})

		if (typeof this._bluetoothDevice.watchAdvertisements === "function") {
			// Experimental feature.
			// Compatibility: https://developer.mozilla.org/en-US/docs/Web/API/BluetoothDevice#browser_compatibility

			try {
				this._bluetoothDevice.addEventListener("advertisementreceived", event => {
					// TODO: Create custom event.
					this.emit("advertised", event)
				})

				await this._bluetoothDevice.watchAdvertisements()
			}
			catch(error) {
				logger.warn(
					new DeviceOperationError(
						"Could not start watching for advertisements.",
						error
					)
				)
			}
		}
	}

	async #discoverBluetoothInterface() {
		return new Promise(async (resolve, reject) => {
			try {
				let interfaceIncomplete = false

				for (const serviceDescription of this.serviceDescriptions) {
					let service

					try {
						service = new serviceDescription.type(
							this,
							await this._bluetoothDevice.gatt.getPrimaryService(
								serviceDescription.uuid
							),
							serviceDescription
						)

						if (service.description.identifier) {
							this[service.description.identifier] = service
						}

						this.services.push(service)
					}
					catch(error) {
						interfaceIncomplete = true

						logger.warn(
							`Could not discover "${serviceDescription.name}" ` +
							`(${serviceDescription.uuid}).`,
							this
						)
					}

					if (service) {
						for (const characteristicDescription of serviceDescription.characteristics) {
							let characteristic

							try {
								characteristic = new characteristicDescription.type(
									service,
									await service._bluetoothService.getCharacteristic(
										characteristicDescription.uuid
									),
									characteristicDescription
								)

								if (characteristic.description.identifier) {
									service[characteristic.description.identifier] = characteristic
								}

								service.characteristics.push(characteristic)
							}
							catch(error) {
								interfaceIncomplete = true

								logger.warn(
									`Could not discover "${characteristicDescription.name}" ` +
									`(${characteristicDescription.uuid}) ` +
									`in "${serviceDescription.name}" ` +
									`(${serviceDescription.uuid}).`,
									this
								)
							}

							if (characteristic) {
								for (const descriptorDescription of characteristicDescription.descriptors) {
									let descriptor

									try {
										descriptor = new descriptorDescription.type(
											characteristic,
											await characteristic._bluetoothCharacteristic.getDescriptor(
												descriptorDescription.uuid
											),
											descriptorDescription
										)

										if (descriptor.description.identifier) {
											characteristic[descriptor.description.identifier] = descriptor
										}

										characteristic.descriptors.push(descriptor)
									}
									catch(error) {
										interfaceIncomplete = true

										logger.warn(
											`Could not discover "${descriptorDescription.name}" ` +
											`(${descriptorDescription.uuid}) ` +
											`in "${characteristicDescription.name}" ` +
											`(${characteristicDescription.uuid}).`,
											this
										)
									}
								}
							}
						}
					}
				}

				if (configuration.ensureCompleteDeviceBluetoothInterface && interfaceIncomplete) {
					throw new DeviceBluetoothInterfaceIncompleteError(
						`The device’s Bluetooth interface is incomplete. ` +
						`Make sure that your service descriptions are correct or configure ` +
						`Blu to ignore incomplete device Bluetooth interfaces by setting the ` +
						`configuration property "ensureCompleteDeviceBluetoothInterface" ` +
						`to "false" before calling "device.connect()".`
					)
				}

				let services = await this._bluetoothDevice.gatt.getPrimaryServices()

				for (let service of services) {
					service = new Service(
						this,
						service,
						new ServiceDescription(service.uuid)
					)

					if (
						!this.services.find(describedService => {
							return describedService.uuid === service.uuid
						})
					) {
						this.services.push(service)
					}

					let characteristics = await service._bluetoothService.getCharacteristics()

					for (let characteristic of characteristics) {
						characteristic = new Characteristic(
							service,
							characteristic,
							new CharacteristicDescription(characteristic.uuid)
						)

						if (
							!service.characteristics.find(describedCharacteristic => {
								return describedCharacteristic.uuid === characteristic.uuid
							})
						) {
							service.characteristics.push(characteristic)
						}

						try {
							var descriptors = await characteristic._bluetoothCharacteristic.getDescriptors()
						}
						catch(error) {
							if (error.name === "NotFoundError") {
								descriptors = []
							}
							else {
								throw new DescriptorDiscoveryError(
									`Could not discover descriptors of characteristic with UUID ` +
									`"${characteristic.uuid}".`,
									error
								)
							}
						}

						for (let descriptor of descriptors) {
							descriptor = new Descriptor(
								characteristic,
								descriptor,
								new DescriptorDescription(descriptor.uuid)
							)

							if (
								!characteristic.descriptors.find(describedDescriptor => {
									return describedDescriptor.uuid === descriptor.uuid
								})
							) {
								characteristic.descriptors.push(descriptor)
							}
						}
					}
				}

				const { autoListenToNotifiableCharacteristics } = require("./configuration.js")

				for (const service of this.services) {
					for (const characteristic of service.characteristics) {
						if (
							characteristic.properties.notify &&
							autoListenToNotifiableCharacteristics
						) {
							await characteristic.startListeningForNotifications()
						}

						for (const descriptor of characteristic.descriptors) {
							await descriptor.onceReady()
						}

						await characteristic.onceReady()
					}

					await service.onceReady()
				}

				resolve()
			}
			catch(error) {
				reject(
					new DeviceBluetoothInterfaceDiscoveryError(
						"Could not discover the device’s Bluetooth interface.",
						error
					)
				)
			}
		})
	}

	#onConnectionLost() {
		if (this.#willDisconnect) {
			return
		}

		this.emit("connection-lost")
	}

	#onDisconnected() {
		this.emit("disconnected")
	}
}

class DeviceOperationError extends BluError {}
class DeviceConnectionError extends BluError {}
class DeviceBluetoothInterfaceDiscoveryError extends BluError {}
class DeviceBluetoothInterfaceIncompleteError extends BluError {}
class DescriptorDiscoveryError extends BluError {}

module.exports = Device