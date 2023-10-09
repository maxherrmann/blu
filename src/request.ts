import { BluRequestConstructionError } from "./errors"
import BluResponse from "./response"
import isArrayBufferView from "./utils/isArrayBufferView"

/**
 * Request that may be sent to a Bluetooth characteristic or descriptor.
 * @remarks Meant to be extended to implement custom properties.
 * @public
 */
export default class BluRequest {
	/**
	 * The request's response type.
	 * @remarks Will be used to construct the response to this request. Meant
	 *  to be overridden by class extensions.
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
	readonly data: DataView

	/**
	 * Construct a request.
	 * @param data - The data to be sent with this request.
	 * @throws A {@link BluRequestConstructionError} when invalid arguments were
	 *  provided.
	 */
	constructor(data: DataView) {
		if (!isArrayBufferView(data)) {
			throw new BluRequestConstructionError(
				`Argument "data" must be of type "DataView".`,
			)
		}

		this.data = data
	}
}
