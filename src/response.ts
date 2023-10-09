import { BluResponseConstructionError } from "./errors"
import isArrayBufferView from "./utils/isArrayBufferView"

/**
 * Response that may be received from a Bluetooth characteristic or
 * descriptor.
 * @remarks Meant to be extended to implement custom properties.
 * @public
 */
export default class BluResponse {
	/**
	 * A validator function for this response.
	 * @remarks Used to validate incoming responses in order to match them to a
	 *  given request. Meant to be overridden by class extensions. If it
	 *  returns `true` the response is considered a matching response for the
	 *  given request. If it returns false the response is considered to not be
	 *  a match and is ignored. Returns `true` by default.
	 * @param response - The incoming response.
	 * @returns The validators result.
	 * @virtual
	 */
	static validatorFunction(response: BluResponse) {
		void response
		return true
	}

	/**
	 * The response's raw data. `undefined` when there is no data.
	 * @sealed
	 */
	readonly data?: DataView

	/**
	 * Construct a response.
	 * @param data - The data used to create this response.
	 * @throws A {@link BluResponseConstructionError} when invalid arguments were
	 *  provided.
	 */
	constructor(data?: DataView) {
		if (data !== undefined && !isArrayBufferView(data)) {
			throw new BluResponseConstructionError(
				`Argument "data" must be either of type "DataView", ` +
					`or "undefined".`,
			)
		}

		this.data = data
	}
}
