import { describe, expect, it } from "vitest"
import type BluCharacteristic from "../src/characteristic"
import configuration from "../src/configuration"
import { BluDescriptorDescription } from "../src/descriptions"
import BluDescriptor from "../src/descriptor"
import { BluDescriptorOperationError } from "../src/errors"
import BluResponse from "../src/response"
import { bytes, FakeGATTDescriptor } from "./helpers/fake-bluetooth"

function makeDescriptor(
	bluetoothDescriptor = new FakeGATTDescriptor({ uuid: "2901" }),
) {
	const device = {
		name: "Device",
		performGATTOperation: <ResultType>(
			operation: () => Promise<ResultType>,
		) => operation(),
	}

	const characteristic = {
		service: { device, description: { name: "Service" } },
		description: { name: "Characteristic" },
	} as unknown as BluCharacteristic

	const descriptor = new BluDescriptor({
		characteristic,
		bluetoothDescriptor,
		description: new BluDescriptorDescription({
			uuid: "2901",
			name: "Descriptor",
		}),
	})

	return { descriptor, bluetoothDescriptor }
}

describe("BluDescriptor", () => {
	it("exposes its UUID, response type and a no-op `beforeReady`", () => {
		const { descriptor } = makeDescriptor()

		expect(descriptor.uuid).toBe("2901")
		expect(descriptor.responseType).toBe(BluResponse)
		expect(descriptor.beforeReady()).toBeUndefined()
	})

	it("reads its value", async () => {
		const { descriptor } = makeDescriptor(
			new FakeGATTDescriptor({ uuid: "2901", value: bytes(1, 2) }),
		)

		expect(descriptor.value).toBeUndefined()

		const value = await descriptor.readValue()

		expect(value).toEqual(bytes(1, 2))
		expect(descriptor.value).toEqual(bytes(1, 2))
	})

	it("reads a response", async () => {
		const { descriptor } = makeDescriptor(
			new FakeGATTDescriptor({ uuid: "2901", value: bytes(7) }),
		)

		const response = await descriptor.read()

		expect(response).toBeInstanceOf(BluResponse)
		expect(response.data).toEqual(bytes(7))
	})

	it("logs reads when data transfer logging is enabled", async () => {
		configuration.set({ dataTransferLogging: true })

		const { descriptor } = makeDescriptor()
		await descriptor.readValue()

		expect(console.debug).toHaveBeenCalled()
	})

	it("throws when reading fails", async () => {
		const bluetoothDescriptor = new FakeGATTDescriptor({ uuid: "2901" })
		bluetoothDescriptor.readError = new Error("boom")
		const { descriptor } = makeDescriptor(bluetoothDescriptor)

		await expect(descriptor.readValue()).rejects.toBeInstanceOf(
			BluDescriptorOperationError,
		)
	})

	it("writes a value", async () => {
		const { descriptor, bluetoothDescriptor } = makeDescriptor()

		await descriptor.write(bytes(1, 2, 3))

		expect(bluetoothDescriptor.writes).toHaveLength(1)
	})

	it("logs writes when data transfer logging is enabled", async () => {
		configuration.set({ dataTransferLogging: true })

		const { descriptor } = makeDescriptor()
		await descriptor.write(bytes(1))

		expect(console.debug).toHaveBeenCalled()
	})

	it("throws when writing a non-buffer source", async () => {
		const { descriptor } = makeDescriptor()

		await expect(
			descriptor.write([1, 2, 3] as unknown as BufferSource),
		).rejects.toBeInstanceOf(BluDescriptorOperationError)
	})

	it("throws when writing fails", async () => {
		const bluetoothDescriptor = new FakeGATTDescriptor({ uuid: "2901" })
		bluetoothDescriptor.writeError = new Error("boom")
		const { descriptor } = makeDescriptor(bluetoothDescriptor)

		await expect(descriptor.write(bytes(1))).rejects.toBeInstanceOf(
			BluDescriptorOperationError,
		)
	})
})
