import { describe, expect, it } from "vitest"
import BluCharacteristic from "../src/characteristic"
import BluDescriptor from "../src/descriptor"
import {
	BluCharacteristicDescription,
	BluDescriptorDescription,
	BluInterfaceDescription,
	BluServiceDescription,
} from "../src/descriptions"
import BluService from "../src/service"

describe("BluInterfaceDescription", () => {
	it("lowercases a string UUID", () => {
		const description = new BluInterfaceDescription({ uuid: "ABCD" })

		expect(description.uuid).toBe("abcd")
	})

	it("keeps a numeric UUID as-is", () => {
		const description = new BluInterfaceDescription({ uuid: 0x180f })

		expect(description.uuid).toBe(0x180f)
	})

	it("applies defaults", () => {
		const description = new BluInterfaceDescription({ uuid: "abcd" })

		expect(description.identifier).toBeUndefined()
		expect(description.name).toBe("Generic Interface Component")
		expect(description.optional).toBe(false)
	})

	it("stores the provided values", () => {
		const description = new BluInterfaceDescription({
			uuid: "abcd",
			identifier: "battery",
			name: "Battery",
			optional: true,
		})

		expect(description.identifier).toBe("battery")
		expect(description.name).toBe("Battery")
		expect(description.optional).toBe(true)
	})
})

describe("BluServiceDescription", () => {
	it("applies defaults", () => {
		const description = new BluServiceDescription({ uuid: "abcd" })

		expect(description.name).toBe("Generic Service")
		expect(description.type).toBe(BluService)
		expect(description.characteristics).toEqual([])
		expect(description.advertised).toBe(false)
	})

	it("stores the provided values", () => {
		class CustomService extends BluService {}
		const characteristicDescription = new BluCharacteristicDescription({
			uuid: "1234",
		})

		const description = new BluServiceDescription({
			uuid: "abcd",
			name: "Custom",
			type: CustomService,
			characteristicDescriptions: [characteristicDescription],
			advertised: true,
		})

		expect(description.type).toBe(CustomService)
		expect(description.characteristics).toEqual([characteristicDescription])
		expect(description.advertised).toBe(true)
	})

	it("throws when the type does not extend `BluService`", () => {
		expect(
			() =>
				new BluServiceDescription({
					uuid: "abcd",
					type: class {} as unknown as typeof BluService,
				}),
		).toThrow(/Service/)
	})
})

describe("BluCharacteristicDescription", () => {
	it("applies defaults", () => {
		const description = new BluCharacteristicDescription({ uuid: "abcd" })

		expect(description.name).toBe("Generic Characteristic")
		expect(description.type).toBe(BluCharacteristic)
		expect(description.descriptors).toEqual([])
		expect(description.expectedProperties).toBeUndefined()
	})

	it("stores the provided values", () => {
		class CustomCharacteristic extends BluCharacteristic {}
		const descriptorDescription = new BluDescriptorDescription({
			uuid: "1234",
		})

		const description = new BluCharacteristicDescription({
			uuid: "abcd",
			type: CustomCharacteristic,
			descriptorDescriptions: [descriptorDescription],
			expectedProperties: { read: true },
		})

		expect(description.type).toBe(CustomCharacteristic)
		expect(description.descriptors).toEqual([descriptorDescription])
		expect(description.expectedProperties).toEqual({ read: true })
	})

	it("throws when the type does not extend `BluCharacteristic`", () => {
		expect(
			() =>
				new BluCharacteristicDescription({
					uuid: "abcd",
					type: class {} as unknown as typeof BluCharacteristic,
				}),
		).toThrow(/Characteristic/)
	})
})

describe("BluDescriptorDescription", () => {
	it("applies defaults", () => {
		const description = new BluDescriptorDescription({ uuid: "abcd" })

		expect(description.name).toBe("Generic Descriptor")
		expect(description.type).toBe(BluDescriptor)
	})

	it("stores the provided type", () => {
		class CustomDescriptor extends BluDescriptor {}

		const description = new BluDescriptorDescription({
			uuid: "abcd",
			type: CustomDescriptor,
		})

		expect(description.type).toBe(CustomDescriptor)
	})

	it("throws when the type does not extend `BluDescriptor`", () => {
		expect(
			() =>
				new BluDescriptorDescription({
					uuid: "abcd",
					type: class {} as unknown as typeof BluDescriptor,
				}),
		).toThrow(/Descriptor/)
	})
})
