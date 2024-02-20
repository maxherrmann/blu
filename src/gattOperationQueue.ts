import { BluGATTOperationError, BluGATTOperationQueueError } from "./errors"

/**
 * Queue for GATT operations.
 */
export default class BluGATTOperationQueue {
	/**
	 * GATT operation queue.
	 */
	#queue: (() => Promise<unknown>)[] = []

	/**
	 * Is the device busy with performing another GATT operation?
	 */
	#isBusy = false

	/**
	 * Add a GATT operation to the queue and wait for its result.
	 * @remarks A GATT operation times out when it takes more than 5000
	 *  milliseconds.
	 * @param callback - The GATT operation.
	 * @returns A `Promise` that resolves with the GATT operation's result.
	 * @throws A {@link BluGATTOperationQueueError} when invalid arguments were
	 *  provided.
	 * @throws A {@link BluGATTOperationError} when something went wrong during
	 *  the GATT operation or when it timed out.
	 */
	async add<ResultType>(callback: () => Promise<ResultType>) {
		return new Promise<ResultType>((resolve, reject) => {
			if (typeof callback !== "function") {
				reject(
					new BluGATTOperationQueueError(
						`Argument "callback" must be of type "function".`,
					),
				)

				return
			}

			this.#queue.push(async () => {
				let isTimeoutReached = false

				const timeout = setTimeout(() => {
					isTimeoutReached = true

					reject(
						new BluGATTOperationError(
							`GATT operation timed out after ` +
								`${GATT_OPERATION_TIMEOUT} ms.`,
						),
					)
				}, GATT_OPERATION_TIMEOUT)

				try {
					const result = await callback()

					if (isTimeoutReached) {
						return
					}

					clearTimeout(timeout)

					resolve(result)
				} catch (error) {
					if (isTimeoutReached) {
						return
					}

					clearTimeout(timeout)

					reject(
						new BluGATTOperationError(
							"GATT operation failed.",
							error,
						),
					)
				}
			})

			this.#processQueue().catch(error => {
				reject(error)
			})
		})
	}

	/**
	 * Process the GATT operation queue.
	 */
	async #processQueue() {
		if (this.#isBusy) {
			return
		}

		this.#isBusy = true

		try {
			while (this.#queue.length > 0) {
				const callback = this.#queue.shift()!

				await callback()
			}
		} catch (error) {
			throw error
		} finally {
			this.#isBusy = false
		}
	}
}

/**
 * The time in milliseconds after which a GATT operation should time out.
 */
const GATT_OPERATION_TIMEOUT = 5000
