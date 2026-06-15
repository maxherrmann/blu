import { type EventMap } from "jaset"
import { describe, expectTypeOf, test } from "vitest"
import bluetoothState from "../src/bluetooth-state"
import BluCharacteristic, {
	BluCharacteristicNotificationEvent,
} from "../src/characteristic"
import BluCompoundResponse from "../src/compound-response"
import BluDevice, {
	BluDeviceAdvertisedEvent,
	BluDeviceConnectionEvent,
} from "../src/device"
import BluRequest from "../src/request"
import BluResponse from "../src/response"
import { BluScanner, BluScannerAdvertisementEvent } from "../src/scanner"
import type BluService from "../src/service"

class CustomEvent extends Event {
	constructor() {
		super("custom")
	}
}

class CustomResponse extends BluResponse {}

describe("BluDevice events", () => {
	test("narrows the built-in event payloads", () => {
		const device = new BluDevice({} as never)

		device.on("connected", (event) => {
			expectTypeOf(event).toEqualTypeOf<BluDeviceConnectionEvent>()
		})
		device.on("disconnected", (event) => {
			expectTypeOf(event).toEqualTypeOf<BluDeviceConnectionEvent>()
		})
		device.on("connection-lost", (event) => {
			expectTypeOf(event).toEqualTypeOf<BluDeviceConnectionEvent>()
		})
		device.on("advertised", (event) => {
			expectTypeOf(event).toEqualTypeOf<BluDeviceAdvertisedEvent>()
		})
	})

	test("rejects undeclared event types", () => {
		const device = new BluDevice({} as never)

		// @ts-expect-error - "ready" is not part of the device event map
		device.on("ready", () => {})
	})

	test("only allows emitting declared events", () => {
		const device = new BluDevice({} as never)

		device.emit(new BluDeviceConnectionEvent("connected", device))

		// @ts-expect-error - a plain event is not part of the device event map
		device.emit(new Event("connected"))
	})

	test("extends the event map with custom events", () => {
		class CustomDevice extends BluDevice<
			EventMap<{ custom: CustomEvent }>
		> {}

		const device = new CustomDevice({} as never)

		device.on("custom", (event) => {
			expectTypeOf(event).toEqualTypeOf<CustomEvent>()
		})
		// Built-in events remain available.
		device.on("connected", (event) => {
			expectTypeOf(event).toEqualTypeOf<BluDeviceConnectionEvent>()
		})
	})
})

describe("BluCharacteristic events and requests", () => {
	test("narrows the notification payload to the default response type", () => {
		const characteristic = {} as BluCharacteristic

		characteristic.on("notification", (event) => {
			expectTypeOf(event).toEqualTypeOf<
				BluCharacteristicNotificationEvent<typeof BluResponse>
			>()
			expectTypeOf(event.response).toEqualTypeOf<BluResponse>()
		})
	})

	test("narrows the notification payload to a custom response type", () => {
		const characteristic = {} as BluCharacteristic<
			BluService,
			typeof CustomResponse
		>

		characteristic.on("notification", (event) => {
			expectTypeOf(event).toEqualTypeOf<
				BluCharacteristicNotificationEvent<typeof CustomResponse>
			>()
			expectTypeOf(event.response).toEqualTypeOf<CustomResponse>()
		})
	})

	test("narrows the response of `request` to the requested type", () => {
		const characteristic = {} as BluCharacteristic
		const request = new BluRequest(new Uint8Array([1]))

		expectTypeOf(characteristic.request(request)).toEqualTypeOf<
			Promise<BluResponse>
		>()
		expectTypeOf(
			characteristic.request<BluCompoundResponse>(request),
		).toEqualTypeOf<Promise<BluCompoundResponse>>()
	})

	test("narrows the responses of `requestAll` to the requested types", () => {
		const characteristic = {} as BluCharacteristic
		const request = new BluRequest(new Uint8Array([1]))

		expectTypeOf(characteristic.requestAll([request])).toEqualTypeOf<
			Promise<BluResponse[]>
		>()
		expectTypeOf(
			characteristic.requestAll<BluCompoundResponse[]>([request]),
		).toEqualTypeOf<Promise<BluCompoundResponse[]>>()
	})
})

describe("BluScanner events", () => {
	test("narrows the advertisement event payload", () => {
		const scanner = new BluScanner()

		scanner.on("advertisement", (event) => {
			expectTypeOf(event).toEqualTypeOf<BluScannerAdvertisementEvent>()
		})

		// @ts-expect-error - "advertised" is not part of the scanner event map
		scanner.on("advertised", () => {})
	})
})

describe("the global Bluetooth state events", () => {
	test("narrows the built-in event payloads", () => {
		bluetoothState.on("connected", (event) => {
			expectTypeOf(event).toEqualTypeOf<BluDeviceConnectionEvent>()
		})
		bluetoothState.on("connection-lost", (event) => {
			expectTypeOf(event).toEqualTypeOf<BluDeviceConnectionEvent>()
		})

		// @ts-expect-error - "advertised" is not part of the state event map
		bluetoothState.on("advertised", () => {})
	})
})
