export default class BluError extends Error {
	constructor(message, underlyingError) {
		super(message, { cause: underlyingError })

		if (Error.captureStackTrace) {
			Error.captureStackTrace(this, this.constructor)
		}

		this.name = this.constructor.name

		if (underlyingError) {
			this.message += ` // ${underlyingError.name}: ${underlyingError.message}`
		}
	}
}