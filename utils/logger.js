import BluError from "../utils/bluError.js"

export default class Logger {
	includeTimestamps = false
	includeLevelNames = false

	#prefix = ""
	#level = 0
	#target = console
	#isEnabled = true

	get isEnabled() {
		return this.#isEnabled
	}

	get target() {
		return this.#target
	}

	enable() {
		if (this.#isEnabled) {
			this.warn("Already enabled.", this)
		}

		this.#isEnabled = true
	}

	disable() {
		if (!this.#isEnabled) {
			this.warn("Already disabled.", this)
		}

		this.#isEnabled = false
	}

	setPrefix(prefix) {
		if (typeof prefix !== "string") {
			throw new LoggerError(
				`Argument "prefix" must be of type "string".`
			)
		}

		this.#prefix = prefix
	}

	setPrefix(prefix) {
		if (typeof prefix !== "string") {
			throw new LoggerError(
				`Argument "prefix" must be of type "string".`
			)
		}

		this.#prefix = prefix
	}

	setLevel(level) {
		if (
			typeof level !== "string" ||
			!["debug", "log", "warn", "error"].includes(level)
		) {
			throw new LoggerError(
				`Argument "level" must be of type "string" and be one of the ` +
				`following: "debug", "log", "warn" or "error".`
			)
		}

		switch (level) {
			case "debug":
				this.#level = 0
				break
			case "log":
				this.#level = 1
				break
			case "warn":
				this.#level = 2
				break
			case "error":
				this.#level = 3
				break
		}
	}

	setTarget(consoleLike) {
		if (
			typeof consoleLike !== "object" ||
			typeof consoleLike.log !== "function" ||
			typeof consoleLike.debug !== "function" ||
			typeof consoleLike.warn !== "function" ||
			typeof consoleLike.error !== "function"
		) {
			throw new LoggerError(
				`Argument "consoleLike" must be an object that implements the ` +
				`following functions: "log", "debug", "warn" and "error".`
			)
		}

		this.#target = consoleLike
	}

	debug(message, origin) {
		if (!this.#isEnabled || this.#level > 0) {
			return
		}

		this.#target.debug(this.#getMessagePrefix(origin, "debug") + message)
	}

	log(message, origin) {
		if (!this.#isEnabled || this.#level > 1) {
			return
		}

		this.#target.log(this.#getMessagePrefix(origin, "log") + message)
	}

	warn(message, origin) {
		if (!this.#isEnabled || this.#level > 2) {
			return
		}

		this.#target.warn(this.#getMessagePrefix(origin, "warn") + message)
	}

	error(message, origin) {
		if (!this.#isEnabled) {
			return
		}

		this.#target.error(this.#getMessagePrefix(origin, "error") + message)
	}

	#getMessagePrefix(origin, level) {
		let prefix = ""

		if (!!this.includeTimestamps) {
			prefix += `[${DateFormatter.format(Date.now())}] `
		}

		if (!!this.includeLevelNames) {
			prefix += `[${level}] `
		}

		if (this.#prefix.length > 0) {
			prefix += `[${this.#prefix}] `
		}

		if (typeof origin === "string") {
			prefix += `${origin}: `
		}
		else if (origin?.constructor) {
			prefix += `${origin.constructor.name}: `
		}
		else if (origin?.name) {
			prefix += `${origin.name}: `
		}

		return prefix
	}
}

const DateFormatter = new Intl.DateTimeFormat("en-US", {
	hour12: false,
	hour: "numeric",
	minute: "numeric",
	second: "numeric",
	fractionalSecondDigits: 3
})

class LoggerError extends BluError {}