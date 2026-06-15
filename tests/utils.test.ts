import { describe, expect, it, vi } from "vitest"
import delay from "../src/utils/delay"
import isArray from "../src/utils/is-array"
import isBufferSource from "../src/utils/is-buffer-source"
import isSubclassOrSame from "../src/utils/is-subclass-or-same"

describe("isArray", () => {
	it("returns `true` for arrays", () => {
		expect(isArray([])).toBe(true)
		expect(isArray([1, 2, 3])).toBe(true)
	})

	it("returns `false` for non-arrays", () => {
		expect(isArray("array")).toBe(false)
		expect(isArray({ length: 0 })).toBe(false)
		expect(isArray(undefined)).toBe(false)
	})
})

describe("isBufferSource", () => {
	it("returns `true` for an `ArrayBuffer`", () => {
		expect(isBufferSource(new ArrayBuffer(8))).toBe(true)
	})

	it("returns `true` for an array buffer view", () => {
		expect(isBufferSource(new Uint8Array(8))).toBe(true)
		expect(isBufferSource(new DataView(new ArrayBuffer(8)))).toBe(true)
	})

	it("returns `false` for non-buffer sources", () => {
		expect(isBufferSource([1, 2, 3])).toBe(false)
		expect(isBufferSource("data")).toBe(false)
		expect(isBufferSource(undefined)).toBe(false)
	})
})

describe("isSubclassOrSame", () => {
	class Base {}
	class Sub extends Base {}
	class Unrelated {}

	it("returns `true` for the same class", () => {
		expect(isSubclassOrSame(Base, Base)).toBe(true)
	})

	it("returns `true` for a subclass", () => {
		expect(isSubclassOrSame(Sub, Base)).toBe(true)
	})

	it("returns `false` for an unrelated class", () => {
		expect(isSubclassOrSame(Unrelated, Base)).toBe(false)
	})

	it("returns `false` for a non-function subject", () => {
		expect(isSubclassOrSame("Base", Base)).toBe(false)
		expect(isSubclassOrSame(undefined, Base)).toBe(false)
	})
})

describe("delay", () => {
	it("resolves after the given time", async () => {
		vi.useFakeTimers()

		const resolved = vi.fn()
		const promise = delay(100).then(resolved)

		await vi.advanceTimersByTimeAsync(99)
		expect(resolved).not.toHaveBeenCalled()

		await vi.advanceTimersByTimeAsync(1)
		await promise

		expect(resolved).toHaveBeenCalledTimes(1)
	})
})
