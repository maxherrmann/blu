import Response from "./response.js"

import BluError from "../utils/bluError.js"
import isTypedArray from "../utils/isTypedArray.js"

export default class Request {
	responseType = Response
	data

	constructor(...data) {
		if (data.length === 0) {
			throw new RequestConstructionError(`Argument "data" is required.`)
		}

		if (isTypedArray(data[0]) && data[1] === undefined) {
			this.data = data[0]
		}
		else {
			if (!data.every(entry => typeof entry === "number")) {
				throw new RequestConstructionError(
					`Argument "data" must be an array of items ` +
					`that are all of type "number".`
				)
			}

			this.data = new Uint8Array(data)
		}
	}
}

class RequestConstructionError extends BluError {}