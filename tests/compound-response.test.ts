import { describe, expect, it } from "vitest"
import BluCompoundResponse from "../src/compound-response"
import { BluResponseConstructionError } from "../src/errors"
import BluResponse from "../src/response"

describe("BluCompoundResponse", () => {
	it("has default validators that accept any response", () => {
		expect(
			BluCompoundResponse.compoundValidator(new BluCompoundResponse()),
		).toBe(true)
		expect(BluCompoundResponse.validator(new BluResponse())).toBe(true)
	})

	it("stores the provided partial responses", () => {
		const a = new BluResponse()
		const b = new BluResponse()

		expect(new BluCompoundResponse(a, b).partialResponses).toEqual([a, b])
	})

	it("throws when a partial response is not a `BluResponse`", () => {
		expect(
			() =>
				new BluCompoundResponse(
					new BluResponse(),
					{} as unknown as BluResponse,
				),
		).toThrow(BluResponseConstructionError)
	})

	it("has a default follow-up validator that returns `false`", () => {
		expect(
			new BluCompoundResponse().hasFollowUpResponseValidator(
				new BluResponse(),
			),
		).toBe(false)
	})

	it("has a default sanitizer that does nothing", () => {
		expect(
			new BluCompoundResponse().sanitizer(new BluResponse()),
		).toBeUndefined()
	})

	it("appends partial responses", () => {
		const response = new BluCompoundResponse()
		const partialResponse = new BluResponse()

		response.addPartialResponse(partialResponse)

		expect(response.partialResponses).toEqual([partialResponse])
	})
})
