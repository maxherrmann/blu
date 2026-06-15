// A configurable in-memory fake of the Web Bluetooth interfaces that Blu
// depends on (see src/bluetooth-interface.ts). It lets the coupled classes
// (device, characteristic, service, descriptor, scanner, bluetooth-state) be
// exercised in Node without real hardware.

import type {
	BluBluetooth,
	BluBluetoothDevice,
	BluBluetoothLEScan,
	BluBluetoothRemoteGATTCharacteristic,
	BluBluetoothRemoteGATTDescriptor,
	BluBluetoothRemoteGATTServer,
	BluBluetoothRemoteGATTService,
} from "../../src/bluetooth-interface"

/**
 * Build a full set of characteristic properties, defaulting every flag to
 * `false`.
 */
export function makeProperties(
	overrides: Partial<BluetoothCharacteristicProperties> = {},
): BluetoothCharacteristicProperties {
	return {
		authenticatedSignedWrites: false,
		broadcast: false,
		indicate: false,
		notify: false,
		read: false,
		reliableWrite: false,
		writableAuxiliaries: false,
		write: false,
		writeWithoutResponse: false,
		...overrides,
	}
}

/**
 * Create a `DataView` from a list of byte values.
 */
export function bytes(...values: number[]): DataView<ArrayBuffer> {
	return new DataView(new Uint8Array(values).buffer)
}

/**
 * Convert a buffer source to a `DataView`.
 */
export function toDataView(source: BufferSource): DataView {
	if (source instanceof DataView) {
		return source
	}

	if (ArrayBuffer.isView(source)) {
		return new DataView(source.buffer, source.byteOffset, source.byteLength)
	}

	return new DataView(source)
}

export class FakeGATTDescriptor implements BluBluetoothRemoteGATTDescriptor {
	readonly uuid: string
	value?: DataView
	readError?: unknown
	writeError?: unknown
	readonly writes: BufferSource[] = []
	#nextValue?: DataView

	constructor(options: { uuid: string; value?: DataView }) {
		this.uuid = options.uuid
		this.#nextValue = options.value
	}

	async readValue(): Promise<DataView> {
		if (this.readError !== undefined) {
			throw this.readError
		}

		this.value = this.#nextValue ?? new DataView(new ArrayBuffer(0))

		return this.value
	}

	async writeValue(value: BufferSource): Promise<void> {
		if (this.writeError !== undefined) {
			throw this.writeError
		}

		this.writes.push(value)
		this.#nextValue = toDataView(value)
		this.value = this.#nextValue
	}
}

export class FakeGATTCharacteristic
	extends EventTarget
	implements BluBluetoothRemoteGATTCharacteristic
{
	readonly uuid: string
	readonly properties: BluetoothCharacteristicProperties
	value?: DataView
	notifying = false

	readError?: unknown
	writeWithResponseError?: unknown
	writeWithoutResponseError?: unknown
	startNotificationsError?: unknown
	stopNotificationsError?: unknown
	getDescriptorError?: unknown

	/**
	 * When set, a successful write emits a `characteristicvaluechanged` event
	 * with the returned value. Lets request/response flows be driven by writes.
	 */
	respondOnWrite?: (value: BufferSource) => DataView | undefined

	readonly writes: BufferSource[] = []
	readonly descriptors: Map<string, FakeGATTDescriptor>
	#nextValue?: DataView

	constructor(options: {
		uuid: string
		properties?: Partial<BluetoothCharacteristicProperties>
		value?: DataView
		descriptors?: FakeGATTDescriptor[]
	}) {
		super()

		this.uuid = options.uuid
		this.properties = makeProperties(options.properties)
		this.#nextValue = options.value
		this.value = options.value
		this.descriptors = new Map(
			(options.descriptors ?? []).map((descriptor) => [
				descriptor.uuid,
				descriptor,
			]),
		)
	}

	async getDescriptor(
		uuid: BluetoothDescriptorUUID,
	): Promise<BluBluetoothRemoteGATTDescriptor> {
		if (this.getDescriptorError !== undefined) {
			throw this.getDescriptorError
		}

		const descriptor = this.descriptors.get(String(uuid))

		if (!descriptor) {
			throw new Error(`No descriptor with UUID "${String(uuid)}".`)
		}

		return descriptor
	}

	async getDescriptors(): Promise<BluBluetoothRemoteGATTDescriptor[]> {
		if (this.getDescriptorError !== undefined) {
			throw this.getDescriptorError
		}

		return [...this.descriptors.values()]
	}

	async readValue(): Promise<DataView> {
		if (this.readError !== undefined) {
			throw this.readError
		}

		this.value = this.#nextValue ?? new DataView(new ArrayBuffer(0))

		return this.value
	}

	async writeValueWithResponse(value: BufferSource): Promise<void> {
		if (this.writeWithResponseError !== undefined) {
			throw this.writeWithResponseError
		}

		this.writes.push(value)
		this.#respond(value)
	}

	async writeValueWithoutResponse(value: BufferSource): Promise<void> {
		if (this.writeWithoutResponseError !== undefined) {
			throw this.writeWithoutResponseError
		}

		this.writes.push(value)
		this.#respond(value)
	}

	#respond(value: BufferSource): void {
		if (this.respondOnWrite === undefined) {
			return
		}

		const response = this.respondOnWrite(value)

		if (response !== undefined) {
			this.notify(response)
		}
	}

	async startNotifications(): Promise<BluBluetoothRemoteGATTCharacteristic> {
		if (this.startNotificationsError !== undefined) {
			throw this.startNotificationsError
		}

		this.notifying = true

		return this
	}

	async stopNotifications(): Promise<BluBluetoothRemoteGATTCharacteristic> {
		if (this.stopNotificationsError !== undefined) {
			throw this.stopNotificationsError
		}

		this.notifying = false

		return this
	}

	/**
	 * Emit a `characteristicvaluechanged` event with the given value.
	 */
	notify(value?: DataView): void {
		this.value = value
		this.dispatchEvent(new Event("characteristicvaluechanged"))
	}
}

export class FakeGATTService implements BluBluetoothRemoteGATTService {
	readonly uuid: string
	getCharacteristicError?: unknown
	readonly characteristics: Map<string, FakeGATTCharacteristic>

	constructor(options: {
		uuid: string
		characteristics?: FakeGATTCharacteristic[]
	}) {
		this.uuid = options.uuid
		this.characteristics = new Map(
			(options.characteristics ?? []).map((characteristic) => [
				characteristic.uuid,
				characteristic,
			]),
		)
	}

	async getCharacteristic(
		uuid: BluetoothCharacteristicUUID,
	): Promise<BluBluetoothRemoteGATTCharacteristic> {
		if (this.getCharacteristicError !== undefined) {
			throw this.getCharacteristicError
		}

		const characteristic = this.characteristics.get(String(uuid))

		if (!characteristic) {
			throw new Error(`No characteristic with UUID "${String(uuid)}".`)
		}

		return characteristic
	}

	async getCharacteristics(): Promise<
		BluBluetoothRemoteGATTCharacteristic[]
	> {
		if (this.getCharacteristicError !== undefined) {
			throw this.getCharacteristicError
		}

		return [...this.characteristics.values()]
	}
}

export class FakeGATTServer implements BluBluetoothRemoteGATTServer {
	connected: boolean
	connectError?: unknown
	getPrimaryServiceError?: unknown
	getPrimaryServicesError?: unknown
	readonly services: Map<string, FakeGATTService>
	device!: FakeBluetoothDevice

	constructor(options: {
		services?: FakeGATTService[]
		connected?: boolean
	}) {
		this.connected = options.connected ?? false
		this.services = new Map(
			(options.services ?? []).map((service) => [service.uuid, service]),
		)
	}

	async connect(): Promise<BluBluetoothRemoteGATTServer> {
		if (this.connectError !== undefined) {
			throw this.connectError
		}

		this.connected = true

		return this
	}

	disconnect(): void {
		this.connected = false
		this.device.dispatchEvent(new Event("gattserverdisconnected"))
	}

	async getPrimaryService(
		service: BluetoothServiceUUID,
	): Promise<BluBluetoothRemoteGATTService> {
		if (this.getPrimaryServiceError !== undefined) {
			throw this.getPrimaryServiceError
		}

		const found = this.services.get(String(service))

		if (!found) {
			throw new Error(`No service with UUID "${String(service)}".`)
		}

		return found
	}

	async getPrimaryServices(): Promise<BluBluetoothRemoteGATTService[]> {
		if (this.getPrimaryServicesError !== undefined) {
			throw this.getPrimaryServicesError
		}

		return [...this.services.values()]
	}
}

export class FakeBluetoothDevice
	extends EventTarget
	implements BluBluetoothDevice
{
	readonly id: string
	readonly name?: string
	gatt?: FakeGATTServer
	watchingAdvertisements?: boolean
	watchAdvertisements?: (
		options?: WatchAdvertisementsOptions,
	) => Promise<void>
	watchAdvertisementsError?: unknown

	constructor(options: {
		id?: string
		name?: string
		gatt?: FakeGATTServer | null
		supportsWatchAdvertisements?: boolean
	}) {
		super()

		this.id = options.id ?? "fake-device-id"
		this.name = options.name

		if (options.gatt !== null) {
			this.gatt = options.gatt ?? new FakeGATTServer({})
			this.gatt.device = this
		}

		if (options.supportsWatchAdvertisements) {
			this.watchingAdvertisements = false
			this.watchAdvertisements = async () => {
				if (this.watchAdvertisementsError !== undefined) {
					throw this.watchAdvertisementsError
				}

				this.watchingAdvertisements = true
			}
		}
	}
}

export class FakeBluetooth extends EventTarget implements BluBluetooth {
	available = true
	requestDeviceResult?: FakeBluetoothDevice
	requestDeviceError?: unknown
	requestLEScanError?: unknown
	readonly devices: FakeBluetoothDevice[] = []
	leScan: BluBluetoothLEScan = { stop: () => undefined }
	getDevices?: () => Promise<BluBluetoothDevice[]>
	requestLEScan?: (
		options?: BluetoothLEScanOptions,
	) => Promise<BluBluetoothLEScan>

	constructor(
		options: {
			supportsGetDevices?: boolean
			supportsRequestLEScan?: boolean
		} = {},
	) {
		super()

		if (options.supportsGetDevices ?? true) {
			this.getDevices = async () => this.devices
		}

		if (options.supportsRequestLEScan ?? true) {
			this.requestLEScan = async () => {
				if (this.requestLEScanError !== undefined) {
					throw this.requestLEScanError
				}

				return this.leScan
			}
		}
	}

	getAvailability = async (): Promise<boolean> => {
		return this.available
	}

	requestDevice = async (): Promise<BluBluetoothDevice> => {
		if (this.requestDeviceError !== undefined) {
			throw this.requestDeviceError
		}

		if (!this.requestDeviceResult) {
			throw new Error("No device to return.")
		}

		return this.requestDeviceResult
	}
}
