import EventTarget, { type EventMap } from "jaset"
import type {
	BluBluetoothDevice,
	BluBluetoothRemoteGATTDescriptor,
} from "./bluetoothInterface.js"
import bluetoothState from "./bluetoothState.js"
import BluCharacteristic from "./characteristic.js"
import configuration from "./configuration.js"
import {
	BluCharacteristicDescription,
	BluDescriptorDescription,
	BluServiceDescription,
} from "./descriptions.js"
import BluDescriptor from "./descriptor.js"
import BluDeviceAdvertisement from "./deviceAdvertisement.js"
import {
	BluDeviceAdvertisementReportingError,
	BluDeviceConnectionError,
	BluDeviceConnectionTimeoutError,
	BluDeviceConstructionError,
	BluDeviceInterfaceDiscoveryError,
	BluDeviceInterfaceMatchingError,
	BluDeviceOperationError,
	BluEnvironmentError,
} from "./errors.js"
import BluGATTOperationQueue from "./gattOperationQueue.js"
import BluService from "./service.js"
import isArray from "./utils/isArray.js"

/**
 * Bluetooth device.
 */
export default class BluDevice<
	Events extends Omit<EventMap, keyof BluDeviceEvents> = Omit<
		EventMap,
		keyof BluDeviceEvents
	>,
> extends EventTarget<BluDeviceEvents & Events> {
	/**
	 * The description of the device's interface.
	 * @remarks Meant to be overridden by class extensions to define their
	 *  respective interface.
	 * @readonly
	 * @virtual
	 */
	static readonly interface: BluServiceDescription[] = []

	/**
	 * The device's UUID.
	 * @readonly
	 */
	readonly id: string

	/**
	 * The device's name.
	 * @defaultValue Unnamed Device
	 * @readonly
	 */
	readonly name: string = "Unnamed Device"

	/**
	 * The device's discovered services.
	 * @readonly
	 */
	readonly services: BluService[] = []

	/**
	 * The device's underlying Bluetooth interface endpoint.
	 * @readonly
	 */
	readonly _bluetoothDevice: BluBluetoothDevice

	/**
	 * The device's GATT operation queue.
	 * @remarks Used to prevent simultaneous GATT operations by queueing them.
	 * @readonly
	 */
	readonly #gattOperationQueue = new BluGATTOperationQueue()

	/**
	 * A controller that controls advertisement watching.
	 */
	#watchAdvertisementsController = new AbortController()

	/**
	 * Will the device disconnect shortly?
	 * @remarks Used for identifying intentional disconnection events.
	 */
	#willDisconnect = false

	/**
	 * Construct a Bluetooth device.
	 * @param bluetoothDevice - The device's underlying Bluetooth interface
	 *  endpoint.
	 */
	constructor(bluetoothDevice: BluBluetoothDevice) {
		super()

		if (!bluetoothDevice.gatt) {
			throw new BluDeviceConstructionError(
				this as never,
				"GATT server unavailable.",
			)
		}

		if (
			!isArray((this.constructor as typeof BluDevice).interface) ||
			(this.constructor as typeof BluDevice).interface.some(
				(element) => !(element instanceof BluServiceDescription),
			)
		) {
			throw new BluDeviceConstructionError(
				this as never,
				`The device's interface description is invalid. ` +
					`It must be an array of instances of "ServiceDescription".`,
			)
		}

		this.id = bluetoothDevice.id
		if (bluetoothDevice.name) this.name = bluetoothDevice.name

		this._bluetoothDevice = bluetoothDevice
	}

	/**
	 * The device's discovered characteristics.
	 * @readonly
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
	 */
	get isConnected() {
		if (this._bluetoothDevice.gatt === undefined) {
			return false
		}

		return this._bluetoothDevice.gatt.connected
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
	 * @remarks Connection time depends on the interface size, as well as the
	 *  time it takes to settle all `beforeReady` tasks across all interface
	 *  components. Connection may time out, depending on the active
	 *  {@link configuration}
	 *  (see {@link BluConfigurationOptions.deviceConnectionTimeout | `deviceConnectionTimeout` option}).
	 * @throws A {@link BluDeviceConnectionError} when the connection attempt
	 *  failed.
	 */
	async connect() {
		return new Promise<void>((resolve, reject) => {
			const timeout = configuration.options.deviceConnectionTimeout
			let timeoutTimer: ReturnType<typeof setTimeout>
			let isTimeoutReached = false

			const rejectWithError = (error: unknown) => {
				try {
					this.#removeDisconnectionEventListeners()

					if (this.isConnected) {
						this.disconnect()
					}
				} catch {
					// Ignore potential errors, as device is in an unknown state
					// and will be discarded anyways.
				}

				clearTimeout(timeoutTimer)

				reject(
					new BluDeviceConnectionError(
						this as never,
						"Could not connect the device.",
						error,
					),
				)
			}

			if (this._bluetoothDevice.gatt === undefined) {
				rejectWithError("GATT server unavailable.")

				return
			}

			if (timeout) {
				timeoutTimer = setTimeout(() => {
					rejectWithError(
						new BluDeviceConnectionTimeoutError(
							this as never,
							`Connection attempt timed out after ` +
								`${String(timeout)} ms.`,
						),
					)

					isTimeoutReached = true
				}, timeout)
			}

			if (configuration.options.logging) {
				console.log(
					`${this.name} (${this.constructor.name}): Connecting...`,
				)
			}

			this._bluetoothDevice.gatt
				.connect()
				.then(() => {
					if (isTimeoutReached) {
						return
					}

					this.#discoverInterface()
						.then(async () => {
							if (isTimeoutReached) {
								return
							}

							this._bluetoothDevice.addEventListener(
								"gattserverdisconnected",
								this.#onGATTServerDisconnected.bind(this),
								{ once: true },
							)

							this.once(
								"disconnected",
								this.#onDisconnected.bind(this),
							)
							this.once(
								"connection-lost",
								this.#onConnectionLost.bind(this),
							)

							try {
								await this.beforeReady()
							} catch (error) {
								rejectWithError(error)
								return
							}

							clearTimeout(timeoutTimer)

							if (configuration.options.logging) {
								console.log(
									`${this.name} (${this.constructor.name}): ` +
										`Connected.`,
								)
							}

							this.emit(
								new BluDeviceConnectionEvent(
									"connected",
									this as never,
								) as never,
							)

							bluetoothState.emit(
								new BluDeviceConnectionEvent(
									"connected",
									this as never,
								),
							)

							resolve()
						})
						.catch((error: unknown) => {
							rejectWithError(error)
						})
				})
				.catch((error: unknown) => {
					rejectWithError(error)
				})
		})
	}

	/**
	 * Disconnect the device.
	 * @throws A {@link BluDeviceOperationError} when disconnecting is not
	 *  possible.
	 * @throws A {@link BluDeviceConnectionError} when the disconnection attempt
	 *  failed.
	 */
	disconnect() {
		if (!this.isConnected) {
			throw new BluDeviceOperationError(
				this as never,
				"Cannot disconnect a device that is not connected.",
			)
		}

		this.#willDisconnect = true

		try {
			this._bluetoothDevice.gatt?.disconnect()
		} catch (error) {
			throw new BluDeviceConnectionError(
				this as never,
				"Could not disconnect the device.",
				error,
			)
		} finally {
			this.#willDisconnect = false
		}
	}

	/**
	 * ⚠️ Start reporting advertisements.
	 * @remarks Experimental feature. Only supported by some environments. See
	 *  the
	 *  {@link https://github.com/WebBluetoothCG/web-bluetooth/blob/main/implementation-status.md | Web Bluetooth CG's implementation status}
	 *  of `watchAdvertisements()` for details. Makes the device start emitting
	 *  {@link BluDeviceEvents.advertised | `advertised`} events.
	 * @throws A {@link BluEnvironmentError} when reporting advertisements is
	 *  not supported by the current environment.
	 * @throws A {@link BluDeviceAdvertisementReportingError} when something
	 *  went wrong.
	 */
	async startReportingAdvertisements() {
		if (typeof this._bluetoothDevice.watchAdvertisements !== "function") {
			throw new BluEnvironmentError("Advertisement reporting")
		}

		try {
			this.#watchAdvertisementsController = new AbortController()

			await this._bluetoothDevice.watchAdvertisements({
				signal: this.#watchAdvertisementsController.signal,
			})

			this._bluetoothDevice.addEventListener(
				"advertisementreceived",
				this.#onAdvertisementReceived.bind(this),
			)
		} catch (error) {
			throw new BluDeviceAdvertisementReportingError(
				this as never,
				"Could not start reporting advertisements.",
				error,
			)
		}
	}

	/**
	 * ⚠️ Stop reporting advertisements.
	 * @remarks Experimental feature. Only supported by some environments. See
	 *  the
	 *  {@link https://github.com/WebBluetoothCG/web-bluetooth/blob/main/implementation-status.md | Web Bluetooth CG's implementation status}
	 *  of `watchAdvertisements()` for details. Makes the device stop emitting
	 *  {@link BluDeviceEvents.advertised | `advertised`} events.
	 * @throws A {@link BluDeviceOperationError} when the device is not
	 *  reporting advertisements.
	 */
	stopReportingAdvertisements() {
		if (
			!this._bluetoothDevice.watchingAdvertisements ||
			this.#watchAdvertisementsController.signal.aborted
		) {
			throw new BluDeviceOperationError(
				this as never,
				"Cannot stop reporting advertisements on a device that is " +
					"not reporting advertisements.",
			)
		}

		this.#watchAdvertisementsController.abort()

		this._bluetoothDevice.removeEventListener(
			"advertisementreceived",
			this.#onAdvertisementReceived.bind(this),
		)
	}

	/**
	 * Perform a GATT operation on this device.
	 * @remarks Queues the GATT operation and waits for it to resolve. A GATT
	 *  operation times out when it takes more than 5000 milliseconds.
	 * @typeParam ResultType - The type of the expected result.
	 * @param operation - The GATT operation.
	 * @returns A `Promise` that resolves with the result of the GATT operation.
	 * @throws A {@link BluGATTOperationQueueError} when invalid arguments were
	 *  provided.
	 * @throws A {@link BluGATTOperationError} when the GATT operation fails.
	 */
	performGATTOperation<ResultType>(operation: () => Promise<ResultType>) {
		return this.#gattOperationQueue.add<ResultType>(operation)
	}

	/**
	 * Discover the device's Bluetooth interface.
	 * @remarks Discovers and initializes all services, characteristics and
	 *  descriptors. Adds properties to {@link BluDevice} for all identifiable
	 *  services. Adds properties to all {@link BluService}s for all identifiable
	 *  characteristics. Adds properties to all {@link BluCharacteristic}s for all
	 *  identifiable descriptors. Depending on the active {@link configuration}
	 *  (see {@link BluConfigurationOptions.autoEnableNotifications | `autoEnableNotifications` option}),
	 *  auto-listens to some or all notifiable characteristics. Invokes all
	 *  `beforeReady` functions across all interface components and waits for
	 *  them to be settled.
	 * @throws A {@link BluDeviceInterfaceDiscoveryError} when discovering the
	 *  device's Bluetooth interface is not possible.
	 * @throws A {@link BluDeviceInterfaceMatchingError} when the device's
	 *  Bluetooth interface does not match expectations and
	 *  {@link BluConfigurationOptions.deviceInterfaceMatching} is `true` in the
	 *  active configuration.
	 */
	async #discoverInterface() {
		try {
			let interfaceIncomplete = false

			if (!this.isConnected) {
				// Sometimes GATT server is reported as disconnected at this
				// point. If that is the case, we try to reconnect first.
				await this._bluetoothDevice.gatt?.connect()
			}

			if (this._bluetoothDevice.gatt === undefined) {
				throw new BluDeviceInterfaceDiscoveryError(
					this as never,
					"GATT server unavailable.",
				)
			}

			// Clear services.
			this.services.length = 0

			// Discover described services.

			for (const serviceDescription of (
				this.constructor as typeof BluDevice
			).interface) {
				let service: BluService | undefined

				try {
					service = new serviceDescription.type({
						device: this as never,
						bluetoothService:
							await this._bluetoothDevice.gatt.getPrimaryService(
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
				} catch {
					if (!serviceDescription.optional) {
						interfaceIncomplete = true

						if (configuration.options.logging) {
							console.warn(
								`${this.name} (${this.constructor.name}): ` +
									`Could not discover "${serviceDescription.name}" ` +
									`(UUID: ${String(serviceDescription.uuid)}).`,
							)
						}
					}
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
								if (configuration.options.logging) {
									console.warn(
										`${this.name} (${this.constructor.name}): ` +
											`"${characteristicDescription.name}" ` +
											`(${String(characteristicDescription.uuid)}) ` +
											`has unexpected properties.`,
									)
								}
							}

							if (characteristic.description.identifier) {
								Object.defineProperty(
									service,
									characteristic.description.identifier,
									{ value: characteristic, writable: false },
								)
							}

							service.characteristics.push(characteristic)
						} catch {
							if (!characteristicDescription.optional) {
								interfaceIncomplete = true

								if (configuration.options.logging) {
									console.warn(
										`${this.name} (${this.constructor.name}): ` +
											`Could not discover ` +
											`"${characteristicDescription.name}" ` +
											`(UUID: ${String(characteristicDescription.uuid)}) ` +
											`in "${serviceDescription.name}" ` +
											`(UUID: ${String(serviceDescription.uuid)}).`,
									)
								}
							}
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
								} catch {
									if (!descriptorDescription.optional) {
										interfaceIncomplete = true

										if (configuration.options.logging) {
											console.warn(
												`${this.name} (${this.constructor.name}): ` +
													`Could not discover ` +
													`"${descriptorDescription.name}" ` +
													`(UUID: ${String(descriptorDescription.uuid)}) ` +
													`in "${characteristicDescription.name}" ` +
													`(UUID: ${String(characteristicDescription.uuid)}).`,
											)
										}
									}
								}
							}
						}
					}
				}
			}

			if (
				configuration.options.deviceInterfaceMatching &&
				interfaceIncomplete
			) {
				throw new BluDeviceInterfaceMatchingError(
					this as never,
					"The device's Bluetooth interface does not match " +
						"expectations. Make sure that your device's service " +
						"descriptions are correct or change Blu's device " +
						"interface matching type.",
				)
			}

			// Discover additional services.

			const _services =
				await this._bluetoothDevice.gatt.getPrimaryServices()

			for (const _service of _services) {
				const service = new BluService({
					device: this as never,
					bluetoothService: _service,
					description: new BluServiceDescription({
						uuid: _service.uuid,
					}),
				})

				if (
					this.services.find((knownService) => {
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
						service.characteristics.find((knownCharacteristic) => {
							return (
								knownCharacteristic.uuid === characteristic.uuid
							)
						}) === undefined
					) {
						service.characteristics.push(characteristic)
					}

					// Discover additional descriptors.

					let _descriptors: BluBluetoothRemoteGATTDescriptor[]

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
							throw new BluDeviceInterfaceDiscoveryError(
								this as never,
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
							characteristic.descriptors.find(
								(knownDescriptor) => {
									return (
										knownDescriptor.uuid === descriptor.uuid
									)
								},
							) === undefined
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
						if (
							typeof configuration.options
								.autoEnableNotifications === "boolean" ||
							(characteristic.description.identifier &&
								configuration.options.autoEnableNotifications.includes(
									characteristic.description.identifier,
								))
						)
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
			throw new BluDeviceInterfaceDiscoveryError(
				this as never,
				"Could not discover the device's Bluetooth interface.",
				error,
			)
		}
	}

	/**
	 * Remove all disconnection event listeners.
	 */
	#removeDisconnectionEventListeners() {
		this._bluetoothDevice.removeEventListener(
			"gattserverdisconnected",
			this.#onGATTServerDisconnected.bind(this),
		)
		this.off("disconnected", this.#onDisconnected.bind(this))
		this.off("connection-lost", this.#onConnectionLost.bind(this))
	}

	/**
	 *  Event handler that is invoked whenever an advertisement has been
	 *  received from the device.
	 */
	#onAdvertisementReceived(event: Event) {
		this.emit(
			new BluDeviceAdvertisedEvent(
				new BluDeviceAdvertisement(event as BluetoothAdvertisingEvent),
			) as never,
		)
	}

	/**
	 * Event handler that is invoked whenever the device has been disconnected.
	 */
	#onDisconnected() {
		if (configuration.options.logging) {
			console.log(
				`${this.name} (${this.constructor.name}): Disconnected.`,
			)
		}

		bluetoothState.emit(
			new BluDeviceConnectionEvent("disconnected", this as never),
		)
	}

	/**
	 * Event handler that is invoked whenever the device's connection has been
	 * lost.
	 */
	#onConnectionLost() {
		if (configuration.options.logging) {
			console.warn(
				`${this.name} (${this.constructor.name}): Connection lost.`,
			)
		}

		bluetoothState.emit(
			new BluDeviceConnectionEvent("connection-lost", this as never),
		)
	}

	/**
	 * Event handler that is invoked whenever the device's GATT server has been
	 * disconnected.
	 */
	#onGATTServerDisconnected() {
		if (this.#willDisconnect) {
			// Intentional disconnect.
			this.emit(
				new BluDeviceConnectionEvent(
					"disconnected",
					this as never,
				) as never,
			)
		} else {
			// Unintentional disconnect.
			this.emit(
				new BluDeviceConnectionEvent(
					"connection-lost",
					this as never,
				) as never,
			)
		}

		this.#removeDisconnectionEventListeners()
	}
}

/**
 * Device advertised event.
 */
export class BluDeviceAdvertisedEvent extends Event {
	/**
	 * The advertisement.
	 */
	readonly advertisement: BluDeviceAdvertisement

	/**
	 * Construct a device advertised event.
	 * @param advertisement - The advertisement.
	 */
	constructor(advertisement: BluDeviceAdvertisement) {
		super("advertised")

		this.advertisement = advertisement
	}
}

export class BluDeviceConnectionEvent extends Event {
	/**
	 * The device.
	 * @readonly
	 */
	readonly device: BluDevice

	/**
	 * Construct a device connection event.
	 * @param type - The event type.
	 * @param device - The device.
	 */
	constructor(
		type: "connected" | "disconnected" | "connection-lost",
		device: BluDevice,
	) {
		super(type)

		this.device = device
	}
}

/**
 * Device event map.
 */
type BluDeviceEvents = EventMap<{
	/**
	 * ⚠️ An advertisement has been received from the device.
	 * @remarks Experimental feature. Only supported by some environments. See
	 *  the
	 *  {@link https://github.com/WebBluetoothCG/web-bluetooth/blob/main/implementation-status.md | Web Bluetooth CG's implementation status}
	 *  of `watchAdvertisements()` for details.
	 */
	advertised: BluDeviceAdvertisedEvent

	/**
	 * The device has been connected.
	 */
	connected: BluDeviceConnectionEvent

	/**
	 * The device has been disconnected.
	 */
	disconnected: BluDeviceConnectionEvent

	/**
	 * The device's connection has been lost.
	 */
	"connection-lost": BluDeviceConnectionEvent
}>
