import { BluBluetoothAdvertisingEvent } from "./bluetoothInterface"

/**
 * Bluetooth device advertisement.
 */
export default class BluDeviceAdvertisement {
	/**
	 * The advertisement's timestamp.
	 * @readonly
	 */
	readonly timestamp = Date.now()

	/**
	 * The advertisement's underlying Bluetooth interface endpoint.
	 * @readonly
	 */
	readonly _bluetoothAdvertisement: BluBluetoothAdvertisingEvent

	/**
	 * Construct a Bluetooth device advertisement.
	 * @param bluetoothAdvertisement - The advertisement's underlying Bluetooth
	 *  interface endpoint.
	 */
	constructor(bluetoothAdvertisement: BluBluetoothAdvertisingEvent) {
		this._bluetoothAdvertisement = bluetoothAdvertisement
	}

	/**
	 * The device's advertised appearance.
	 * @remarks `undefined` when the data is unavailable. See the
	 *  {@link https://bitbucket.org/bluetooth-SIG/public/src/main/assigned_numbers/core/appearance_values.yaml | Bluetooth SIG's assigned appearance values}
	 *  for possible values.
	 * @readonly
	 */
	get appearance() {
		if (this._bluetoothAdvertisement.appearance === undefined) {
			return
		}

		return {
			category: (this._bluetoothAdvertisement.appearance >> 6) & 0x3ff,
			subcategory: this._bluetoothAdvertisement.appearance & 0x3f,
		}
	}

	/**
	 * The device this advertisement belongs to.
	 */
	get device() {
		return this._bluetoothAdvertisement.device
	}

	/**
	 * The device's advertised manufacturer data.
	 * @remarks `undefined` when the data is unavailable. See the
	 *  {@link https://bitbucket.org/bluetooth-SIG/public/src/main/assigned_numbers/company_identifiers/company_identifiers.yaml | Bluetooth SIG's assigned company identifiers}
	 *  for possible values.
	 * @readonly
	 */
	get manufacturerData() {
		return this._bluetoothAdvertisement.manufacturerData
	}

	/**
	 * The device's advertised service data.
	 * @readonly
	 */
	get serviceData() {
		return this._bluetoothAdvertisement.serviceData
	}

	/**
	 * The device's advertised Bluetooth service UUIDs.
	 * @readonly
	 */
	get serviceUuids() {
		return this._bluetoothAdvertisement.uuids
	}

	/**
	 * The device's received signal strength in dBm.
	 * @remarks `undefined` when the data is unavailable.
	 * @readonly
	 */
	get signalStrength() {
		return this._bluetoothAdvertisement.rssi
	}

	/**
	 * The device's advertised transmission power in dBm.
	 * @remarks `undefined` when the data is unavailable.
	 * @readonly
	 */
	get transmissionPower() {
		return this._bluetoothAdvertisement.txPower
	}
}
