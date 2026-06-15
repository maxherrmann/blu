import { describe, expect, it, vi } from "vitest"
import {
	BluBluetoothDisabledEvent,
	BluBluetoothEnabledEvent,
	BluBluetoothState,
} from "../src/bluetooth-state"
import configuration from "../src/configuration"
import type BluDevice from "../src/device"
import { BluDeviceConnectionEvent } from "../src/device"
import { FakeBluetooth } from "./helpers/fake-bluetooth"

class AvailabilityChangedEvent extends Event {
	readonly value: boolean

	constructor(value: boolean) {
		super("availabilitychanged")
		this.value = value
	}
}

function fakeDevice(name = "Device"): BluDevice {
	return { name } as unknown as BluDevice
}

describe("BluBluetoothState", () => {
	describe("support and availability", () => {
		it("is not supported without a Bluetooth interface", () => {
			const state = new BluBluetoothState()

			expect(state.isSupported()).toBe(false)
		})

		it("is supported with a Bluetooth interface", () => {
			configuration.useBluetoothInterface(new FakeBluetooth())

			expect(new BluBluetoothState().isSupported()).toBe(true)
		})

		it("reports availability from the Bluetooth interface", async () => {
			const fakeBluetooth = new FakeBluetooth()
			configuration.useBluetoothInterface(fakeBluetooth)
			const state = new BluBluetoothState()

			fakeBluetooth.available = true
			await expect(state.isAvailable()).resolves.toBe(true)

			fakeBluetooth.available = false
			await expect(state.isAvailable()).resolves.toBe(false)
		})

		it("reports unavailability when unsupported", async () => {
			await expect(new BluBluetoothState().isAvailable()).resolves.toBe(
				false,
			)
		})
	})

	describe("availability events", () => {
		it("emits a bluetooth-enabled event when availability turns on", () => {
			const fakeBluetooth = new FakeBluetooth()
			configuration.useBluetoothInterface(fakeBluetooth)
			const state = new BluBluetoothState()
			const listener = vi.fn()

			state.on("bluetooth-enabled", listener)
			fakeBluetooth.dispatchEvent(new AvailabilityChangedEvent(true))

			expect(listener).toHaveBeenCalledWith(
				expect.any(BluBluetoothEnabledEvent),
			)
		})

		it("emits a bluetooth-disabled event when availability turns off", () => {
			const fakeBluetooth = new FakeBluetooth()
			configuration.useBluetoothInterface(fakeBluetooth)
			const state = new BluBluetoothState()
			const listener = vi.fn()

			state.on("bluetooth-disabled", listener)
			fakeBluetooth.dispatchEvent(new AvailabilityChangedEvent(false))

			expect(listener).toHaveBeenCalledWith(
				expect.any(BluBluetoothDisabledEvent),
			)
		})

		it("provides typed enable and disable events", () => {
			expect(new BluBluetoothEnabledEvent().type).toBe(
				"bluetooth-enabled",
			)
			expect(new BluBluetoothDisabledEvent().type).toBe(
				"bluetooth-disabled",
			)
		})
	})

	describe("initialization", () => {
		it("moves its availability listener when the interface changes", () => {
			const first = new FakeBluetooth()
			configuration.useBluetoothInterface(first)
			const state = new BluBluetoothState()

			const removeFromFirst = vi.spyOn(first, "removeEventListener")
			const second = new FakeBluetooth()
			const addToSecond = vi.spyOn(second, "addEventListener")

			configuration.useBluetoothInterface(second)
			state.initialize()

			expect(removeFromFirst).toHaveBeenCalledWith(
				"availabilitychanged",
				expect.any(Function),
			)
			expect(addToSecond).toHaveBeenCalledWith(
				"availabilitychanged",
				expect.any(Function),
			)
		})

		it("does nothing when re-initialized with the same interface", () => {
			const fakeBluetooth = new FakeBluetooth()
			configuration.useBluetoothInterface(fakeBluetooth)
			const state = new BluBluetoothState()

			const addEventListener = vi.spyOn(fakeBluetooth, "addEventListener")
			state.initialize()

			expect(addEventListener).not.toHaveBeenCalled()
		})

		it("does not attach a listener when unsupported", () => {
			expect(new BluBluetoothState().isSupported()).toBe(false)
		})
	})

	describe("connected devices", () => {
		it("tracks connected devices in order", () => {
			const state = new BluBluetoothState()
			const a = fakeDevice("A")
			const b = fakeDevice("B")

			expect(state.connectedDevices).toEqual([])
			expect(state.connectedDevice).toBeNull()

			state.emit(new BluDeviceConnectionEvent("connected", a))
			state.emit(new BluDeviceConnectionEvent("connected", b))

			expect(state.connectedDevices).toEqual([a, b])
			expect(state.connectedDevice).toBe(b)
		})

		it("removes a device when it disconnects", () => {
			const state = new BluBluetoothState()
			const device = fakeDevice()

			state.emit(new BluDeviceConnectionEvent("connected", device))
			state.emit(new BluDeviceConnectionEvent("disconnected", device))

			expect(state.connectedDevices).toEqual([])
		})

		it("removes a device when its connection is lost", () => {
			const state = new BluBluetoothState()
			const device = fakeDevice()

			state.emit(new BluDeviceConnectionEvent("connected", device))
			state.emit(new BluDeviceConnectionEvent("connection-lost", device))

			expect(state.connectedDevices).toEqual([])
		})

		it("clears all devices when Bluetooth is disabled", () => {
			const state = new BluBluetoothState()

			state.emit(new BluDeviceConnectionEvent("connected", fakeDevice()))
			state.emit(new BluBluetoothDisabledEvent())

			expect(state.connectedDevices).toEqual([])
		})
	})
})
