import { describe, expect, it } from "vitest"
import type BluDevice from "../src/device"
import { BluServiceDescription } from "../src/descriptions"
import BluService from "../src/service"
import { FakeGATTService } from "./helpers/fake-bluetooth"

describe("BluService", () => {
	function makeService() {
		const device = { name: "Device" } as unknown as BluDevice
		const bluetoothService = new FakeGATTService({ uuid: "180f" })
		const description = new BluServiceDescription({
			uuid: "180f",
			name: "Battery",
		})

		return {
			service: new BluService({ device, bluetoothService, description }),
			device,
			description,
		}
	}

	it("stores the device and description", () => {
		const { service, device, description } = makeService()

		expect(service.device).toBe(device)
		expect(service.description).toBe(description)
	})

	it("exposes the UUID of the underlying service", () => {
		expect(makeService().service.uuid).toBe("180f")
	})

	it("starts without characteristics", () => {
		expect(makeService().service.characteristics).toEqual([])
	})

	it("has a no-op `beforeReady` by default", () => {
		expect(makeService().service.beforeReady()).toBeUndefined()
	})
})
