import EventEmitter from "../utils/eventEmitter.js"
import BluError from "../utils/bluError.js"

export default class GATTOperationQueue extends EventEmitter {
	#operationTimeout = 5000
	#isGATTOperationInProgress = false

	get isBusy() {
		return this.#isGATTOperationInProgress
	}

	await(callback) {
		return new Promise(async (resolve, reject) => {
			if (typeof callback !== "function") {
				reject(
					new GATTOperationQueueError(
						`Argument "callback" must be of type "function".`
					)
				)

				return
			}

			await this.#onceReadyForGATTOperation()

			let timeout = setTimeout(() => {
				reject(
					new GATTOperationError(
						`GATT operation timed out after ${this.#operationTimeout} ms.`
					)
				)
			}, this.#operationTimeout)

			this.#isGATTOperationInProgress = true

			this.emit("gatt-operation-started")

			callback()
			.then(value => {
				resolve(value)
			})
			.catch(error => {
				reject(error)
			})
			.finally(() => {
				clearTimeout(timeout)

				this.#isGATTOperationInProgress = false

				this.emit("gatt-operation-finished")
			})
		})
	}

	#onceReadyForGATTOperation() {
		return new Promise(resolve => {
			if (!this.#isGATTOperationInProgress) {
				resolve()
			}
			else {
				this.once("gatt-operation-finished", resolve)
			}
		})
	}
}

class GATTOperationQueueError extends BluError {}
class GATTOperationError extends BluError {}