import { BluResponseConstructionError } from "./errors.js"
import BluResponse from "./response.js"

/**
 * Compound response that may be received from a Bluetooth characteristic or
 * descriptor.
 * @remarks Constructed from several partial responses. Meant to be extended to
 *  implement custom properties.
 */
export default class BluCompoundResponse {
	/**
	 * A validator function for this compound response, that is used to validate
	 *  incoming compound responses in order to match them to a given request.
	 * @remarks Meant to be overridden by class extensions. If it returns `true`
	 *  the compound response is considered a matching response for the given
	 *  request. If it returns `false` the compound response is considered to
	 *  not be a match and is ignored. Returns `true` by default.
	 * @param response - The incoming compound response to validate.
	 * @returns The validation result.
	 * @virtual
	 */
	static compoundValidator(response: BluCompoundResponse) {
		void response
		return true
	}

	/**
	 * A validator function for partial responses of this compound response,
	 * that is used to validate a partial response in order to match it to a
	 * given request.
	 * @remarks Meant to be overridden by class extensions. If it returns `true`
	 *  the partial response is considered a matching response for the given
	 *  request. If it returns `false` the partial response is considered to not
	 *  be a match and is ignored. Returns `true` by default.
	 * @param response - The incoming response to validate.
	 * @returns The validation result.
	 * @virtual
	 */
	static validator(response: BluResponse) {
		void response
		return true
	}

	/**
	 * The partial responses used to create this compound response.
	 */
	#partialResponses: BluResponse[] = []

	/**
	 * Construct a compound response.
	 * @param partialResponses - The partial responses used to create this
	 *  response.
	 * @throws A {@link BluResponseConstructionError} when invalid arguments
	 *  were provided.
	 */
	constructor(...partialResponses: BluResponse[]) {
		if (
			partialResponses.some(
				(partialResponse) => !(partialResponse instanceof BluResponse),
			)
		) {
			throw new BluResponseConstructionError(
				`Argument "partialResponses" must be a collection of ` +
					`"BluResponse".`,
			)
		}

		this.#partialResponses = partialResponses
	}

	/**
	 * The partial responses used to create this compound response.
	 * @readonly
	 */
	get partialResponses() {
		return this.#partialResponses
	}

	/**
	 * A validator function for partial responses of this compound response,
	 * that is used to determine if the partial response will be followed-up
	 * with another partial response.
	 * @remarks Meant to be overridden by class extensions. If it returns `true`
	 *  the partial response will be followed-up with another partial response.
	 *  If it returns `false` the partial response is the last partial response
	 *  of this compound response. Returns `false` by default.
	 * @param partialResponse - The partial response to validate.
	 * @returns The validation result.
	 * @virtual
	 */
	hasFollowUpResponseValidator(partialResponse: BluResponse) {
		void partialResponse
		return false
	}

	/**
	 * A sanitizer function that is used to sanitize the data of all partial
	 * responses of this compound response.
	 * @remarks Meant to be overridden by class extensions. Can be used to
	 *  remove certain data from the partial responses to make further
	 *  processing easier. Does nothing by default. Runs after all validators.
	 * @param partialResponse - The partial response whose data to sanitize.
	 * @virtual
	 */
	sanitizer(partialResponse: BluResponse) {
		void partialResponse
	}

	/**
	 * Add a partial response to this compound response.
	 * @param partialResponse - The partial response to add.
	 */
	addPartialResponse(partialResponse: BluResponse) {
		this.#partialResponses.push(partialResponse)
	}
}
