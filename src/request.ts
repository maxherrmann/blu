import BluCompoundResponse from "./compoundResponse.js"
import { BluRequestConstructionError } from "./errors.js"
import BluResponse from "./response.js"
import isBufferSource from "./utils/isBufferSource.js"
import isSubclassOrSame from "./utils/isSubclassOrSame.js"

/**
 * Request that may be sent to a Bluetooth characteristic or descriptor.
 * @remarks Meant to be extended to implement custom properties.
 */
export default class BluRequest {
	/**
	 * The request's response type.
	 * @remarks Will be used to construct the response to this request. Meant to
	 *  be overridden by class extensions.
	 * @defaultValue The type of {@link BluResponse}.
	 * @readonly
	 * @virtual
	 */
	readonly responseType: typeof BluResponse | typeof BluCompoundResponse =
		BluResponse

	/**
	 * The request's raw data.
	 * @readonly
	 */
	readonly data: BufferSource

	/**
	 * Construct a request.
	 * @param data - The data to be sent with this request.
	 * @throws A {@link BluRequestConstructionError} when invalid arguments were
	 *  provided.
	 */
	constructor(data: BufferSource) {
		if (!isBufferSource(data)) {
			throw new BluRequestConstructionError(
				`Argument "data" must be of type "BufferSource".`,
			)
		}

		this.data = data
	}
}

/**
 * Check whether the given request is expecting a compound response.
 * @param request - The request.
 * @returns The result.
 */
export function isRequestExpectingCompoundResponse(
	request: BluRequest,
): request is Omit<BluRequest, "responseType"> & {
	responseType: typeof BluCompoundResponse
} {
	return isSubclassOrSame(request.responseType, BluCompoundResponse)
}
