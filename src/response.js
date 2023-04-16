import BluError from "../utils/bluError.js"
import isTypedArray from "../utils/isTypedArray.js"

export default class Response {
	data

	constructor(data) {
		if (data !== undefined && data !== null && !isTypedArray(data)) {
			throw new ResponseConstructionError(
				`Argument "data" must be either "undefined", ` +
				`"null" or a concrete type of "TypedArray". ` +
				`Got "${data?.constructor.name}" instead.`
			)
		}

		this.data = data ?? null
	}

	static validatorFunction(response) {
		return true
	}
}

class ResponseConstructionError extends BluError {}