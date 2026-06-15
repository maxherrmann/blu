import { describe, expect, it, vi } from "vitest"
import configuration from "../src/configuration"
import BluDeviceAdvertisement from "../src/device-advertisement"
import BluDevice from "../src/device"
import {
	BluDeviceConstructionError,
	BluEnvironmentError,
	BluScannerError,
	BluScannerOperationError,
} from "../src/errors"
import { BluScanner, BluScannerAdvertisementEvent } from "../src/scanner"
import { BluServiceDescription } from "../src/descriptions"
import { FakeBluetooth, FakeBluetoothDevice } from "./helpers/fake-bluetooth"

function useFakeBluetooth(options?: {
	supportsGetDevices?: boolean
	supportsRequestLEScan?: boolean
}) {
	const bluetooth = new FakeBluetooth(options)
	configuration.useBluetoothInterface(bluetooth)
	return bluetooth
}

describe("BluScanner", () => {
	describe("getDevice", () => {
		it("throws when Web Bluetooth is unsupported", async () => {
			const scanner = new BluScanner()

			await expect(scanner.getDevice()).rejects.toBeInstanceOf(
				BluEnvironmentError,
			)
		})

		it("returns a matching device and computes optional services", async () => {
			class DeviceA extends BluDevice {
				static override readonly interface = [
					new BluServiceDescription({ uuid: "180a", name: "A" }),
					new BluServiceDescription({
						uuid: "180f",
						name: "Advertised",
						advertised: true,
					}),
				]
			}

			class DeviceB extends BluDevice {
				static override readonly interface = [
					new BluServiceDescription({ uuid: "180a", name: "Dup" }),
				]
			}

			configuration.set({
				devices: [
					{ type: DeviceA, validator: () => true },
					{ type: DeviceB },
				],
			})

			const bluetooth = useFakeBluetooth()
			bluetooth.requestDeviceResult = new FakeBluetoothDevice({})

			const scanner = new BluScanner()
			const device = await scanner.getDevice()

			expect(device).toBeInstanceOf(DeviceA)
		})

		it("throws when no device type matches", async () => {
			configuration.set({
				devices: [{ type: BluDevice, validator: () => false }],
			})

			const bluetooth = useFakeBluetooth()
			bluetooth.requestDeviceResult = new FakeBluetoothDevice({})

			const scanner = new BluScanner()

			await expect(scanner.getDevice()).rejects.toBeInstanceOf(
				BluDeviceConstructionError,
			)
		})

		it("wraps unexpected errors", async () => {
			const bluetooth = useFakeBluetooth()
			bluetooth.requestDeviceError = new Error("boom")

			const scanner = new BluScanner()

			await expect(scanner.getDevice()).rejects.toBeInstanceOf(
				BluScannerError,
			)
		})
	})

	describe("getPairedDevices", () => {
		it("throws when Web Bluetooth is unsupported", async () => {
			const scanner = new BluScanner()

			await expect(scanner.getPairedDevices()).rejects.toBeInstanceOf(
				BluEnvironmentError,
			)
		})

		it("throws when paired device retrieval is unsupported", async () => {
			useFakeBluetooth({ supportsGetDevices: false })

			const scanner = new BluScanner()

			await expect(scanner.getPairedDevices()).rejects.toBeInstanceOf(
				BluEnvironmentError,
			)
		})

		it("returns matching paired devices", async () => {
			const bluetooth = useFakeBluetooth()
			bluetooth.devices.push(new FakeBluetoothDevice({}))

			const scanner = new BluScanner()
			const devices = await scanner.getPairedDevices()

			expect(devices).toHaveLength(1)
			expect(devices[0]).toBeInstanceOf(BluDevice)
		})

		it("skips paired devices that match no registered type", async () => {
			configuration.set({
				devices: [{ type: BluDevice, validator: () => false }],
			})

			const bluetooth = useFakeBluetooth()
			bluetooth.devices.push(new FakeBluetoothDevice({}))

			const scanner = new BluScanner()
			const devices = await scanner.getPairedDevices()

			expect(devices).toEqual([])
		})

		it("wraps unexpected errors", async () => {
			const bluetooth = useFakeBluetooth()
			bluetooth.getDevices = async () => {
				throw new Error("boom")
			}

			const scanner = new BluScanner()

			await expect(scanner.getPairedDevices()).rejects.toBeInstanceOf(
				BluScannerError,
			)
		})
	})

	describe("startScanningForAdvertisements", () => {
		it("throws when Web Bluetooth is unsupported", async () => {
			const scanner = new BluScanner()

			await expect(
				scanner.startScanningForAdvertisements(),
			).rejects.toBeInstanceOf(BluEnvironmentError)
		})

		it("throws when advertisement scanning is unsupported", async () => {
			useFakeBluetooth({ supportsRequestLEScan: false })

			const scanner = new BluScanner()

			await expect(
				scanner.startScanningForAdvertisements(),
			).rejects.toBeInstanceOf(BluEnvironmentError)
		})

		it("emits advertisement events", async () => {
			const bluetooth = useFakeBluetooth()
			const scanner = new BluScanner()

			await scanner.startScanningForAdvertisements()

			const listener = vi.fn()
			scanner.on("advertisement", listener)

			bluetooth.dispatchEvent(new Event("advertisementreceived"))

			expect(listener).toHaveBeenCalledTimes(1)

			const event = listener.mock
				.calls[0]?.[0] as BluScannerAdvertisementEvent
			expect(event.advertisement).toBeInstanceOf(BluDeviceAdvertisement)
		})

		it("throws when already scanning", async () => {
			useFakeBluetooth()
			const scanner = new BluScanner()

			await scanner.startScanningForAdvertisements()

			await expect(
				scanner.startScanningForAdvertisements(),
			).rejects.toBeInstanceOf(BluScannerOperationError)
		})

		it("wraps unexpected errors", async () => {
			const bluetooth = useFakeBluetooth()
			bluetooth.requestLEScanError = new Error("boom")

			const scanner = new BluScanner()

			await expect(
				scanner.startScanningForAdvertisements(),
			).rejects.toBeInstanceOf(BluScannerError)
		})
	})

	describe("stopScanningForAdvertisements", () => {
		it("throws when not scanning", () => {
			const scanner = new BluScanner()

			expect(() => scanner.stopScanningForAdvertisements()).toThrow(
				BluScannerOperationError,
			)
		})

		it("stops an ongoing scan", async () => {
			useFakeBluetooth()
			const scanner = new BluScanner()

			await scanner.startScanningForAdvertisements()

			expect(() => scanner.stopScanningForAdvertisements()).not.toThrow()
			expect(() => scanner.stopScanningForAdvertisements()).toThrow(
				BluScannerOperationError,
			)
		})
	})

	describe("BluScannerAdvertisementEvent", () => {
		it("carries the advertisement", () => {
			const advertisement = new BluDeviceAdvertisement(
				new Event("advertisementreceived") as never,
			)
			const event = new BluScannerAdvertisementEvent(advertisement)

			expect(event.type).toBe("advertisement")
			expect(event.advertisement).toBe(advertisement)
		})
	})
})
