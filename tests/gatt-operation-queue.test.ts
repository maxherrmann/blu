import { describe, expect, it, vi } from "vitest"
import {
	BluGATTOperationError,
	BluGATTOperationQueueError,
} from "../src/errors"
import BluGATTOperationQueue from "../src/gatt-operation-queue"

describe("BluGATTOperationQueue", () => {
	it("resolves with the operation's result", async () => {
		const queue = new BluGATTOperationQueue()

		await expect(queue.add(() => Promise.resolve(42))).resolves.toBe(42)
	})

	it("rejects when the callback is not a function", async () => {
		const queue = new BluGATTOperationQueue()

		await expect(
			queue.add("not a function" as unknown as () => Promise<void>),
		).rejects.toBeInstanceOf(BluGATTOperationQueueError)
	})

	it("wraps a failing operation in a GATT operation error", async () => {
		const queue = new BluGATTOperationQueue()

		await expect(
			queue.add(() => Promise.reject(new Error("boom"))),
		).rejects.toBeInstanceOf(BluGATTOperationError)
	})

	it("processes queued operations sequentially", async () => {
		const queue = new BluGATTOperationQueue()
		const order: number[] = []

		const first = queue.add(async () => {
			order.push(1)
			return 1
		})
		const second = queue.add(async () => {
			order.push(2)
			return 2
		})

		await Promise.all([first, second])

		expect(order).toEqual([1, 2])
	})

	it("rejects with a GATT operation error when an operation times out", async () => {
		vi.useFakeTimers()

		const queue = new BluGATTOperationQueue()
		const rejection = expect(
			queue.add(() => new Promise<never>(() => undefined)),
		).rejects.toBeInstanceOf(BluGATTOperationError)

		await vi.advanceTimersByTimeAsync(5000)
		await rejection
	})
})
