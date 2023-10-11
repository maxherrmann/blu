import { BluRequestConstructionError } from "./errors"
import BluResponse from "./response"
import isBufferSource from "./utils/isBufferSource"

/**
 * Request that may be sent to a Bluetooth characteristic or descriptor.
 * @remarks Meant to be extended to implement custom properties.
 * @public
 */
export default class BluRequest {
	/**
	 * The request's response type.
	 * @remarks Will be used to construct the response to this request. Meant to
	 *  be overridden by class extensions.
	 * @defaultValue {@link BluResponse} itself.
	 * @readonly
	 * @virtual
	 */
	readonly responseType = BluResponse

	/**
	 * The request's raw data.
	 * @readonly
	 * @sealed
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
				`Argument "data" must be a buffer source.`,
			)
		}

		this.data = data
	}
}
