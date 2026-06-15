import { describe, expect, it } from "vitest"
import BluCompoundResponse from "../src/compound-response"
import { BluRequestConstructionError } from "../src/errors"
import BluRequest, { isRequestExpectingCompoundResponse } from "../src/request"
import BluResponse from "../src/response"

describe("BluRequest", () => {
	it("defaults its response type to `BluResponse`", () => {
		const request = new BluRequest(new Uint8Array([1]))

		expect(request.responseType).toBe(BluResponse)
	})

	it("stores the provided data", () => {
		const data = new Uint8Array([1, 2, 3])

		expect(new BluRequest(data).data).toBe(data)
	})

	it("throws when the data is not a buffer source", () => {
		expect(
			() => new BluRequest([1, 2, 3] as unknown as BufferSource),
		).toThrow(BluRequestConstructionError)
	})
})

describe("isRequestExpectingCompoundResponse", () => {
	it("returns `false` for a request with a plain response type", () => {
		const request = new BluRequest(new Uint8Array([1]))

		expect(isRequestExpectingCompoundResponse(request)).toBe(false)
	})

	it("returns `true` for a request with a compound response type", () => {
		class CompoundRequest extends BluRequest {
			override readonly responseType = BluCompoundResponse
		}

		const request = new CompoundRequest(new Uint8Array([1]))

		expect(isRequestExpectingCompoundResponse(request)).toBe(true)
	})
})
