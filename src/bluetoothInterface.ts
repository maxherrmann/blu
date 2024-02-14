/**
 * The Web Bluetooth `Bluetooth` interface required by Blu.
 * @remarks Based on
 *  {@link https://developer.mozilla.org/en-US/docs/Web/API/Bluetooth}.
 *
 *  **Must** dispatch `availabilitychanged` events.
 * @public
 */
export interface BluBluetooth extends EventTarget {
	getAvailability: () => Promise<boolean>
	requestDevice: (
		options?: RequestDeviceOptions,
	) => Promise<BluBluetoothDevice>
	getDevices?: () => Promise<BluBluetoothDevice[]>
	requestLEScan?: (
		options?: BluetoothLEScanOptions,
	) => Promise<BluBluetoothLEScan>
}

/**
 * The Web Bluetooth `BluetoothDevice` interface required by Blu.
 * @remarks Based on
 *  {@link https://developer.mozilla.org/en-US/docs/Web/API/BluetoothDevice}.
 *
 *  **Must** dispatch `gattserverdisconnected` events.
 *
 *  **Must** dispatch `advertisementreceived` events if you intend to use the
 *  experimental device advertisement scanning.
 * @public
 */
export interface BluBluetoothDevice extends EventTarget {
	readonly id: string
	readonly name?: string
	readonly gatt?: BluBluetoothRemoteGATTServer
	watchAdvertisements?: (
		options?: WatchAdvertisementsOptions,
	) => Promise<void>
	readonly watchingAdvertisements?: boolean
}

/**
 * The Web Bluetooth `BluetoothRemoteGATTServer` interface required by Blu.
 * @remarks Based on
 *  {@link https://developer.mozilla.org/en-US/docs/Web/API/BluetoothRemoteGATTServer}.
 * @public
 */
export interface BluBluetoothRemoteGATTServer {
	readonly connected: boolean
	connect(): Promise<BluBluetoothRemoteGATTServer>
	disconnect(): void
	getPrimaryService(
		service: BluetoothServiceUUID,
	): Promise<BluBluetoothRemoteGATTService>
	getPrimaryServices(
		service?: BluetoothServiceUUID,
	): Promise<BluBluetoothRemoteGATTService[]>
}

/**
 * The Web Bluetooth `BluetoothRemoteGATTService` interface required by Blu.
 * @remarks Based on
 *  {@link https://developer.mozilla.org/en-US/docs/Web/API/BluetoothRemoteGATTService}.
 * @public
 */
export interface BluBluetoothRemoteGATTService {
	readonly uuid: string
	getCharacteristic(
		characteristic: BluetoothCharacteristicUUID,
	): Promise<BluBluetoothRemoteGATTCharacteristic>
	getCharacteristics(
		characteristic?: BluetoothCharacteristicUUID,
	): Promise<BluBluetoothRemoteGATTCharacteristic[]>
}

/**
 * The Web Bluetooth `BluetoothRemoteGATTCharacteristic` interface required by Blu.
 * @remarks Based on
 *  {@link https://developer.mozilla.org/en-US/docs/Web/API/BluetoothRemoteGATTCharacteristic}.
 *
 *  **Must** dispatch `characteristicvaluechanged` events.
 * @public
 */
export interface BluBluetoothRemoteGATTCharacteristic extends EventTarget {
	readonly uuid: string
	readonly properties: BluetoothCharacteristicProperties
	readonly value?: DataView
	getDescriptor(
		descriptor: BluetoothDescriptorUUID,
	): Promise<BluBluetoothRemoteGATTDescriptor>
	getDescriptors(
		descriptor?: BluetoothDescriptorUUID,
	): Promise<BluBluetoothRemoteGATTDescriptor[]>
	readValue(): Promise<DataView>
	writeValueWithResponse(value: BufferSource): Promise<void>
	writeValueWithoutResponse(value: BufferSource): Promise<void>
	startNotifications(): Promise<BluBluetoothRemoteGATTCharacteristic>
	stopNotifications(): Promise<BluBluetoothRemoteGATTCharacteristic>
}

/**
 * The Web Bluetooth `BluetoothRemoteGATTDescriptor` interface required by Blu.
 * @remarks Based on
 *  {@link https://developer.mozilla.org/en-US/docs/Web/API/BluetoothRemoteGATTDescriptor}.
 * @public
 */
export interface BluBluetoothRemoteGATTDescriptor {
	readonly uuid: string
	readonly value?: DataView
	readValue(): Promise<DataView>
	writeValue(value: BufferSource): Promise<void>
}

/**
 * The Web Bluetooth `BluetoothLEScan` interface required by Blu.
 * @remarks Based on
 *  {@link https://webbluetoothcg.github.io/web-bluetooth/scanning.html#bluetoothlescan}.
 * @public
 */
export interface BluBluetoothLEScan {
	stop(): void
}
