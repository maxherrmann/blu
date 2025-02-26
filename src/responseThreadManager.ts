import { BluResponseThreadManagerOperationError } from "./errors.js"
import BluResponse from "./response.js"

/**
 * A manager for Blu response threads.
 * @remarks A response thread is a collection of partial responses that are
 *  related to each other and are part of a single compound response.
 *
 *  The manager is intended to be added to a characteristic instance to manage
 *  the partial responses that are received from the device without a prior
 *  request.
 *
 *  The `add` method can be used when a `"notification"` event is received from
 *  the characteristic, and it has been determined that the incoming response
 *  (`event.response`) is a partial response. The value for the `id` parameter
 *  of the `add` method can, for example, be an opcode that is used by the
 *  Bluetooth device to cluster certain events.
 *
 *  The `resolve` method can be used when it is determined that all partial
 *  responses for a given thread have been received. The method will return the
 *  partial responses, which can be used to construct a compound response, and
 *  remove the thread from the manager.
 *
 *  The constructed compound response can then be further processed by
 *  the characteristic instance, for example, by emitting a custom
 *  `"compound-notification"` event.
 */
export default class BluResponseThreadManager {
	#threads = new Map<ThreadId, BluResponse[]>()

	/**
	 * Add a partial response to an existing thread or create a new thread.
	 * @param id - The ID of the thread to add the partial response to. If no
	 *  thread with this ID exists, a new thread will be created.
	 * @param partialResponse - The partial response to add.
	 */
	add(id: ThreadId, partialResponse: BluResponse) {
		const thread = this.#threads.get(id)

		if (thread === undefined) {
			this.#threads.set(id, [partialResponse])
		} else {
			thread.push(partialResponse)
		}
	}

	/**
	 * Check if a thread with the given ID exists.
	 * @param id - The ID of the thread to check.
	 * @returns Whether a thread with the given ID exists.
	 */
	has(id: ThreadId) {
		return this.#threads.has(id)
	}

	/**
	 * Resolve a thread by its ID.
	 * @remarks The thread will be removed from the manager after resolving.
	 * @param id - The ID of the thread to resolve.
	 * @returns The partial responses of the thread.
	 * @throws A {@link BluResponseThreadManagerOperationError} when no thread
	 *  with the given ID exists.
	 */
	resolve(id: ThreadId) {
		const partialResponses = this.#threads.get(id)

		if (partialResponses === undefined) {
			throw new BluResponseThreadManagerOperationError(
				`Could not resolve thread with ID "${String(id)}": ` +
					`No partial responses found.`,
			)
		}

		this.#threads.delete(id)

		return partialResponses
	}
}

type ThreadId = number | string
