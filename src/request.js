const Response = require("./response.js")

const BluError = require("../utils/bluError.js")
const isTypedArray = require("../utils/isTypedArray.js")

class Request {
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

module.exports = Request