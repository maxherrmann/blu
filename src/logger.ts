import { BluLoggerError } from "./errors"

/**
 * Logger.
 * @sealed
 * @public
 */
export class BluLogger {
	/**
	 * Include timestamps in every message?
	 */
	includeTimestamps = false

	/**
	 * Include log level names in every message?
	 */
	includeLevelNames = false

	/**
	 * The current message prefix.
	 */
	#prefix = ""

	/**
	 * The current log level.
	 */
	#level = 0

	/**
	 * The current log target.
	 */
	#target: Pick<Console, "log" | "debug" | "warn" | "error"> = console

	/**
	 * The current enabled state.
	 */
	#isEnabled = true

	/**
	 * Is logging enabled?
	 * @readonly
	 */
	get isEnabled() {
		return this.#isEnabled
	}

	/**
	 * Get the current log target.
	 * @defaultValue `console`
	 * @readonly
	 */
	get target() {
		return this.#target
	}

	/**
	 * Enable logging.
	 */
	enable() {
		if (this.#isEnabled) {
			this.warn("Already enabled.", this)
		}

		this.#isEnabled = true
	}

	/**
	 * Disable logging.
	 */
	disable() {
		if (!this.#isEnabled) {
			this.warn("Already disabled.", this)
		}

		this.#isEnabled = false
	}

	/**
	 * Set a custom message prefix.
	 * @param prefix - The prefix.
	 * @throws A {@link BluLoggerError} when invalid arguments were provided.
	 */
	setPrefix(prefix: string) {
		if (typeof prefix !== "string") {
			throw new BluLoggerError(
				`Argument "prefix" must be of type "string".`,
			)
		}

		this.#prefix = prefix
	}

	/**
	 * Set a log level.
	 * @param level - The level. "debug", "log", "warn" or "error".
	 * @throws A {@link BluLoggerError} when invalid arguments were provided.
	 */
	setLevel(level: "debug" | "log" | "warn" | "error") {
		if (
			typeof level !== "string" ||
			!["debug", "log", "warn", "error"].includes(level)
		) {
			throw new BluLoggerError(
				`Argument "level" must be of type "string" and be one of the ` +
					`following: "debug", "log", "warn" or "error".`,
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

	/**
	 * Set a logging target.
	 * @param consoleLike - The console-like logging target.
	 * @throws A {@link BluLoggerError} when invalid arguments were provided.
	 */
	setTarget(consoleLike: Pick<Console, "log" | "debug" | "warn" | "error">) {
		if (
			typeof consoleLike !== "object" ||
			typeof consoleLike.log !== "function" ||
			typeof consoleLike.debug !== "function" ||
			typeof consoleLike.warn !== "function" ||
			typeof consoleLike.error !== "function"
		) {
			throw new BluLoggerError(
				`Argument "consoleLike" must be an object that implements the ` +
					`following functions: "log", "debug", "warn" and "error".`,
			)
		}

		this.#target = consoleLike
	}

	/**
	 * Log a debug message.
	 * @param message - The message.
	 * @param origin - The origin entity. Used for the message
	 *  prefix.
	 */
	debug(message: string, origin?: string | object) {
		if (!this.#isEnabled || this.#level > 0) {
			return
		}

		this.#target.debug(this.#getMessagePrefix("debug", origin) + message)
	}

	/**
	 * Log a generic message.
	 * @param message - The message.
	 * @param origin - The origin entity. Used for the message
	 *  prefix.
	 */
	log(message: string, origin?: string | object) {
		if (!this.#isEnabled || this.#level > 1) {
			return
		}

		this.#target.log(this.#getMessagePrefix("log", origin) + message)
	}

	/**
	 * Log a warning message.
	 * @param message - The message.
	 * @param origin - The origin entity. Used for the message
	 *  prefix.
	 */
	warn(message: string, origin?: string | object) {
		if (!this.#isEnabled || this.#level > 2) {
			return
		}

		this.#target.warn(this.#getMessagePrefix("warn", origin) + message)
	}

	/**
	 * Log an error.
	 * @param error - The error.
	 * @param origin - The origin entity. Used for the message
	 *  prefix.
	 */
	error(error: string | Error, origin?: string | object) {
		if (!this.#isEnabled) {
			return
		}

		if (error instanceof Error) {
			error = error.toString()
		}

		this.#target.error(this.#getMessagePrefix("error", origin) + error)
	}

	/**
	 * Construct a message prefix.
	 * @param level - The message's log level.
	 * @param origin - The message's origin entity.
	 */
	#getMessagePrefix(level: string, origin?: string | object) {
		let prefix = ""

		if (this.includeTimestamps) {
			prefix += `[${DateFormatter.format(Date.now())}] `
		}

		if (this.includeLevelNames) {
			prefix += `[${level}] `
		}

		if (this.#prefix.length > 0) {
			prefix += `[${this.#prefix}] `
		}

		if (typeof origin === "string") {
			prefix += `${origin}: `
		} else if (origin?.constructor) {
			prefix += `${origin.constructor.name}: `
		}

		return prefix
	}
}

/**
 * Date formatter.
 */
const DateFormatter = new Intl.DateTimeFormat("en-US", {
	hour12: false,
	hour: "numeric",
	minute: "numeric",
	second: "numeric",
	fractionalSecondDigits: 3,
})

/**
 * Blu's global logger.
 * @remarks Handles all Blu-related logging. Logs messages to the `console`,
 *  unless a different logging target has been set with
 *  {@link BluLogger.setTarget}.
 * @public
 */
const logger = new BluLogger()
export default logger
