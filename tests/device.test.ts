import { describe, expect, it, vi } from "vitest"
import configuration from "../src/configuration"
import {
	BluCharacteristicDescription,
	BluDescriptorDescription,
	BluServiceDescription,
} from "../src/descriptions"
import BluDevice, {
	BluDeviceAdvertisedEvent,
	BluDeviceConnectionEvent,
} from "../src/device"
import BluDeviceAdvertisement from "../src/device-advertisement"
import {
	BluDeviceAdvertisementReportingError,
	BluDeviceConnectionError,
	BluDeviceConstructionError,
	BluDeviceOperationError,
	BluEnvironmentError,
} from "../src/errors"
import {
	FakeBluetoothDevice,
	FakeGATTCharacteristic,
	FakeGATTDescriptor,
	FakeGATTServer,
	FakeGATTService,
} from "./helpers/fake-bluetooth"

function makeBluetoothDevice(options?: {
	services?: FakeGATTService[]
	connected?: boolean
	name?: string
	supportsWatchAdvertisements?: boolean
}) {
	const gatt = new FakeGATTServer({
		services: options?.services,
		connected: options?.connected,
	})

	return new FakeBluetoothDevice({
		name: options?.name,
		gatt,
		supportsWatchAdvertisements: options?.supportsWatchAdvertisements,
	})
}

describe("BluDevice", () => {
	describe("construction", () => {
		it("throws when the GATT server is unavailable", () => {
			expect(
				() => new BluDevice(new FakeBluetoothDevice({ gatt: null })),
			).toThrow(BluDeviceConstructionError)
		})

		it("throws when the interface description is invalid", () => {
			class InvalidDevice extends BluDevice {
				static override readonly interface = [{} as never]
			}

			expect(() => new InvalidDevice(makeBluetoothDevice())).toThrow(
				BluDeviceConstructionError,
			)
		})

		it("exposes its id, name and defaults", () => {
			const device = new BluDevice(
				makeBluetoothDevice({ name: "Sensor" }),
			)

			expect(device.id).toBe("fake-device-id")
			expect(device.name).toBe("Sensor")
			expect(device.services).toEqual([])
			expect(device.characteristics).toEqual([])
			expect(device.isConnected).toBe(false)
			expect(device.beforeReady()).toBeUndefined()
		})

		it("falls back to a default name", () => {
			const device = new BluDevice(makeBluetoothDevice())

			expect(device.name).toBe("Unnamed Device")
		})
	})

	describe("connect", () => {
		it("connects and emits a connected event", async () => {
			const device = new BluDevice(makeBluetoothDevice())

			const listener = vi.fn()
			device.on("connected", listener)

			await device.connect()

			expect(device.isConnected).toBe(true)
			expect(listener).toHaveBeenCalledTimes(1)
		})

		it("connects without logging when logging is disabled", async () => {
			configuration.set({ logging: false })

			const device = new BluDevice(makeBluetoothDevice())

			await device.connect()

			expect(device.isConnected).toBe(true)
		})

		it("rejects when the GATT server fails to connect", async () => {
			const bluetoothDevice = makeBluetoothDevice()
			bluetoothDevice.gatt!.connectError = new Error("nope")

			const device = new BluDevice(bluetoothDevice)

			await expect(device.connect()).rejects.toBeInstanceOf(
				BluDeviceConnectionError,
			)
		})

		it("rejects when the GATT server is unavailable", async () => {
			const bluetoothDevice = makeBluetoothDevice()
			const device = new BluDevice(bluetoothDevice)
			bluetoothDevice.gatt = undefined

			await expect(device.connect()).rejects.toBeInstanceOf(
				BluDeviceConnectionError,
			)
		})

		it("rejects when `beforeReady` throws", async () => {
			class FailingDevice extends BluDevice {
				override beforeReady() {
					throw new Error("nope")
				}
			}

			const device = new FailingDevice(makeBluetoothDevice())

			await expect(device.connect()).rejects.toBeInstanceOf(
				BluDeviceConnectionError,
			)
			expect(device.isConnected).toBe(false)
		})

		it("rejects and ignores a late connection on timeout", async () => {
			vi.useFakeTimers()

			class TimeoutDevice extends BluDevice {}
			configuration.set({
				devices: [{ type: TimeoutDevice, connectionTimeout: 1000 }],
			})

			const bluetoothDevice = makeBluetoothDevice()
			const gatt = bluetoothDevice.gatt!

			let resolveConnect: (server: FakeGATTServer) => void = () =>
				undefined
			gatt.connect = (() =>
				new Promise<FakeGATTServer>((resolve) => {
					resolveConnect = resolve
				})) as typeof gatt.connect

			const device = new TimeoutDevice(bluetoothDevice)

			const promise = device.connect()
			const assertion = expect(promise).rejects.toBeInstanceOf(
				BluDeviceConnectionError,
			)

			await vi.advanceTimersByTimeAsync(1000)
			resolveConnect(gatt)

			await assertion
			await vi.runAllTimersAsync()
		})

		it("rejects and ignores a late interface discovery on timeout", async () => {
			vi.useFakeTimers()

			class SlowDiscoveryDevice extends BluDevice {
				static override readonly interface = [
					new BluServiceDescription({
						uuid: "180a",
						name: "Device Information",
					}),
				]
			}
			configuration.set({
				devices: [
					{ type: SlowDiscoveryDevice, connectionTimeout: 1000 },
				],
			})

			const bluetoothDevice = makeBluetoothDevice({
				services: [new FakeGATTService({ uuid: "180a" })],
			})
			const gatt = bluetoothDevice.gatt!

			let resolveDiscovery: () => void = () => undefined
			const getPrimaryService = gatt.getPrimaryService.bind(gatt)
			gatt.getPrimaryService = ((uuid) =>
				new Promise((resolve) => {
					resolveDiscovery = () => resolve(getPrimaryService(uuid))
				})) as typeof gatt.getPrimaryService

			const device = new SlowDiscoveryDevice(bluetoothDevice)

			const promise = device.connect()
			const assertion = expect(promise).rejects.toBeInstanceOf(
				BluDeviceConnectionError,
			)

			await vi.advanceTimersByTimeAsync(1000)
			await assertion

			// Completing discovery after the timeout was reached must be
			// ignored.
			resolveDiscovery()
			await vi.runAllTimersAsync()
		})
	})

	describe("disconnect", () => {
		it("throws when not connected", () => {
			const device = new BluDevice(makeBluetoothDevice())

			expect(() => device.disconnect()).toThrow(BluDeviceOperationError)
		})

		it("disconnects and emits a disconnected event", async () => {
			const device = new BluDevice(makeBluetoothDevice())

			await device.connect()

			const listener = vi.fn()
			device.on("disconnected", listener)

			device.disconnect()

			expect(device.isConnected).toBe(false)
			expect(listener).toHaveBeenCalledTimes(1)
		})

		it("throws when the underlying disconnect fails", async () => {
			const bluetoothDevice = makeBluetoothDevice()
			const device = new BluDevice(bluetoothDevice)

			await device.connect()

			bluetoothDevice.gatt!.disconnect = () => {
				throw new Error("nope")
			}

			expect(() => device.disconnect()).toThrow(BluDeviceConnectionError)
		})

		it("emits a connection-lost event on an unexpected disconnect", async () => {
			const bluetoothDevice = makeBluetoothDevice()
			const device = new BluDevice(bluetoothDevice)

			await device.connect()

			const listener = vi.fn()
			device.on("connection-lost", listener)

			bluetoothDevice.gatt!.disconnect()

			expect(listener).toHaveBeenCalledTimes(1)
		})

		it("disconnects without logging", async () => {
			configuration.set({ logging: false })

			const device = new BluDevice(makeBluetoothDevice())
			await device.connect()
			device.disconnect()

			expect(device.isConnected).toBe(false)
		})

		it("reports a lost connection without logging", async () => {
			configuration.set({ logging: false })

			const bluetoothDevice = makeBluetoothDevice()
			const device = new BluDevice(bluetoothDevice)
			await device.connect()

			bluetoothDevice.gatt!.disconnect()

			expect(device.isConnected).toBe(false)
		})
	})

	describe("interface discovery", () => {
		function makeInterfaceDevice() {
			const descriptor = new FakeGATTDescriptor({ uuid: "2901" })
			const characteristic = new FakeGATTCharacteristic({
				uuid: "2a29",
				properties: { read: true, notify: true },
				descriptors: [descriptor],
			})
			const service = new FakeGATTService({
				uuid: "180a",
				characteristics: [characteristic],
			})

			return makeBluetoothDevice({ services: [service] })
		}

		class InterfaceDevice extends BluDevice {
			static override readonly interface = [
				new BluServiceDescription({
					uuid: "180a",
					identifier: "deviceInformation",
					name: "Device Information",
					characteristicDescriptions: [
						new BluCharacteristicDescription({
							uuid: "2a29",
							identifier: "manufacturerName",
							name: "Manufacturer Name",
							expectedProperties: { read: true, notify: true },
							descriptorDescriptions: [
								new BluDescriptorDescription({
									uuid: "2901",
									identifier: "userDescription",
									name: "User Description",
								}),
							],
						}),
					],
				}),
			]
		}

		it("discovers services, characteristics and descriptors", async () => {
			const device = new InterfaceDevice(makeInterfaceDevice())

			await device.connect()

			expect(device.services).toHaveLength(1)

			const characteristic = device.characteristics[0]
			expect(characteristic?.uuid).toBe("2a29")
			expect(characteristic?.descriptors[0]?.uuid).toBe("2901")

			// Notifications are enabled automatically by default.
			expect(characteristic?.properties.isListening).toBe(true)
		})

		it("discovers multiple services and descriptors", async () => {
			class MultiDevice extends BluDevice {
				static override readonly interface = [
					new BluServiceDescription({
						uuid: "180a",
						name: "Device Information",
						characteristicDescriptions: [
							new BluCharacteristicDescription({
								uuid: "2a29",
								name: "Manufacturer Name",
								descriptorDescriptions: [
									new BluDescriptorDescription({
										uuid: "2901",
										name: "User Description",
									}),
									new BluDescriptorDescription({
										uuid: "2902",
										name: "Client Configuration",
									}),
								],
							}),
						],
					}),
					new BluServiceDescription({
						uuid: "180f",
						name: "Battery",
					}),
				]
			}

			const characteristic = new FakeGATTCharacteristic({
				uuid: "2a29",
				descriptors: [
					new FakeGATTDescriptor({ uuid: "2901" }),
					new FakeGATTDescriptor({ uuid: "2902" }),
				],
			})
			const services = [
				new FakeGATTService({
					uuid: "180a",
					characteristics: [characteristic],
				}),
				new FakeGATTService({ uuid: "180f" }),
			]

			const device = new MultiDevice(makeBluetoothDevice({ services }))

			await device.connect()

			expect(device.services).toHaveLength(2)
			expect(device.characteristics[0]?.descriptors).toHaveLength(2)
		})

		it("rejects when a required characteristic is missing", async () => {
			class CharacteristicDevice extends BluDevice {
				static override readonly interface = [
					new BluServiceDescription({
						uuid: "180a",
						name: "Device Information",
						characteristicDescriptions: [
							new BluCharacteristicDescription({
								uuid: "2a29",
								name: "Manufacturer Name",
							}),
						],
					}),
				]
			}

			configuration.set({
				devices: [
					{
						type: CharacteristicDevice,
						interfaceDiscoveryAttempts: 1,
					},
				],
			})

			// The service is present, but the required characteristic is not.
			const device = new CharacteristicDevice(
				makeBluetoothDevice({
					services: [new FakeGATTService({ uuid: "180a" })],
				}),
			)

			await expect(device.connect()).rejects.toBeInstanceOf(
				BluDeviceConnectionError,
			)
		})

		it("rejects when a required descriptor is missing", async () => {
			class DescriptorDevice extends BluDevice {
				static override readonly interface = [
					new BluServiceDescription({
						uuid: "180a",
						name: "Device Information",
						characteristicDescriptions: [
							new BluCharacteristicDescription({
								uuid: "2a29",
								name: "Manufacturer Name",
								descriptorDescriptions: [
									new BluDescriptorDescription({
										uuid: "2901",
										name: "User Description",
									}),
								],
							}),
						],
					}),
				]
			}

			configuration.set({
				devices: [
					{ type: DescriptorDevice, interfaceDiscoveryAttempts: 1 },
				],
			})

			// The characteristic is present, but the required descriptor is not.
			const device = new DescriptorDevice(
				makeBluetoothDevice({
					services: [
						new FakeGATTService({
							uuid: "180a",
							characteristics: [
								new FakeGATTCharacteristic({ uuid: "2a29" }),
							],
						}),
					],
				}),
			)

			await expect(device.connect()).rejects.toBeInstanceOf(
				BluDeviceConnectionError,
			)
		})

		it("warns about unexpected characteristic properties", async () => {
			class UnexpectedDevice extends BluDevice {
				static override readonly interface = [
					new BluServiceDescription({
						uuid: "180a",
						name: "Device Information",
						characteristicDescriptions: [
							new BluCharacteristicDescription({
								uuid: "2a29",
								name: "Manufacturer Name",
								expectedProperties: { write: true },
							}),
						],
					}),
				]
			}

			const characteristic = new FakeGATTCharacteristic({
				uuid: "2a29",
				properties: { read: true },
			})
			const service = new FakeGATTService({
				uuid: "180a",
				characteristics: [characteristic],
			})

			const device = new UnexpectedDevice(
				makeBluetoothDevice({ services: [service] }),
			)

			await device.connect()

			expect(console.warn).toHaveBeenCalled()
		})

		it("tolerates a missing optional service", async () => {
			class OptionalDevice extends BluDevice {
				static override readonly interface = [
					new BluServiceDescription({
						uuid: "180a",
						name: "Device Information",
						optional: true,
					}),
				]
			}

			const device = new OptionalDevice(makeBluetoothDevice())

			await device.connect()

			expect(device.isConnected).toBe(true)
			expect(device.services).toEqual([])
		})

		it("rejects when a required endpoint is missing", async () => {
			class RequiredDevice extends BluDevice {
				static override readonly interface = [
					new BluServiceDescription({
						uuid: "180a",
						name: "Device Information",
					}),
				]
			}

			configuration.set({
				devices: [
					{ type: RequiredDevice, interfaceDiscoveryAttempts: 1 },
				],
			})

			const device = new RequiredDevice(makeBluetoothDevice())

			await expect(device.connect()).rejects.toBeInstanceOf(
				BluDeviceConnectionError,
			)
		})

		it("retries discovery before succeeding", async () => {
			class RetryDevice extends BluDevice {
				static override readonly interface = [
					new BluServiceDescription({
						uuid: "180a",
						name: "Device Information",
					}),
				]
			}

			configuration.set({
				devices: [
					{ type: RetryDevice, interfaceDiscoveryAttemptDelay: 0 },
				],
			})

			const bluetoothDevice = makeBluetoothDevice({
				services: [new FakeGATTService({ uuid: "180a" })],
			})
			const gatt = bluetoothDevice.gatt!

			let attempts = 0
			const getPrimaryService = gatt.getPrimaryService.bind(gatt)
			gatt.getPrimaryService = (async (uuid) => {
				attempts++

				if (attempts === 1) {
					throw new Error("transient")
				}

				return getPrimaryService(uuid)
			}) as typeof gatt.getPrimaryService

			const device = new RetryDevice(bluetoothDevice)

			await device.connect()

			expect(device.services).toHaveLength(1)
			expect(attempts).toBe(2)
		})

		it("warns and retries across multiple attempts", async () => {
			class MultiRetryDevice extends BluDevice {
				static override readonly interface = [
					new BluServiceDescription({
						uuid: "180a",
						name: "Device Information",
					}),
				]
			}

			configuration.set({
				devices: [
					{
						type: MultiRetryDevice,
						interfaceDiscoveryAttempts: 3,
						interfaceDiscoveryAttemptDelay: 0,
					},
				],
			})

			const bluetoothDevice = makeBluetoothDevice({
				services: [new FakeGATTService({ uuid: "180a" })],
			})
			const gatt = bluetoothDevice.gatt!

			let attempts = 0
			const getPrimaryService = gatt.getPrimaryService.bind(gatt)
			gatt.getPrimaryService = (async (uuid) => {
				attempts++

				if (attempts < 3) {
					throw new Error("transient")
				}

				return getPrimaryService(uuid)
			}) as typeof gatt.getPrimaryService

			const device = new MultiRetryDevice(bluetoothDevice)

			await device.connect()

			expect(device.services).toHaveLength(1)
			expect(attempts).toBe(3)
		})

		it("discovers additional endpoints extensively", async () => {
			class ExtensiveDevice extends BluDevice {}

			configuration.set({
				devices: [
					{
						type: ExtensiveDevice,
						interfaceExtensiveDiscovery: true,
					},
				],
			})

			const characteristic = new FakeGATTCharacteristic({
				uuid: "2a29",
				descriptors: [
					new FakeGATTDescriptor({ uuid: "2901" }),
					new FakeGATTDescriptor({ uuid: "2902" }),
				],
			})
			const service = new FakeGATTService({
				uuid: "180a",
				characteristics: [
					characteristic,
					new FakeGATTCharacteristic({ uuid: "2a2a" }),
				],
			})

			const device = new ExtensiveDevice(
				makeBluetoothDevice({ services: [service] }),
			)

			await device.connect()

			expect(device.services).toHaveLength(1)
			expect(device.characteristics).toHaveLength(2)
			expect(device.characteristics[0]?.descriptors).toHaveLength(2)
		})

		it("does not duplicate described endpoints during extensive discovery", async () => {
			class ExtensiveDescribedDevice extends BluDevice {
				static override readonly interface = [
					new BluServiceDescription({
						uuid: "180a",
						name: "Device Information",
						characteristicDescriptions: [
							new BluCharacteristicDescription({
								uuid: "2a29",
								name: "Manufacturer Name",
								descriptorDescriptions: [
									new BluDescriptorDescription({
										uuid: "2901",
										name: "User Description",
									}),
								],
							}),
						],
					}),
				]
			}

			configuration.set({
				devices: [
					{
						type: ExtensiveDescribedDevice,
						interfaceExtensiveDiscovery: true,
					},
				],
			})

			const descriptor = new FakeGATTDescriptor({ uuid: "2901" })
			const characteristic = new FakeGATTCharacteristic({
				uuid: "2a29",
				descriptors: [descriptor],
			})
			const service = new FakeGATTService({
				uuid: "180a",
				characteristics: [characteristic],
			})

			const device = new ExtensiveDescribedDevice(
				makeBluetoothDevice({ services: [service] }),
			)

			await device.connect()

			// The described endpoints are not added again during extensive
			// discovery.
			expect(device.services).toHaveLength(1)
			expect(device.characteristics).toHaveLength(1)
			expect(device.characteristics[0]?.descriptors).toHaveLength(1)
		})

		it("rejects when extensive descriptor discovery fails", async () => {
			class ExtensiveDevice extends BluDevice {}

			configuration.set({
				devices: [
					{
						type: ExtensiveDevice,
						interfaceExtensiveDiscovery: true,
						interfaceDiscoveryAttempts: 1,
					},
				],
			})

			const characteristic = new FakeGATTCharacteristic({ uuid: "2a29" })
			characteristic.getDescriptorError = new Error("nope")
			const service = new FakeGATTService({
				uuid: "180a",
				characteristics: [characteristic],
			})

			const device = new ExtensiveDevice(
				makeBluetoothDevice({ services: [service] }),
			)

			await expect(device.connect()).rejects.toBeInstanceOf(
				BluDeviceConnectionError,
			)
		})

		it("enables notifications selectively by identifier", async () => {
			class SelectiveDevice extends BluDevice {
				static override readonly interface = [
					new BluServiceDescription({
						uuid: "180a",
						name: "Service",
						characteristicDescriptions: [
							new BluCharacteristicDescription({
								uuid: "2a29",
								identifier: "enabled",
								name: "Enabled",
							}),
							new BluCharacteristicDescription({
								uuid: "2a2a",
								identifier: "disabled",
								name: "Disabled",
							}),
						],
					}),
				]
			}

			configuration.set({
				devices: [
					{
						type: SelectiveDevice,
						automaticallyEnableNotifications: ["enabled"],
					},
				],
			})

			const service = new FakeGATTService({
				uuid: "180a",
				characteristics: [
					new FakeGATTCharacteristic({
						uuid: "2a29",
						properties: { notify: true },
					}),
					new FakeGATTCharacteristic({
						uuid: "2a2a",
						properties: { notify: true },
					}),
				],
			})

			const device = new SelectiveDevice(
				makeBluetoothDevice({ services: [service] }),
			)

			await device.connect()

			const enabled = device.characteristics.find(
				(characteristic) => characteristic.uuid === "2a29",
			)
			const disabled = device.characteristics.find(
				(characteristic) => characteristic.uuid === "2a2a",
			)

			expect(enabled?.properties.isListening).toBe(true)
			expect(disabled?.properties.isListening).toBe(false)
		})

		it("does not enable notifications when disabled", async () => {
			class QuietDevice extends BluDevice {
				static override readonly interface = [
					new BluServiceDescription({
						uuid: "180a",
						name: "Service",
						characteristicDescriptions: [
							new BluCharacteristicDescription({
								uuid: "2a29",
								name: "Notifiable",
							}),
						],
					}),
				]
			}

			configuration.set({
				devices: [
					{
						type: QuietDevice,
						automaticallyEnableNotifications: false,
					},
				],
			})

			const service = new FakeGATTService({
				uuid: "180a",
				characteristics: [
					new FakeGATTCharacteristic({
						uuid: "2a29",
						properties: { notify: true },
					}),
				],
			})

			const device = new QuietDevice(
				makeBluetoothDevice({ services: [service] }),
			)

			await device.connect()

			expect(device.characteristics[0]?.properties.isListening).toBe(
				false,
			)
		})

		it("discovers a full interface without logging", async () => {
			configuration.set({ logging: false })

			class QuietInterfaceDevice extends BluDevice {
				static override readonly interface = [
					new BluServiceDescription({
						uuid: "180a",
						name: "Device Information",
						characteristicDescriptions: [
							new BluCharacteristicDescription({
								uuid: "2a29",
								name: "Manufacturer Name",
								expectedProperties: { write: true },
								descriptorDescriptions: [
									new BluDescriptorDescription({
										uuid: "2901",
										name: "User Description",
									}),
								],
							}),
						],
					}),
				]
			}

			// The actual properties differ from the expected ones, which
			// triggers the unexpected-properties branch with logging disabled.
			const characteristic = new FakeGATTCharacteristic({
				uuid: "2a29",
				properties: { read: true, notify: true },
				descriptors: [new FakeGATTDescriptor({ uuid: "2901" })],
			})
			const service = new FakeGATTService({
				uuid: "180a",
				characteristics: [characteristic],
			})

			const device = new QuietInterfaceDevice(
				makeBluetoothDevice({ services: [service] }),
			)

			await device.connect()

			expect(device.isConnected).toBe(true)
			expect(device.characteristics[0]?.descriptors).toHaveLength(1)
		})

		it("skips warnings for missing optional endpoints", async () => {
			class OptionalEndpointDevice extends BluDevice {
				static override readonly interface = [
					new BluServiceDescription({
						uuid: "180a",
						name: "Device Information",
						characteristicDescriptions: [
							new BluCharacteristicDescription({
								uuid: "2a29",
								name: "Missing Characteristic",
								optional: true,
							}),
							new BluCharacteristicDescription({
								uuid: "2a2a",
								name: "Present Characteristic",
								descriptorDescriptions: [
									new BluDescriptorDescription({
										uuid: "2901",
										name: "Missing Descriptor",
										optional: true,
									}),
								],
							}),
						],
					}),
				]
			}

			// The optional characteristic 2a29 and the optional descriptor 2901
			// are absent, so their warnings must be skipped silently.
			const service = new FakeGATTService({
				uuid: "180a",
				characteristics: [new FakeGATTCharacteristic({ uuid: "2a2a" })],
			})

			const device = new OptionalEndpointDevice(
				makeBluetoothDevice({ services: [service] }),
			)

			await device.connect()

			expect(device.isConnected).toBe(true)
		})

		it("warns about a required characteristic in an optional service", async () => {
			class OptionalServiceDevice extends BluDevice {
				static override readonly interface = [
					new BluServiceDescription({
						uuid: "180a",
						name: "Device Information",
						optional: true,
						characteristicDescriptions: [
							new BluCharacteristicDescription({
								uuid: "2a29",
								name: "Manufacturer Name",
							}),
						],
					}),
				]
			}

			configuration.set({
				devices: [
					{
						type: OptionalServiceDevice,
						interfaceDiscoveryAttempts: 1,
					},
				],
			})

			// The optional service is present, but its required characteristic
			// is not.
			const device = new OptionalServiceDevice(
				makeBluetoothDevice({
					services: [new FakeGATTService({ uuid: "180a" })],
				}),
			)

			await expect(device.connect()).rejects.toBeInstanceOf(
				BluDeviceConnectionError,
			)
		})

		it("tolerates duplicate described endpoints", async () => {
			class DuplicateDevice extends BluDevice {
				static override readonly interface = [
					new BluServiceDescription({
						uuid: "180a",
						name: "Device Information",
						characteristicDescriptions: [
							new BluCharacteristicDescription({
								uuid: "2a29",
								name: "Manufacturer Name",
								descriptorDescriptions: [
									new BluDescriptorDescription({
										uuid: "2901",
										name: "User Description",
									}),
									new BluDescriptorDescription({
										uuid: "2901",
										name: "Duplicate Descriptor",
									}),
								],
							}),
							new BluCharacteristicDescription({
								uuid: "2a29",
								name: "Duplicate Characteristic",
							}),
						],
					}),
					new BluServiceDescription({
						uuid: "180a",
						name: "Duplicate Service",
					}),
				]
			}

			const characteristic = new FakeGATTCharacteristic({
				uuid: "2a29",
				descriptors: [new FakeGATTDescriptor({ uuid: "2901" })],
			})
			const service = new FakeGATTService({
				uuid: "180a",
				characteristics: [characteristic],
			})

			const device = new DuplicateDevice(
				makeBluetoothDevice({ services: [service] }),
			)

			await device.connect()

			expect(device.services).toHaveLength(1)
			expect(device.characteristics).toHaveLength(1)
			expect(device.characteristics[0]?.descriptors).toHaveLength(1)
		})

		it("ignores endpoints returned more than once during extensive discovery", async () => {
			class ExtensiveDuplicateDevice extends BluDevice {}

			configuration.set({
				devices: [
					{
						type: ExtensiveDuplicateDevice,
						interfaceExtensiveDiscovery: true,
					},
				],
			})

			const descriptor = new FakeGATTDescriptor({ uuid: "2901" })
			const characteristic = new FakeGATTCharacteristic({
				uuid: "2a29",
				descriptors: [descriptor],
			})
			// Return the same endpoints twice to exercise the de-duplication.
			characteristic.getDescriptors = async () => [descriptor, descriptor]
			const service = new FakeGATTService({
				uuid: "180a",
				characteristics: [characteristic],
			})
			service.getCharacteristics = async () => [
				characteristic,
				characteristic,
			]

			const device = new ExtensiveDuplicateDevice(
				makeBluetoothDevice({ services: [service] }),
			)

			await device.connect()

			expect(device.characteristics).toHaveLength(1)
			expect(device.characteristics[0]?.descriptors).toHaveLength(1)
		})

		it("retries and rejects without logging", async () => {
			class QuietFailingDevice extends BluDevice {
				static override readonly interface = [
					new BluServiceDescription({
						uuid: "180a",
						name: "Device Information",
					}),
				]
			}

			configuration.set({
				logging: false,
				devices: [
					{
						type: QuietFailingDevice,
						interfaceDiscoveryAttempts: 2,
						interfaceDiscoveryAttemptDelay: 0,
					},
				],
			})

			const device = new QuietFailingDevice(makeBluetoothDevice())

			await expect(device.connect()).rejects.toBeInstanceOf(
				BluDeviceConnectionError,
			)
		})

		it("rejects missing required endpoints without logging", async () => {
			class QuietRequiredDevice extends BluDevice {
				static override readonly interface = [
					new BluServiceDescription({
						uuid: "180a",
						name: "Service A",
						characteristicDescriptions: [
							new BluCharacteristicDescription({
								uuid: "2a29",
								name: "Missing Characteristic",
							}),
						],
					}),
					new BluServiceDescription({
						uuid: "180f",
						name: "Service B",
						characteristicDescriptions: [
							new BluCharacteristicDescription({
								uuid: "2a19",
								name: "Present Characteristic",
								descriptorDescriptions: [
									new BluDescriptorDescription({
										uuid: "2901",
										name: "Missing Descriptor",
									}),
								],
							}),
						],
					}),
				]
			}

			configuration.set({
				logging: false,
				devices: [
					{
						type: QuietRequiredDevice,
						interfaceDiscoveryAttempts: 1,
					},
				],
			})

			const services = [
				// The required characteristic 2a29 is absent.
				new FakeGATTService({ uuid: "180a" }),
				// The required descriptor 2901 is absent.
				new FakeGATTService({
					uuid: "180f",
					characteristics: [
						new FakeGATTCharacteristic({ uuid: "2a19" }),
					],
				}),
			]

			const device = new QuietRequiredDevice(
				makeBluetoothDevice({ services }),
			)

			await expect(device.connect()).rejects.toBeInstanceOf(
				BluDeviceConnectionError,
			)
		})
	})

	describe("advertisement reporting", () => {
		it("throws when reporting is unsupported", async () => {
			const device = new BluDevice(makeBluetoothDevice())

			await expect(
				device.startReportingAdvertisements(),
			).rejects.toBeInstanceOf(BluEnvironmentError)
		})

		it("reports advertisements and emits advertised events", async () => {
			const bluetoothDevice = makeBluetoothDevice({
				supportsWatchAdvertisements: true,
			})
			const device = new BluDevice(bluetoothDevice)

			await device.startReportingAdvertisements()

			const listener = vi.fn()
			device.on("advertised", listener)

			bluetoothDevice.dispatchEvent(new Event("advertisementreceived"))

			expect(listener).toHaveBeenCalledTimes(1)

			const event = listener.mock
				.calls[0]?.[0] as BluDeviceAdvertisedEvent
			expect(event.advertisement).toBeInstanceOf(BluDeviceAdvertisement)
		})

		it("throws when reporting fails", async () => {
			const bluetoothDevice = makeBluetoothDevice({
				supportsWatchAdvertisements: true,
			})
			bluetoothDevice.watchAdvertisementsError = new Error("nope")

			const device = new BluDevice(bluetoothDevice)

			await expect(
				device.startReportingAdvertisements(),
			).rejects.toBeInstanceOf(BluDeviceAdvertisementReportingError)
		})

		it("stops reporting advertisements", async () => {
			const bluetoothDevice = makeBluetoothDevice({
				supportsWatchAdvertisements: true,
			})
			const device = new BluDevice(bluetoothDevice)

			await device.startReportingAdvertisements()

			expect(() => device.stopReportingAdvertisements()).not.toThrow()
		})

		it("throws when stopping while not reporting", () => {
			const device = new BluDevice(
				makeBluetoothDevice({ supportsWatchAdvertisements: true }),
			)

			expect(() => device.stopReportingAdvertisements()).toThrow(
				BluDeviceOperationError,
			)
		})

		it("throws when stopping after the controller was aborted", async () => {
			const bluetoothDevice = makeBluetoothDevice({
				supportsWatchAdvertisements: true,
			})
			const device = new BluDevice(bluetoothDevice)

			await device.startReportingAdvertisements()
			device.stopReportingAdvertisements()

			expect(() => device.stopReportingAdvertisements()).toThrow(
				BluDeviceOperationError,
			)
		})
	})

	describe("performGATTOperation", () => {
		it("delegates to the GATT operation queue", async () => {
			const device = new BluDevice(makeBluetoothDevice())

			await expect(
				device.performGATTOperation(async () => 42),
			).resolves.toBe(42)
		})
	})

	describe("BluDeviceConnectionEvent", () => {
		it("carries the device and event type", () => {
			const device = new BluDevice(makeBluetoothDevice())
			const event = new BluDeviceConnectionEvent("connected", device)

			expect(event.type).toBe("connected")
			expect(event.device).toBe(device)
		})
	})
})
