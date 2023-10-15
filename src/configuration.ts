import { z } from "zod"
import BluDevice from "./device"
import { BluConfigurationError } from "./errors"
import isBufferSource from "./utils/isBufferSource"
import isSubclassOrSelf from "./utils/isSubclassOrSelf"

import type BluCharacteristic from "./characteristic"
import type { BluProtocolDescription } from "./descriptions"

/**
 * Configuration for Blu.
 * @sealed
 * @public
 */
export class BluConfiguration {
	/**
	 * Active configuration options.
	 */
	#options = defaultOptions

	/**
	 * Active configuration options.
	 * @readonly
	 */
	get options() {
		return this.#options
	}

	/**
	 * Set specific configuration options.
	 * @param options - The configuration options.
	 * @throws A {@link BluConfigurationError} when invalid configuration
	 *  options were provided.
	 */
	set(options: BluConfigurationOptions) {
		try {
			options = configurationOptionsGuard.parse(options)
		} catch (error) {
			if (error instanceof Error) {
				error.name = "BluParseError"
			}

			throw new BluConfigurationError(
				`Argument "options" contains invalid configuration options.`,
				error,
			)
		}

		this.#options = {
			...this.#options,
			...options,
		}
	}

	/**
	 * Get active configuration options.
	 */
	get() {
		return this.options
	}

	/**
	 * Restore the default configuration.
	 */
	restoreDefaults() {
		this.#options = defaultOptions
	}
}

/**
 * Configuration options.
 * @sealed
 * @public
 */
export interface BluConfigurationOptions {
	/**
	 * A device scanner configuration.
	 * @remarks You can find an explanation for each property in the
	 *  {@link https://developer.mozilla.org/en-US/docs/Web/API/Bluetooth/requestDevice#parameters | MDN documentation}.
	 * @defaultValue A configuration that instructs the device scanner to scan
	 *  for all devices.
	 */
	scannerConfig?:
		| {
				filters: {
					name?: string | undefined
					namePrefix?: string | undefined
					services?: (string | number)[] | undefined
					manufacturerData?:
						| {
								companyIdentifier: number
								dataPrefix?: BufferSource | undefined
								mask?: BufferSource | undefined
						  }[]
						| undefined
					serviceData?:
						| {
								service: string | number
								dataPrefix?: BufferSource | undefined
								mask?: BufferSource | undefined
						  }[]
						| undefined
				}[]
				optionalServices?: (string | number)[] | undefined
				optionalManufacturerData?: number[] | undefined
		  }
		| {
				acceptAllDevices: boolean
				optionalServices?: (string | number)[] | undefined
				optionalManufacturerData?: number[] | undefined
		  }

	/**
	 * A device type.
	 * @remarks Will be used to construct device objects for newly scanned
	 *  devices.
	 * @defaultValue {@link BluDevice} itself.
	 */
	deviceType?: typeof BluDevice

	/**
	 * A device protocol matching type.
	 * @remarks Will be evaluated during protocol discovery, when connecting new
	 *  devices. Instructs Blu how to handle discrepancies between the expected
	 *  and actual Bluetooth protocols of devices when trying to connect them.
	 *  The expected Bluetooth protocol is inferred from the
	 *  {@link BluDevice.protocol} of the configured
	 *  {@link BluConfigurationOptions.deviceType}.
	 *
	 *  **Available matching types**
	 *
	 *  - `"default"`: The device's Bluetooth protocol must exactly match all
	 *  expectations, but can include additional services, characteristics or
	 *  descriptors. A connection attempt will fail if any of the device's
	 *  expected endpoints are missing or if any characteristic has mismatching
	 *  properties.
	 *
	 *  - `"minimal"`: The device's Bluetooth protocol must include all expected
	 *  services, characteristics or descriptors. A connection attempt will fail
	 *  if any of the device's expected endpoints are missing, while
	 *  characteristic property mismatches are ignored.
	 *
	 *  - `"off"`: The device's Bluetooth protocol must not match any
	 *  expectations. Not recommended for production environments.
	 *
	 *  **Example**
	 *
	 *  - A Bluetooth device is expected to have a battery service.
	 *  This service is somehow missing from the device's actual Bluetooth
	 *  protocol.
	 *  A connection attempt would fail for the following matching types:
	 *  `"default"`, `"minimal"`.
	 *
	 *  - A Bluetooth device is expected to have a battery service with a
	 *  readable and notifiable characteristic.
	 *  This characteristic is somehow missing its "notifiable" property on the
	 *  device's actual Bluetooth protocol.
	 *  A connection attempt would fail for the following matching types:
	 *  `"default"`.
	 * @defaultValue `"default"`
	 */
	deviceProtocolMatching?: "default" | "minimal" | "off"

	/**
	 * The time to wait for a device connection to be established in
	 * milliseconds before a connection attempt with {@link BluDevice.connect}
	 * fails.
	 * @remarks Can be `false` (no timeout, i.e. wait indefinitely) or a
	 *  `number` of milliseconds.
	 * @defaultValue `false`
	 */
	deviceConnectionTimeout?: number | false

	/**
	 * Automatically listen to notifiable characteristics?
	 * @remarks Will be evaluated during protocol discovery, when connecting new
	 *  devices. Can be a `boolean` value or an array of
	 *  {@link BluProtocolDescription.identifier | characteristic identifiers}.
	 *  If `false`, notifications have to be manually "enabled" for each
	 *  characteristic by invoking
	 *  {@link BluCharacteristic.startListeningForNotifications}.
	 * @defaultValue `true`
	 */
	autoEnableNotifications?: boolean | string[]

	/**
	 * Enable data transfer logging?
	 * @remarks When data transfer logging is enabled, every data transfer will
	 *  be logged in detail. Great for debugging.
	 * @defaultValue `false`
	 */
	dataTransferLogging?: boolean
}

/**
 * Default configuration options for Blu.
 */
const defaultOptions: Required<BluConfigurationOptions> = {
	scannerConfig: { acceptAllDevices: true },
	deviceType: BluDevice,
	deviceProtocolMatching: "default",
	deviceConnectionTimeout: false,
	autoEnableNotifications: true,
	dataTransferLogging: false,
}

/**
 * A zod guard for configuration options.
 */
const configurationOptionsGuard = z
	.object({
		scannerConfig: z
			.object({
				filters: z.array(
					z.object({
						name: z.string().optional(),
						namePrefix: z.string().optional(),
						services: z.array(z.string().or(z.number())).optional(),
						manufacturerData: z
							.array(
								z.object({
									dataPrefix: z
										.custom<BufferSource>(x =>
											isBufferSource(x),
										)
										.optional(),
									mask: z
										.custom<BufferSource>(x =>
											isBufferSource(x),
										)
										.optional(),
									companyIdentifier: z.number(),
								}),
							)
							.optional(),
						serviceData: z
							.array(
								z.object({
									dataPrefix: z
										.custom<BufferSource>(x =>
											isBufferSource(x),
										)
										.optional(),
									mask: z
										.custom<BufferSource>(x =>
											isBufferSource(x),
										)
										.optional(),
									service: z.string().or(z.number()),
								}),
							)
							.optional(),
					}),
				),
				optionalServices: z.array(z.string().or(z.number())).optional(),
				optionalManufacturerData: z.array(z.number()).optional(),
			})
			.or(
				z.object({
					acceptAllDevices: z.boolean(),
					optionalServices: z
						.array(z.string().or(z.number()))
						.optional(),
					optionalManufacturerData: z.array(z.number()).optional(),
				}),
			)
			.optional(),
		deviceType: z
			.custom<typeof BluDevice>(x => isSubclassOrSelf(x, BluDevice))
			.optional(),
		deviceProtocolMatching: z
			.union([
				z.literal("default"),
				z.literal("minimal"),
				z.literal("off"),
			])
			.optional(),
		deviceConnectionTimeout: z.number().or(z.literal(false)).optional(),
		autoEnableNotifications: z.boolean().or(z.array(z.string())).optional(),
		dataTransferLogging: z.boolean().optional(),
	})
	.strict()

/**
 * Blu's global configuration.
 * @remarks Handles everything related to the configuration of the Blu
 *  framework.
 *
 *  **Default configuration**
 *
 *  - `scannerConfig`: `{ acceptAllDevices: true }`
 *
 *  - `deviceType`: {@link BluDevice}
 *
 *  - `deviceProtocolMatching`: `"default"`
 *
 *  - `autoEnableNotifications`: `true`
 *
 *  - `dataTransferLogging`: `false`
 * @public
 */
const configuration = new BluConfiguration()
export default configuration
