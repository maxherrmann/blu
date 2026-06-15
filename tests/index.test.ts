import { describe, expect, it } from "vitest"
import blu, {
	bluetooth,
	BluBluetoothDisabledEvent,
	BluBluetoothEnabledEvent,
	BluCharacteristic,
	BluCharacteristicDescription,
	BluCharacteristicNotificationEvent,
	BluCompoundResponse,
	BluDescriptor,
	BluDescriptorDescription,
	BluDevice,
	BluDeviceAdvertisedEvent,
	BluDeviceConnectionEvent,
	BluError,
	BluRequest,
	BluResponse,
	BluResponseThreadManager,
	BluScannerAdvertisementEvent,
	BluService,
	BluServiceDescription,
	configuration,
	convert,
	scanner,
} from "../src/index"

describe("index", () => {
	it("exposes the core namespaces on the default export", () => {
		expect(blu.bluetooth).toBe(bluetooth)
		expect(blu.configuration).toBe(configuration)
		expect(blu.convert).toBe(convert)
		expect(blu.scanner).toBe(scanner)
	})

	it("re-exports the public API", () => {
		const exports = [
			BluBluetoothDisabledEvent,
			BluBluetoothEnabledEvent,
			BluCharacteristic,
			BluCharacteristicDescription,
			BluCharacteristicNotificationEvent,
			BluCompoundResponse,
			BluDescriptor,
			BluDescriptorDescription,
			BluDevice,
			BluDeviceAdvertisedEvent,
			BluDeviceConnectionEvent,
			BluError,
			BluRequest,
			BluResponse,
			BluResponseThreadManager,
			BluScannerAdvertisementEvent,
			BluService,
			BluServiceDescription,
		]

		for (const value of exports) {
			expect(value).toBeTypeOf("function")
		}
	})
})
