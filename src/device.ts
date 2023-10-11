import bluetooth from "./bluetooth"
import BluCharacteristic from "./characteristic"
import configuration from "./configuration"
import {
	BluCharacteristicDescription,
	BluDescriptorDescription,
	BluServiceDescription,
} from "./descriptions"
import BluDescriptor from "./descriptor"
import {
	BluDeviceConnectionError,
	BluDeviceConstructionError,
	BluDeviceProtocolDiscoveryError,
	BluDeviceProtocolMatchingError,
	BluGATTOperationError,
	BluGATTOperationQueueError,
	DeviceOperationError,
} from "./errors"
import { BluEventEmitter, BluEvents } from "./eventEmitter"
import BluGATTOperationQueue from "./gattOperationQueue"
import logger from "./logger"
import BluService from "./service"
import isArray from "./utils/isArray"

/**
 * Bluetooth device.
 * @public
 */
export default class BluDevice extends BluEventEmitter<BluDeviceEvents> {
	/**
	 * The description of the device's protocol.
	 * @remarks Meant to be overridden by class extensions to define their
	 *  respective protocol.
	 * @readonly
	 * @virtual
	 */
	static readonly protocol: BluServiceDescription[] = []

	/**
	 * The device's UUID.
	 * @readonly
	 * @sealed
	 */
	readonly id: string

	/**
	 * The device's name.
	 * @defaultValue Unnamed Device
	 * @readonly
	 * @sealed
	 */
	readonly name: string = "Unnamed Device"

	/**
	 * The device's discovered services.
	 * @readonly
	 * @sealed
	 */
	readonly services: BluService[] = []

	/**
	 * The device's underlying {@link https://developer.mozilla.org/en-US/docs/Web/API/Web_Bluetooth_API | Web Bluetooth API} object.
	 * @readonly
	 * @sealed
	 */
	readonly _bluetoothDevice: BluetoothDevice

	/**
	 * The device's GATT operation queue.
	 * @remarks Used to prevent simultaneous GATT operations by queueing them.
	 */
	#gattOperationQueue = new BluGATTOperationQueue()

	/**
	 * Will the device disconnect shortly?
	 * @remarks Used for identifying intentional disconnection events.
	 */
	#willDisconnect = false

	/**
	 * Construct a Bluetooth device.
	 * @param bluetoothDevice - The device's object from the {@link https://developer.mozilla.org/en-US/docs/Web/API/Web_Bluetooth_API | Web Bluetooth API}.
	 */
	constructor(bluetoothDevice: BluetoothDevice) {
		super()

		if (!bluetoothDevice.gatt) {
			throw new BluDeviceConstructionError(
				`Argument "bluetoothDevice" must be an instance of ` +
					`"BluetoothDevice".`,
				"GATT server not available.",
			)
		}

		if (
			!isArray(configuration.options.deviceType.protocol) ||
			configuration.options.deviceType.protocol.some(
				element => !(element instanceof BluServiceDescription),
			)
		) {
			throw new BluDeviceConstructionError(
				`Your configured "Device.protocol" is invalid. ` +
					`It must be an array of instances of "ServiceDescription".`,
			)
		}

		this.id = bluetoothDevice.id
		if (bluetoothDevice.name) this.name = bluetoothDevice.name

		this._bluetoothDevice = bluetoothDevice

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
	}

	/**
	 * The device's discovered characteristics.
	 * @readonly
	 * @sealed
	 */
	get characteristics() {
		const characteristics: BluCharacteristic[] = []

		for (const service of this.services) {
			for (const characteristic of service.characteristics) {
				characteristics.push(characteristic)
			}
		}

		return characteristics
	}

	/**
	 * Is the device connected?
	 * @readonly
	 * @sealed
	 */
	get isConnected() {
		return this._bluetoothDevice.gatt!.connected
	}

	/**
	 * Function that is invoked when the device is about to become ready to use.
	 * @remarks Can be used to execute asynchronous tasks, like reading or
	 *  writing, before the device is deemed ready to use. Meant to be
	 *  overridden by class extensions.
	 * @virtual
	 */
	beforeReady(): void | Promise<void> {
		return
	}

	/**
	 * Connect the device.
	 * @remarks Connection time depends on the protocol size, as well as the
	 *  time it takes to settle all `beforeReady` tasks across the
	 *  protocol.
	 * @throws A {@link DeviceOperationError} when connecting is not possible.
	 * @throws A {@link BluDeviceConnectionError} when the connection attempt
	 *  failed.
	 * @sealed
	 */
	async connect() {
		if (this.isConnected) {
			throw new DeviceOperationError(
				this,
				"Cannot connect a device that is already connected.",
			)
		}

		try {
			await this._bluetoothDevice.gatt!.connect()
		} catch (error) {
			throw new BluDeviceConnectionError(
				this,
				"Could not connect the device.",
				error,
			)
		}

		try {
			await this.#discoverProtocol()

			this._bluetoothDevice.ongattserverdisconnected = () => {
				this.#onDisconnected()
			}

			await this.beforeReady()

			this.emit("connected")
		} catch (error) {
			throw new BluDeviceConnectionError(
				this,
				"Could not connect the device.",
				error,
			)
		}
	}

	/**
	 * Disconnect the device.
	 * @throws A {@link DeviceOperationError} when disconnecting is not
	 *  possible.
	 * @throws A {@link BluDeviceConnectionError} when the disconnection attempt
	 *  failed.
	 * @sealed
	 */
	disconnect() {
		if (!this.isConnected) {
			throw new DeviceOperationError(
				this,
				"Cannot disconnect a device that is not connected.",
			)
		}

		this.#willDisconnect = true

		try {
			this._bluetoothDevice.gatt!.disconnect()
		} catch (error) {
			this.#willDisconnect = false

			throw new BluDeviceConnectionError(
				this,
				"Could not disconnect the device.",
				error,
			)
		}

		this.#willDisconnect = false
	}

	/**
	 * Perform a GATT operation on this device.
	 * @remarks Queues the GATT operation and waits for it to resolve.
	 * @typeParam ResultType - The type of the expected result.
	 * @param operation - The GATT operation.
	 * @returns The result of the GATT operation.
	 * @throws A {@link BluGATTOperationQueueError} when invalid arguments were
	 *  provided.
	 * @throws A {@link BluGATTOperationError} when the GATT operation fails.
	 * @sealed
	 */
	performGATTOperation<ResultType>(operation: () => Promise<ResultType>) {
		return this.#gattOperationQueue.add<ResultType>(operation)
	}

	/**
	 * Discover the device's Bluetooth protocol.
	 * @remarks Discovers and initializes all services, characteristics and
	 *  descriptors. Adds properties to {@link BluDevice} for all identifiable
	 *  services. Adds properties to all {@link BluService}s for all identifiable
	 *  characteristics. Adds properties to all {@link BluCharacteristic}s for all
	 *  identifiable descriptors. Depending on the Blu configuration,
	 *  auto-listens to any notifiable characteristics. Invokes all
	 *  `beforeReady` functions across the whole protocol and waits for them
	 *  to be settled.
	 * @throws A {@link BluDeviceProtocolDiscoveryError} when discovering the
	 *  device's Bluetooth protocol is not possible.
	 * @throws A {@link BluDeviceProtocolMatchingError} when the device's
	 *  Bluetooth protocol does not match expectations, depending on the device
	 *  protocol matching type set in the Blu configuration.
	 */
	async #discoverProtocol() {
		try {
			let protocolIncomplete = false
			let characteristicPropertyMismatch = false

			// Discover described services.

			for (const serviceDescription of configuration.options.deviceType
				.protocol) {
				let service: BluService | undefined

				try {
					service = new serviceDescription.type({
						device: this,
						bluetoothService:
							await this._bluetoothDevice.gatt!.getPrimaryService(
								serviceDescription.uuid,
							),
						description: serviceDescription,
					})

					if (service.description.identifier) {
						Object.defineProperty(
							this,
							service.description.identifier,
							{ value: service, writable: false },
						)
					}

					this.services.push(service)
				} catch (error) {
					protocolIncomplete = true

					logger.warn(
						`Could not discover "${serviceDescription.name}" ` +
							`(${serviceDescription.uuid}).`,
						this,
					)
				}

				if (service) {
					// Discover described characteristics.

					for (const characteristicDescription of serviceDescription.characteristics) {
						let characteristic: BluCharacteristic | undefined

						try {
							characteristic = new characteristicDescription.type(
								{
									service,
									bluetoothCharacteristic:
										await service._bluetoothService.getCharacteristic(
											characteristicDescription.uuid,
										),
									description: characteristicDescription,
								},
							)

							if (!characteristic.hasExpectedProperties) {
								characteristicPropertyMismatch = true

								logger.warn(
									`"${characteristicDescription.name}" ` +
										`(${characteristicDescription.uuid}) ` +
										`has unexpected properties. Expected ` +
										`"${characteristicDescription.expectedProperties}" ` +
										`but got "${characteristic.properties.toString()}".`,
									this,
								)
							}

							if (characteristic.description.identifier) {
								Object.defineProperty(
									service,
									characteristic.description.identifier,
									{ value: characteristic, writable: false },
								)
							}

							service.characteristics.push(characteristic)
						} catch (error) {
							protocolIncomplete = true

							logger.warn(
								`Could not discover "${characteristicDescription.name}" ` +
									`(${characteristicDescription.uuid}) ` +
									`in "${serviceDescription.name}" ` +
									`(${serviceDescription.uuid}).`,
								this,
							)
						}

						if (characteristic) {
							// Discover described descriptors.

							for (const descriptorDescription of characteristicDescription.descriptors) {
								let descriptor: BluDescriptor | undefined

								try {
									descriptor = new descriptorDescription.type(
										{
											characteristic,
											bluetoothDescriptor:
												await characteristic._bluetoothCharacteristic.getDescriptor(
													descriptorDescription.uuid,
												),
											description: descriptorDescription,
										},
									)

									if (descriptor.description.identifier) {
										Object.defineProperty(
											characteristic,
											descriptor.description.identifier,
											{
												value: descriptor,
												writable: false,
											},
										)
									}

									characteristic.descriptors.push(descriptor)
								} catch (error) {
									protocolIncomplete = true

									logger.warn(
										`Could not discover "${descriptorDescription.name}" ` +
											`(${descriptorDescription.uuid}) ` +
											`in "${characteristicDescription.name}" ` +
											`(${characteristicDescription.uuid}).`,
										this,
									)
								}
							}
						}
					}
				}
			}

			// Check for protocol mismatches.

			let protocolMismatch = false

			switch (configuration.options.deviceProtocolMatching) {
				case "default":
					protocolMismatch =
						protocolIncomplete || characteristicPropertyMismatch
					break
				case "minimal":
					protocolMismatch = protocolIncomplete
			}

			if (protocolMismatch) {
				throw new BluDeviceProtocolMatchingError(
					this,
					"The device's Bluetooth protocol does not match " +
						"expectations. Make sure that your device's service " +
						"descriptions are correct or change Blu's device " +
						"protocol matching type.",
				)
			}

			// Discover additional services.

			const _services =
				await this._bluetoothDevice.gatt!.getPrimaryServices()

			for (const _service of _services) {
				const service = new BluService({
					device: this,
					bluetoothService: _service,
					description: new BluServiceDescription({
						uuid: _service.uuid,
					}),
				})

				if (
					this.services.find(knownService => {
						return knownService.uuid === service.uuid
					}) === undefined
				) {
					this.services.push(service)
				}

				// Discover additional characteristics.

				const _characteristics =
					await service._bluetoothService.getCharacteristics()

				for (const _characteristic of _characteristics) {
					const characteristic = new BluCharacteristic({
						service,
						bluetoothCharacteristic: _characteristic,
						description: new BluCharacteristicDescription({
							uuid: _characteristic.uuid,
						}),
					})

					if (
						service.characteristics.find(knownCharacteristic => {
							return (
								knownCharacteristic.uuid === characteristic.uuid
							)
						}) === undefined
					) {
						service.characteristics.push(characteristic)
					}

					// Discover additional descriptors.

					let _descriptors: BluetoothRemoteGATTDescriptor[]

					try {
						_descriptors =
							await characteristic._bluetoothCharacteristic.getDescriptors()
					} catch (error) {
						if (
							error instanceof Error &&
							error.name === "NotFoundError"
						) {
							_descriptors = []
						} else {
							throw new BluDeviceProtocolDiscoveryError(
								this,
								`Could not discover descriptors of ` +
									`characteristic with UUID ` +
									`"${characteristic.uuid}".`,
								error,
							)
						}
					}

					for (const _descriptor of _descriptors) {
						const descriptor = new BluDescriptor({
							characteristic,
							bluetoothDescriptor: _descriptor,
							description: new BluDescriptorDescription({
								uuid: _descriptor.uuid,
							}),
						})

						if (
							characteristic.descriptors.find(knownDescriptor => {
								return knownDescriptor.uuid === descriptor.uuid
							}) === undefined
						) {
							characteristic.descriptors.push(descriptor)
						}
					}
				}
			}

			// Initialize services, characteristics and descriptors.

			for (const service of this.services) {
				for (const characteristic of service.characteristics) {
					if (
						characteristic.properties.notify &&
						configuration.options.autoEnableNotifications
					) {
						// Automatically listen to notifiable characteristics.
						await characteristic.startListeningForNotifications()
					}

					for (const descriptor of characteristic.descriptors) {
						await descriptor.beforeReady()
					}

					await characteristic.beforeReady()
				}

				await service.beforeReady()
			}
		} catch (error) {
			throw new BluDeviceProtocolDiscoveryError(
				this,
				"Could not discover the device's Bluetooth protocol.",
				error,
			)
		}
	}

	/**
	 * Event handler that is invoked whenever the device has been disconnected.
	 */
	#onDisconnected() {
		if (this.#willDisconnect) {
			// Intentional disconnect.
			this.emit("disconnected")
		} else {
			// Unintentional disconnect.
			this.emit("connection-lost")
		}
	}
}

/**
 * Device events.
 * @sealed
 * @public
 */
export interface BluDeviceEvents extends BluEvents {
	/**
	 * The device has been connected.
	 * @eventProperty
	 */
	connected: () => void

	/**
	 * The device's connection has been lost.
	 * @eventProperty
	 */
	"connection-lost": () => void

	/**
	 * The device has been disconnected.
	 * @eventProperty
	 */
	disconnected: () => void
}
