import { afterEach, describe, expect, it, vi } from "vitest"
import bluetoothState from "../src/bluetooth-state"
import configuration, {
	defaultConfigurationOptions,
} from "../src/configuration"
import { BluConfigurationError } from "../src/errors"
import { bytes, FakeBluetooth } from "./helpers/fake-bluetooth"

describe("BluConfiguration", () => {
	it("returns the default options initially", () => {
		expect(configuration.get()).toBe(defaultConfigurationOptions)
		expect(configuration.options).toBe(defaultConfigurationOptions)
	})

	it("merges and parses valid options", () => {
		configuration.set({ logging: false, dataTransferLogging: true })

		expect(configuration.options.logging).toBe(false)
		expect(configuration.options.dataTransferLogging).toBe(true)
		// Unspecified options keep their defaults.
		expect(configuration.options.devices).toHaveLength(1)
	})

	it("throws a configuration error for invalid options", () => {
		expect(() =>
			configuration.set({ logging: "yes" as unknown as boolean }),
		).toThrow(BluConfigurationError)
	})

	it("restores the default options", () => {
		configuration.set({ logging: false })
		configuration.restoreDefaults()

		expect(configuration.options).toBe(defaultConfigurationOptions)
	})

	it("parses scan filters with data prefixes and masks", () => {
		configuration.set({
			deviceScannerConfiguration: {
				filters: [
					{
						manufacturerData: [
							{
								companyIdentifier: 0x004c,
								dataPrefix: bytes(0x01),
								mask: bytes(0xff),
							},
						],
						serviceData: [
							{
								service: "180a",
								dataPrefix: bytes(0x02),
								mask: bytes(0xff),
							},
						],
					},
				],
			},
		})

		const configured = configuration.options.deviceScannerConfiguration as {
			filters: BluetoothLEScanFilter[]
		}

		expect(
			configured.filters[0]?.manufacturerData?.[0]?.companyIdentifier,
		).toBe(0x004c)
		expect(configured.filters[0]?.serviceData?.[0]?.service).toBe("180a")

		configuration.restoreDefaults()
	})

	describe("Bluetooth interface", () => {
		afterEach(() => {
			configuration.useBluetoothInterface(undefined as never)
		})

		it("uses `navigator.bluetooth` by default", () => {
			// In Node there is no `navigator.bluetooth`, so the default is
			// `undefined`.
			expect(configuration.bluetoothInterface).toBeUndefined()
		})

		it("switches the active Bluetooth interface", () => {
			const fakeBluetooth = new FakeBluetooth()
			const initialize = vi.spyOn(bluetoothState, "initialize")

			configuration.useBluetoothInterface(fakeBluetooth)

			expect(configuration.bluetoothInterface).toBe(fakeBluetooth)
			expect(initialize).toHaveBeenCalledTimes(1)
		})
	})
})
