const logger = require("../src/logger.js")

const BluError = require("./bluError.js")

class EventEmitter {
	#strictMode
	#listeners = new Map()
	#mutedChannels = new Set()

	constructor(strictMode = false) {
		if (typeof strictMode !== "boolean") {
			throw new EventEmitterError(`Argument "strictMode" must be of type "boolean".`)
		}

		this.#strictMode = strictMode
	}

	emit(channel, ...payload) {
		if (typeof channel !== "string") {
			throw new EventEmitterError(`Argument "channel" must be of type "string".`)
		}

		if (this.#strictMode && !this.#listeners.has(channel)) {
			throw new EventEmitterError(
				`"${channel}" is not a valid channel. ` +
				`Add it manually or disable strict mode.`
			)
		}

		if (!this.#listeners.has(channel)) {
			this.#listeners.set(channel, new Set())
		}

		if (this.#mutedChannels.has(channel)) {
			logger.debug(`Suppressed event for the muted channel "${channel}".`, this)

			return
		}

		for (const callback of this.#listeners.get(channel)) {
			callback(...payload)
		}
	}

	on(channel, callback) {
		if (typeof channel !== "string") {
			throw new EventEmitterError(`Argument "channel" must be of type "string".`)
		}

		if (typeof callback !== "function") {
			throw new EventEmitterError(`Argument "callback" must be of type "function".`)
		}

		if (this.#strictMode && !this.#listeners.has(channel)) {
			throw new EventEmitterError(
				`"${channel}" is not a valid channel. ` +
				`Add it manually or disable strict mode.`
			)
		}

		if (!this.#listeners.has(channel)) {
			this.#listeners.set(channel, new Set())
		}

		this.#listeners.set(channel, this.#listeners.get(channel).add(callback))
	}

	once(channel, callback) {
		let onceCallback = () => {
			this.off(channel, onceCallback)
			callback()
		}

		this.on(channel, onceCallback)
	}

	muteChannel(channel) {
		if (typeof channel !== "string") {
			throw new EventEmitterError(`Argument "channel" must be of type "string".`)
		}

		if (!this.#listeners.has(channel)) {
			throw new EventEmitterError(`"${channel}" is not a valid channel.`)
		}

		if (this.#mutedChannels.has(channel)) {
			logger.warn(`The channel "${channel}" is already muted.`, this)

			return
		}

		this.#mutedChannels.add(channel)
	}

	unmuteChannel(channel) {
		if (typeof channel !== "string") {
			throw new EventEmitterError(`Argument "channel" must be of type "string".`)
		}

		if (!this.#listeners.has(channel)) {
			throw new EventEmitterError(`"${channel}" is not a valid channel.`)
		}

		if (!this.#mutedChannels.has(channel)) {
			logger.warn(`The channel "${channel}" is already unmuted.`, this)

			return
		}

		this.#mutedChannels.delete(channel)
	}

	off(channel, callback) {
		if (typeof channel !== "string") {
			throw new EventEmitterError(`Argument "channel" must be of type "string".`)
		}

		if (typeof callback !== "function") {
			throw new EventEmitterError(`Argument "callback" must be of type "function".`)
		}

		if (!this.#listeners.has(channel)) {
			throw new EventEmitterError(`"${channel}" is not a valid channel.`)
		}

		if (!this.#listeners.get(channel).delete(callback)) {
			logger.warn(
				`Cannot remove the function in argument "callback", ` +
				`as it is not yet registered for "${channel}".`,
				this
			)
		}
	}

	addChannel(channel) {
		if (typeof channel !== "string") {
			throw new EventEmitterError(`Argument "channel" must be of type "string".`)
		}

		if (!this.#listeners.has(channel)) {
			this.#listeners.set(channel, new Set())
		}
		else {
			logger.warn(`The channel "${channel}" already exists.`, this)
		}
	}

	removeChannel(channel) {
		if (typeof channel !== "string") {
			throw new EventEmitterError(`Argument "channel" must be of type "string".`)
		}

		if (this.#listeners.has(channel)) {
			this.#listeners.delete(channel)
		}
		else {
			logger.warn(`The channel "${channel}" does not exist.`, this)
		}
	}

	removeAllListeners(channel) {
		if (channel !== undefined && typeof channel !== "string") {
			throw new EventEmitterError(
				`Argument "channel" must be either "undefined" or of type "string".`
			)
		}

		if (channel) {
			if (this.#listeners.has(channel)) {
				this.#listeners.set(channel, new Set())
			}
			else {
				logger.warn(`The channel "${channel}" does not exist.`, this)
			}
		}
		else {
			this.#listeners.clear()
		}
	}
}

class EventEmitterError extends BluError {}

module.exports = EventEmitter