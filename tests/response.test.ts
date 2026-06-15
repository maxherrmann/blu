import { describe, expect, it } from "vitest"
import { BluResponseConstructionError } from "../src/errors"
import BluResponse from "../src/response"

describe("BluResponse", () => {
	it("has a default validator that accepts any response", () => {
		expect(BluResponse.validator(new BluResponse())).toBe(true)
	})

	it("stores the provided data", () => {
		const data = new DataView(new Uint8Array([1, 2, 3]).buffer)

		expect(new BluResponse(data).data).toBe(data)
	})

	it("allows omitting the data", () => {
		expect(new BluResponse().data).toBeUndefined()
		expect(new BluResponse(undefined).data).toBeUndefined()
	})

	it("throws when the data is not a `DataView`", () => {
		expect(() => new BluResponse([1, 2, 3] as unknown as DataView)).toThrow(
			BluResponseConstructionError,
		)
	})
})
