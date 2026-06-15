import { describe, expect, it, vi } from "vitest"
import BluCharacteristic, {
	BluCharacteristicNotificationEvent,
} from "../src/characteristic"
import BluCompoundResponse from "../src/compound-response"
import configuration from "../src/configuration"
import { BluCharacteristicDescription } from "../src/descriptions"
import {
	BluCharacteristicNotificationTimeoutError,
	BluCharacteristicOperationError,
} from "../src/errors"
import BluRequest from "../src/request"
import BluResponse from "../src/response"
import type BluService from "../src/service"
import {
	bytes,
	FakeGATTCharacteristic,
	makeProperties,
	toDataView,
} from "./helpers/fake-bluetooth"

const propertyNames = [
	"authenticatedSignedWrites",
	"broadcast",
	"indicate",
	"read",
	"reliableWrite",
	"write",
	"writeWithoutResponse",
	"notify",
	"writableAuxiliaries",
] as const satisfies (keyof BluetoothCharacteristicProperties)[]

function makeCharacteristic(options?: {
	uuid?: string
	value?: DataView
	properties?: Partial<BluetoothCharacteristicProperties>
	expectedProperties?: Partial<BluetoothCharacteristicProperties>
}) {
	const fakeCharacteristic = new FakeGATTCharacteristic({
		uuid: options?.uuid ?? "2a00",
		value: options?.value,
		properties: options?.properties,
	})

	const device = {
		name: "Device",
		performGATTOperation: <ResultType>(
			operation: () => Promise<ResultType>,
		) => operation(),
	}

	const service = {
		device,
		description: { name: "Service" },
	} as unknown as BluService

	const characteristic = new BluCharacteristic({
		service,
		bluetoothCharacteristic: fakeCharacteristic,
		description: new BluCharacteristicDescription({
			uuid: options?.uuid ?? "2a00",
			name: "Characteristic",
			expectedProperties: options?.expectedProperties,
		}),
	})

	return { characteristic, fakeCharacteristic }
}

describe("BluCharacteristic", () => {
	it("exposes its UUID, value and a no-op `beforeReady`", () => {
		const { characteristic } = makeCharacteristic({
			uuid: "2a37",
			value: bytes(1, 2),
		})

		expect(characteristic.uuid).toBe("2a37")
		expect(characteristic.value).toEqual(bytes(1, 2))
		expect(characteristic.descriptors).toEqual([])
		expect(characteristic.beforeReady()).toBeUndefined()
	})

	it("derives its properties from the underlying characteristic", () => {
		const { characteristic } = makeCharacteristic({
			properties: { read: true, notify: true },
		})

		expect(characteristic.properties.read).toBe(true)
		expect(characteristic.properties.write).toBe(false)
		expect(characteristic.properties.notify).toBe(true)
		expect(characteristic.properties.isListening).toBe(false)
	})

	it("leaves `isListening` undefined for non-notifying characteristics", () => {
		const { characteristic } = makeCharacteristic()

		expect(characteristic.properties.isListening).toBeUndefined()
	})

	describe("hasExpectedProperties", () => {
		it("is true when there are no expectations", () => {
			const { characteristic } = makeCharacteristic()

			expect(characteristic.hasExpectedProperties).toBe(true)
		})

		it("is true when no individual property is expected", () => {
			const { characteristic } = makeCharacteristic({
				expectedProperties: {},
			})

			expect(characteristic.hasExpectedProperties).toBe(true)
		})

		it("is true when all expected properties match", () => {
			const matching = makeProperties({
				read: true,
				write: true,
				notify: true,
			})

			const { characteristic } = makeCharacteristic({
				properties: matching,
				expectedProperties: matching,
			})

			expect(characteristic.hasExpectedProperties).toBe(true)
		})

		it.each(propertyNames)(
			"is false when the expected %s property is missing",
			(property) => {
				const { characteristic } = makeCharacteristic({
					expectedProperties: { [property]: true },
				})

				expect(characteristic.hasExpectedProperties).toBe(false)
			},
		)
	})

	describe("readValue", () => {
		it("reads the value", async () => {
			const { characteristic } = makeCharacteristic({
				properties: { read: true },
				value: bytes(9),
			})

			await expect(characteristic.readValue()).resolves.toEqual(bytes(9))
		})

		it("logs the value when data transfer logging is enabled", async () => {
			configuration.set({ dataTransferLogging: true })

			const { characteristic } = makeCharacteristic({
				properties: { read: true },
				value: bytes(9),
			})

			await characteristic.readValue()

			expect(console.debug).toHaveBeenCalled()
		})

		it("throws when reading from a non-readable characteristic", async () => {
			const { characteristic } = makeCharacteristic()

			await expect(characteristic.readValue()).rejects.toBeInstanceOf(
				BluCharacteristicOperationError,
			)
		})

		it("throws when reading fails", async () => {
			const { characteristic, fakeCharacteristic } = makeCharacteristic({
				properties: { read: true },
			})

			fakeCharacteristic.readError = new Error("read failed")

			await expect(characteristic.readValue()).rejects.toBeInstanceOf(
				BluCharacteristicOperationError,
			)
		})
	})

	describe("read", () => {
		it("reads a response of the characteristic's response type", async () => {
			const { characteristic } = makeCharacteristic({
				properties: { read: true },
				value: bytes(7),
			})

			const response = await characteristic.read()

			expect(response).toBeInstanceOf(BluResponse)
			expect(response.data).toEqual(bytes(7))
		})
	})

	describe("write", () => {
		it("writes with response", async () => {
			const { characteristic, fakeCharacteristic } = makeCharacteristic({
				properties: { write: true },
			})

			await characteristic.write(bytes(1, 2))

			expect(fakeCharacteristic.writes).toEqual([bytes(1, 2)])
		})

		it("writes without response", async () => {
			const { characteristic, fakeCharacteristic } = makeCharacteristic({
				properties: { writeWithoutResponse: true },
			})

			await characteristic.write(bytes(3), true)

			expect(fakeCharacteristic.writes).toEqual([bytes(3)])
		})

		it("logs the value when data transfer logging is enabled", async () => {
			configuration.set({ dataTransferLogging: true })

			const { characteristic } = makeCharacteristic({
				properties: { write: true },
			})

			await characteristic.write(bytes(1))

			expect(console.debug).toHaveBeenCalled()
		})

		it("throws when writing without response is unsupported", async () => {
			const { characteristic } = makeCharacteristic({
				properties: { write: true },
			})

			await expect(
				characteristic.write(bytes(1), true),
			).rejects.toBeInstanceOf(BluCharacteristicOperationError)
		})

		it("throws when writing to a non-writable characteristic", async () => {
			const { characteristic } = makeCharacteristic()

			await expect(characteristic.write(bytes(1))).rejects.toBeInstanceOf(
				BluCharacteristicOperationError,
			)
		})

		it("throws when writing a non-buffer source", async () => {
			const { characteristic } = makeCharacteristic({
				properties: { write: true },
			})

			await expect(
				characteristic.write("nope" as never),
			).rejects.toBeInstanceOf(BluCharacteristicOperationError)
		})

		it("throws when writing fails", async () => {
			const { characteristic, fakeCharacteristic } = makeCharacteristic({
				properties: { write: true },
			})

			fakeCharacteristic.writeWithResponseError = new Error(
				"write failed",
			)

			await expect(characteristic.write(bytes(1))).rejects.toBeInstanceOf(
				BluCharacteristicOperationError,
			)
		})
	})

	describe("request", () => {
		it("resolves with a matching response", async () => {
			const { characteristic, fakeCharacteristic } = makeCharacteristic({
				properties: { write: true },
			})

			const promise = characteristic.request<BluResponse>(
				new BluRequest(bytes(1)),
			)

			characteristic.emit(
				new BluCharacteristicNotificationEvent(
					new BluResponse(bytes(9)),
				),
			)

			const response = await promise

			expect(response.data).toEqual(bytes(9))
			expect(fakeCharacteristic.writes).toEqual([bytes(1)])
		})

		it("logs the request and response when data transfer logging is enabled", async () => {
			configuration.set({ dataTransferLogging: true })

			const { characteristic } = makeCharacteristic({
				properties: { write: true },
			})

			const promise = characteristic.request<BluResponse>(
				new BluRequest(bytes(1)),
			)

			characteristic.emit(
				new BluCharacteristicNotificationEvent(
					new BluResponse(bytes(9)),
				),
			)

			await promise

			expect(console.debug).toHaveBeenCalled()
		})

		it("resolves a compound response from multiple partial responses", async () => {
			class TwoPartCompoundResponse extends BluCompoundResponse {
				override hasFollowUpResponseValidator() {
					return this.partialResponses.length < 2
				}
			}

			class TwoPartRequest extends BluRequest {
				override readonly responseType = TwoPartCompoundResponse
			}

			const { characteristic } = makeCharacteristic({
				properties: { write: true },
			})

			const promise = characteristic.request<BluCompoundResponse>(
				new TwoPartRequest(bytes(1)),
			)

			characteristic.emit(
				new BluCharacteristicNotificationEvent(
					new BluResponse(bytes(0xaa)),
				),
			)
			characteristic.emit(
				new BluCharacteristicNotificationEvent(
					new BluResponse(bytes(0xbb)),
				),
			)

			const response = await promise

			expect(response).toBeInstanceOf(TwoPartCompoundResponse)
			expect(response.partialResponses).toHaveLength(2)
			expect(response.partialResponses[1]?.data).toEqual(bytes(0xbb))
		})

		it("logs partial and compound responses when data transfer logging is enabled", async () => {
			configuration.set({ dataTransferLogging: true })

			class SinglePartCompoundResponse extends BluCompoundResponse {}

			class SinglePartRequest extends BluRequest {
				override readonly responseType = SinglePartCompoundResponse
			}

			const { characteristic } = makeCharacteristic({
				properties: { write: true },
			})

			const promise = characteristic.request<BluCompoundResponse>(
				new SinglePartRequest(bytes(1)),
			)

			characteristic.emit(
				new BluCharacteristicNotificationEvent(
					new BluResponse(bytes(1)),
				),
			)

			await promise

			expect(console.debug).toHaveBeenCalled()
		})

		it("ignores notifications that do not validate", async () => {
			class MatchingResponse extends BluResponse {
				static override validator(response: BluResponse) {
					return response.data?.getUint8(0) === 0x09
				}
			}

			class MatchingRequest extends BluRequest {
				override readonly responseType = MatchingResponse
			}

			const { characteristic } = makeCharacteristic({
				properties: { write: true },
			})

			const promise = characteristic.request<BluResponse>(
				new MatchingRequest(bytes(1)),
			)

			// This notification does not validate and must be ignored.
			characteristic.emit(
				new BluCharacteristicNotificationEvent(
					new BluResponse(bytes(0x00)),
				),
			)
			// This notification validates and resolves the request.
			characteristic.emit(
				new BluCharacteristicNotificationEvent(
					new BluResponse(bytes(0x09)),
				),
			)

			const response = await promise

			expect(response.data).toEqual(bytes(0x09))
		})

		it("ignores partial responses that do not validate", async () => {
			class ValidatingCompoundResponse extends BluCompoundResponse {
				static override validator(response: BluResponse) {
					return response.data?.getUint8(0) !== 0x00
				}

				override hasFollowUpResponseValidator() {
					return this.partialResponses.length < 1
				}
			}

			class ValidatingRequest extends BluRequest {
				override readonly responseType = ValidatingCompoundResponse
			}

			const { characteristic } = makeCharacteristic({
				properties: { write: true },
			})

			const promise = characteristic.request<BluCompoundResponse>(
				new ValidatingRequest(bytes(1)),
			)

			// This partial response does not validate and must be ignored.
			characteristic.emit(
				new BluCharacteristicNotificationEvent(
					new BluResponse(bytes(0x00)),
				),
			)
			// This partial response validates and completes the compound.
			characteristic.emit(
				new BluCharacteristicNotificationEvent(
					new BluResponse(bytes(0xbb)),
				),
			)

			const response = await promise

			expect(response.partialResponses).toHaveLength(1)
			expect(response.partialResponses[0]?.data).toEqual(bytes(0xbb))
		})

		it("rejects an invalid request", async () => {
			const { characteristic } = makeCharacteristic({
				properties: { write: true },
			})

			await expect(
				characteristic.request({} as never),
			).rejects.toBeInstanceOf(BluCharacteristicOperationError)
		})

		it("rejects when the underlying write fails", async () => {
			const { characteristic, fakeCharacteristic } = makeCharacteristic({
				properties: { write: true },
			})

			fakeCharacteristic.writeWithResponseError = new Error(
				"write failed",
			)

			await expect(
				characteristic.request(new BluRequest(bytes(1)), 0),
			).rejects.toBeInstanceOf(BluCharacteristicOperationError)
		})

		it("rejects when the request times out", async () => {
			vi.useFakeTimers()

			const { characteristic } = makeCharacteristic({
				properties: { write: true },
			})

			const promise = characteristic.request(
				new BluRequest(bytes(1)),
				1000,
			)
			const assertion = expect(promise).rejects.toBeInstanceOf(
				BluCharacteristicNotificationTimeoutError,
			)

			await vi.advanceTimersByTimeAsync(1000)
			await assertion
		})

		it("ignores a write failure that occurs after the timeout", async () => {
			vi.useFakeTimers()

			const { characteristic, fakeCharacteristic } = makeCharacteristic({
				properties: { write: true },
			})

			let rejectWrite: (error: Error) => void = () => undefined

			fakeCharacteristic.writeValueWithResponse = () =>
				new Promise<void>((_resolve, reject) => {
					rejectWrite = reject
				})

			const promise = characteristic.request(
				new BluRequest(bytes(1)),
				1000,
			)
			const assertion = expect(promise).rejects.toBeInstanceOf(
				BluCharacteristicNotificationTimeoutError,
			)

			await vi.advanceTimersByTimeAsync(1000)
			await assertion

			// Rejecting the underlying write only after the timeout has already
			// been reached must be ignored silently.
			rejectWrite(new Error("late write failure"))
			await vi.runAllTimersAsync()
		})
	})

	describe("requestAll", () => {
		it("resolves every request in order", async () => {
			const { characteristic, fakeCharacteristic } = makeCharacteristic({
				properties: { write: true, notify: true },
			})

			fakeCharacteristic.respondOnWrite = (value) => toDataView(value)

			await characteristic.startListeningForNotifications()

			const responses = await characteristic.requestAll([
				new BluRequest(bytes(1)),
				new BluRequest(bytes(2)),
			])

			expect(responses).toHaveLength(2)
			expect(responses[0]?.data).toEqual(bytes(1))
			expect(responses[1]?.data).toEqual(bytes(2))
		})

		it("throws when not given an array", async () => {
			const { characteristic } = makeCharacteristic()

			await expect(
				characteristic.requestAll("nope" as never),
			).rejects.toBeInstanceOf(BluCharacteristicOperationError)
		})

		it("throws when an element is not a request", async () => {
			const { characteristic } = makeCharacteristic()

			await expect(
				characteristic.requestAll([{} as never]),
			).rejects.toBeInstanceOf(BluCharacteristicOperationError)
		})
	})

	describe("startListeningForNotifications", () => {
		it("starts listening", async () => {
			const { characteristic, fakeCharacteristic } = makeCharacteristic({
				properties: { notify: true },
			})

			await characteristic.startListeningForNotifications()

			expect(characteristic.properties.isListening).toBe(true)
			expect(fakeCharacteristic.notifying).toBe(true)
		})

		it("does not log when logging is disabled", async () => {
			configuration.set({ logging: false })

			const { characteristic } = makeCharacteristic({
				properties: { notify: true },
			})

			await characteristic.startListeningForNotifications()

			expect(characteristic.properties.isListening).toBe(true)
		})

		it("throws on a non-notifying characteristic", async () => {
			const { characteristic } = makeCharacteristic()

			await expect(
				characteristic.startListeningForNotifications(),
			).rejects.toBeInstanceOf(BluCharacteristicOperationError)
		})

		it("throws when already listening", async () => {
			const { characteristic } = makeCharacteristic({
				properties: { notify: true },
			})

			await characteristic.startListeningForNotifications()

			await expect(
				characteristic.startListeningForNotifications(),
			).rejects.toBeInstanceOf(BluCharacteristicOperationError)
		})

		it("throws when starting notifications fails", async () => {
			const { characteristic, fakeCharacteristic } = makeCharacteristic({
				properties: { notify: true },
			})

			fakeCharacteristic.startNotificationsError = new Error("nope")

			await expect(
				characteristic.startListeningForNotifications(),
			).rejects.toBeInstanceOf(BluCharacteristicOperationError)
		})
	})

	describe("stopListeningForNotifications", () => {
		it("stops listening", async () => {
			const { characteristic, fakeCharacteristic } = makeCharacteristic({
				properties: { notify: true },
			})

			await characteristic.startListeningForNotifications()
			await characteristic.stopListeningForNotifications()

			expect(characteristic.properties.isListening).toBe(false)
			expect(fakeCharacteristic.notifying).toBe(false)
		})

		it("stops listening without logging when logging is disabled", async () => {
			configuration.set({ logging: false })

			const { characteristic } = makeCharacteristic({
				properties: { notify: true },
			})

			await characteristic.startListeningForNotifications()
			await characteristic.stopListeningForNotifications()

			expect(characteristic.properties.isListening).toBe(false)
		})

		it("throws when not listening", async () => {
			const { characteristic } = makeCharacteristic({
				properties: { notify: true },
			})

			await expect(
				characteristic.stopListeningForNotifications(),
			).rejects.toBeInstanceOf(BluCharacteristicOperationError)
		})

		it("throws when stopping notifications fails", async () => {
			const { characteristic, fakeCharacteristic } = makeCharacteristic({
				properties: { notify: true },
			})

			await characteristic.startListeningForNotifications()

			fakeCharacteristic.stopNotificationsError = new Error("nope")

			await expect(
				characteristic.stopListeningForNotifications(),
			).rejects.toBeInstanceOf(BluCharacteristicOperationError)
		})
	})

	describe("notifications", () => {
		it("emits a notification event with the new value", async () => {
			const { characteristic, fakeCharacteristic } = makeCharacteristic({
				properties: { notify: true },
			})

			await characteristic.startListeningForNotifications()

			const listener = vi.fn()
			characteristic.on("notification", listener)

			fakeCharacteristic.notify(bytes(42))

			expect(listener).toHaveBeenCalledTimes(1)

			const event = listener.mock
				.calls[0]?.[0] as BluCharacteristicNotificationEvent
			expect(event.response.data).toEqual(bytes(42))
		})

		it("logs notifications when data transfer logging is enabled", async () => {
			configuration.set({ dataTransferLogging: true })

			const { characteristic, fakeCharacteristic } = makeCharacteristic({
				properties: { notify: true },
			})

			await characteristic.startListeningForNotifications()

			fakeCharacteristic.notify(bytes(1))

			expect(console.debug).toHaveBeenCalled()
		})
	})
})
