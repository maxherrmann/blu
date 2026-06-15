import { describe, expect, it } from "vitest"
import convert, { BluConverter } from "../src/converter"

describe("BluConverter", () => {
	it("exposes a default instance", () => {
		expect(convert).toBeInstanceOf(BluConverter)
	})

	describe("typed array conversions from a single number", () => {
		it("wraps a single number in the typed array", () => {
			expect(Array.from(convert.toInt8Array(1))).toEqual([1])
			expect(Array.from(convert.toUint8Array(2))).toEqual([2])
			expect(Array.from(convert.toUint8ClampedArray(3))).toEqual([3])
			expect(Array.from(convert.toInt16Array(4))).toEqual([4])
			expect(Array.from(convert.toUint16Array(5))).toEqual([5])
			expect(Array.from(convert.toInt32Array(6))).toEqual([6])
			expect(Array.from(convert.toUint32Array(7))).toEqual([7])
			expect(Array.from(convert.toFloat32Array(8))).toEqual([8])
			expect(Array.from(convert.toFloat64Array(9))).toEqual([9])
		})
	})

	describe("typed array conversions from an array", () => {
		it("keeps all elements", () => {
			expect(Array.from(convert.toInt8Array([1, 2]))).toEqual([1, 2])
			expect(Array.from(convert.toUint8Array([1, 2]))).toEqual([1, 2])
			expect(Array.from(convert.toUint8ClampedArray([1, 2]))).toEqual([
				1, 2,
			])
			expect(Array.from(convert.toInt16Array([1, 2]))).toEqual([1, 2])
			expect(Array.from(convert.toUint16Array([1, 2]))).toEqual([1, 2])
			expect(Array.from(convert.toInt32Array([1, 2]))).toEqual([1, 2])
			expect(Array.from(convert.toUint32Array([1, 2]))).toEqual([1, 2])
			expect(Array.from(convert.toFloat32Array([1, 2]))).toEqual([1, 2])
			expect(Array.from(convert.toFloat64Array([1, 2]))).toEqual([1, 2])
		})
	})

	describe("BigInt typed array conversions", () => {
		it("wraps a single bigint", () => {
			expect(Array.from(convert.toBigInt64Array(1n))).toEqual([1n])
			expect(Array.from(convert.toBigUint64Array(2n))).toEqual([2n])
		})

		it("keeps all elements of a bigint array", () => {
			expect(Array.from(convert.toBigInt64Array([1n, 2n]))).toEqual([
				1n,
				2n,
			])
			expect(Array.from(convert.toBigUint64Array([1n, 2n]))).toEqual([
				1n,
				2n,
			])
		})
	})

	describe("string conversions", () => {
		it("encodes a string to a `Uint8Array`", () => {
			expect(Array.from(convert.toUint8Array("AB"))).toEqual([65, 66])
		})

		it("decodes a buffer source to a string", () => {
			expect(convert.toString(new Uint8Array([65, 66]))).toBe("AB")
			expect(convert.toString(new Uint8Array([67, 68]).buffer)).toBe("CD")
		})
	})
})
