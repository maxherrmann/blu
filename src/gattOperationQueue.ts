import { BluGATTOperationError, BluGATTOperationQueueError } from "./errors"
import { BluEventEmitter, BluEvents } from "./eventEmitter"

/**
 * Queue for GATT operations.
 * @sealed
 */
export default class BluGATTOperationQueue extends BluEventEmitter<BluGATTOperationQueueEvents> {
	/**
	 * The timeout in milliseconds for each GATT operation.
	 */
	#operationTimeout = 5000

	/**
	 * Is the device busy?
	 */
	#isBusy = false

	/**
	 * Is the device busy?
	 * @readonly
	 */
	get isBusy() {
		return this.#isBusy
	}

	/**
	 * Add a GATT operation to the queue and wait for its result.
	 * @param callback - The GATT operation.
	 * @returns A `Promise` that resolves with the GATT operation's result.
	 * @throws A {@link BluGATTOperationQueueError} when invalid arguments were
	 *  provided.
	 * @throws A {@link BluGATTOperationError} when something went wrong during a
	 *  GATT operation.
	 */
	async add<ResultType>(callback: () => Promise<ResultType>) {
		if (typeof callback !== "function") {
			throw new BluGATTOperationQueueError(
				`Argument "callback" must be of type "function".`,
			)
		}

		await this.#onceReadyForGATTOperation()

		const timeout = setTimeout(() => {
			throw new BluGATTOperationError(
				`GATT operation timed out after ${this.#operationTimeout} ms.`,
			)
		}, this.#operationTimeout)

		this.#isBusy = true
		this.emit("operation-started")

		let result: ResultType

		try {
			result = await callback()
		} catch (error) {
			throw new BluGATTOperationError("GATT operation failed.", error)
		}

		clearTimeout(timeout)
		this.#isBusy = false
		this.emit("operation-finished")

		return result
	}

	/**
	 * Wait for the device to be ready for the next GATT operation.
	 */
	async #onceReadyForGATTOperation() {
		return new Promise<void>(resolve => {
			if (!this.#isBusy) {
				resolve()
			} else {
				this.once("operation-finished", () => {
					resolve()
				})
			}
		})
	}
}

/**
 * GATT operation queue events.
 * @sealed
 */
export interface BluGATTOperationQueueEvents extends BluEvents {
	/**
	 * A GATT operation has started.
	 * @eventProperty
	 */
	"operation-started": () => void

	/**
	 * A GATT operation has finished.
	 * @eventProperty
	 */
	"operation-finished": () => void
}
