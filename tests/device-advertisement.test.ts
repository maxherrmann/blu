import { describe, expect, it } from "vitest"
import type {
	BluBluetoothAdvertisingEvent,
	BluBluetoothDevice,
} from "../src/bluetooth-interface"
import BluDeviceAdvertisement from "../src/device-advertisement"

function fakeAdvertisingEvent(
	overrides: Partial<BluBluetoothAdvertisingEvent> = {},
): BluBluetoothAdvertisingEvent {
	return {
		device: {} as BluBluetoothDevice,
		uuids: ["abcd"],
		manufacturerData: new Map() as BluetoothManufacturerData,
		serviceData: new Map() as BluetoothServiceData,
		rssi: -50,
		txPower: 4,
		appearance: 0x0341,
		...overrides,
	} as BluBluetoothAdvertisingEvent
}

describe("BluDeviceAdvertisement", () => {
	it("records a construction timestamp", () => {
		const before = Date.now()
		const advertisement = new BluDeviceAdvertisement(fakeAdvertisingEvent())

		expect(advertisement.timestamp).toBeGreaterThanOrEqual(before)
		expect(advertisement.timestamp).toBeLessThanOrEqual(Date.now())
	})

	it("decodes the appearance into category and subcategory", () => {
		const advertisement = new BluDeviceAdvertisement(
			fakeAdvertisingEvent({ appearance: 0x0341 }),
		)

		expect(advertisement.appearance).toEqual({
			category: 13,
			subcategory: 1,
		})
	})

	it("returns no appearance when unavailable", () => {
		const advertisement = new BluDeviceAdvertisement(
			fakeAdvertisingEvent({ appearance: undefined }),
		)

		expect(advertisement.appearance).toBeUndefined()
	})

	it("exposes the underlying advertisement data", () => {
		const device = {} as BluBluetoothDevice
		const manufacturerData = new Map() as BluetoothManufacturerData
		const serviceData = new Map() as BluetoothServiceData

		const advertisement = new BluDeviceAdvertisement(
			fakeAdvertisingEvent({
				device,
				manufacturerData,
				serviceData,
				uuids: ["1234", "5678"],
				rssi: -42,
				txPower: 8,
			}),
		)

		expect(advertisement.device).toBe(device)
		expect(advertisement.manufacturerData).toBe(manufacturerData)
		expect(advertisement.serviceData).toBe(serviceData)
		expect(advertisement.serviceUuids).toEqual(["1234", "5678"])
		expect(advertisement.signalStrength).toBe(-42)
		expect(advertisement.transmissionPower).toBe(8)
	})
})
