import { describe, expect, it } from "vitest"
import type BluCharacteristic from "../src/characteristic"
import type BluDescriptor from "../src/descriptor"
import type BluDevice from "../src/device"
import {
	BluCharacteristicError,
	BluCharacteristicNotificationTimeoutError,
	BluCharacteristicOperationError,
	BluConfigurationError,
	BluDescriptorError,
	BluDescriptorOperationError,
	BluDeviceAdvertisementReportingError,
	BluDeviceConnectionError,
	BluDeviceConnectionTimeoutError,
	BluDeviceConstructionError,
	BluDeviceError,
	BluDeviceInterfaceDiscoveryError,
	BluDeviceInterfaceMatchingError,
	BluDeviceOperationError,
	BluEnvironmentError,
	BluError,
	BluGATTOperationError,
	BluGATTOperationQueueError,
	BluInterfaceDescriptionConstructionError,
	BluRequestConstructionError,
	BluResponseConstructionError,
	BluResponseThreadManagerOperationError,
	BluScannerError,
	BluScannerOperationError,
} from "../src/errors"

const device = { name: "Device" } as unknown as BluDevice

const characteristic = {
	service: { device, description: { name: "Service" } },
	description: { name: "Characteristic" },
} as unknown as BluCharacteristic

const descriptor = {
	characteristic: {
		service: { device, description: { name: "Service" } },
		description: { name: "Characteristic" },
	},
	description: { name: "Descriptor" },
} as unknown as BluDescriptor

describe("BluError", () => {
	it("sets the name to the constructor name", () => {
		expect(new BluError("Failed.").name).toBe("BluError")
		expect(new BluConfigurationError("Failed.").name).toBe(
			"BluConfigurationError",
		)
	})

	it("uses the provided message", () => {
		expect(new BluError("Failed.").message).toBe("Failed.")
	})

	it("appends underlying `Error`s", () => {
		const error = new BluError("Failed.", new TypeError("Bad type."))

		expect(error.message).toContain("Failed.")
		expect(error.message).toContain("TypeError: Bad type.")
	})

	it("appends underlying string errors", () => {
		const error = new BluError("Failed.", "Underlying reason.")

		expect(error.message).toContain("Failed.")
		expect(error.message).toContain("Underlying reason.")
	})

	it("ignores underlying errors that are neither `Error` nor string", () => {
		const error = new BluError("Failed.", 42, { reason: "nope" })

		expect(error.message).toBe("Failed.")
	})
})

describe("characteristic errors", () => {
	it("stores the characteristic", () => {
		const error = new BluCharacteristicError(characteristic, "Failed.")

		expect(error.characteristic).toBe(characteristic)
	})

	it("prefixes operation errors with the component path", () => {
		const error = new BluCharacteristicOperationError(
			characteristic,
			"Failed.",
		)

		expect(error.message).toBe(
			"Device \u2192 Service \u2192 Characteristic: Failed.",
		)
		expect(error.characteristic).toBe(characteristic)
	})

	it("provides a notification timeout error", () => {
		expect(
			new BluCharacteristicNotificationTimeoutError("Timed out."),
		).toBeInstanceOf(BluError)
	})
})

describe("descriptor errors", () => {
	it("stores the descriptor", () => {
		const error = new BluDescriptorError(descriptor, "Failed.")

		expect(error.descriptor).toBe(descriptor)
	})

	it("prefixes operation errors with the component path", () => {
		const error = new BluDescriptorOperationError(descriptor, "Failed.")

		expect(error.message).toBe(
			"Device \u2192 Service \u2192 Characteristic \u2192 " +
				"Descriptor: Failed.",
		)
		expect(error.descriptor).toBe(descriptor)
	})
})

describe("device errors", () => {
	it("prefixes the message with the device name and stores the device", () => {
		const error = new BluDeviceError(device, "Failed.")

		expect(error.message).toBe("Device: Failed.")
		expect(error.device).toBe(device)
	})

	it("provides device error subclasses", () => {
		for (const ErrorClass of [
			BluDeviceConstructionError,
			BluDeviceOperationError,
			BluDeviceConnectionError,
			BluDeviceConnectionTimeoutError,
			BluDeviceInterfaceDiscoveryError,
			BluDeviceInterfaceMatchingError,
			BluDeviceAdvertisementReportingError,
		]) {
			expect(new ErrorClass(device, "Failed.")).toBeInstanceOf(
				BluDeviceError,
			)
		}
	})
})

describe("generic error subclasses", () => {
	it("provides message-only error subclasses", () => {
		for (const ErrorClass of [
			BluConfigurationError,
			BluInterfaceDescriptionConstructionError,
			BluGATTOperationQueueError,
			BluGATTOperationError,
			BluRequestConstructionError,
			BluResponseConstructionError,
			BluResponseThreadManagerOperationError,
			BluScannerError,
			BluScannerOperationError,
		]) {
			expect(new ErrorClass("Failed.")).toBeInstanceOf(BluError)
		}
	})
})

describe("BluEnvironmentError", () => {
	it("describes the unsupported feature", () => {
		const error = new BluEnvironmentError("Web Bluetooth")

		expect(error.message).toBe(
			"Web Bluetooth is not supported by the current environment.",
		)
	})
})
