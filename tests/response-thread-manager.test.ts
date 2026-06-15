import { describe, expect, it } from "vitest"
import { BluResponseThreadManagerOperationError } from "../src/errors"
import BluResponse from "../src/response"
import BluResponseThreadManager from "../src/response-thread-manager"

describe("BluResponseThreadManager", () => {
	it("creates a new thread for an unknown ID", () => {
		const manager = new BluResponseThreadManager()
		const partialResponse = new BluResponse()

		manager.add(1, partialResponse)

		expect(manager.has(1)).toBe(true)
		expect(manager.resolve(1)).toEqual([partialResponse])
	})

	it("appends to an existing thread", () => {
		const manager = new BluResponseThreadManager()
		const a = new BluResponse()
		const b = new BluResponse()

		manager.add("thread", a)
		manager.add("thread", b)

		expect(manager.resolve("thread")).toEqual([a, b])
	})

	it("reports unknown threads as missing", () => {
		const manager = new BluResponseThreadManager()

		expect(manager.has(0)).toBe(false)
	})

	it("removes a thread once resolved", () => {
		const manager = new BluResponseThreadManager()

		manager.add(1, new BluResponse())
		manager.resolve(1)

		expect(manager.has(1)).toBe(false)
	})

	it("throws when resolving an unknown thread", () => {
		const manager = new BluResponseThreadManager()

		expect(() => manager.resolve(99)).toThrow(
			BluResponseThreadManagerOperationError,
		)
	})
})
