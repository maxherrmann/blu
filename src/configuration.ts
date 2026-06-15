import { z } from "zod"
import type { BluBluetooth, BluBluetoothDevice } from "./bluetooth-interface.js"
import bluetoothState from "./bluetooth-state.js"
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import type BluCharacteristic from "./characteristic.js"
import type {
	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	BluInterfaceDescription,
	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	BluServiceDescription,
} from "./descriptions.js"
import BluDevice from "./device.js"
import { BluConfigurationError } from "./errors.js"
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import type { BluScanner } from "./scanner.js"
import isBufferSource from "./utils/is-buffer-source.js"
import isSubclassOrSame from "./utils/is-subclass-or-same.js"

/**
 * Configuration for Blu.
 */
export class BluConfiguration {
	/**
	 * Active configuration options.
	 */
	#options = defaultConfigurationOptions

	/**
	 * Active Bluetooth interface.
	 */
	#bluetoothInterface: BluBluetooth = globalThis?.navigator?.bluetooth

	/**
	 * Active configuration options.
	 * @readonly
	 */
	get options() {
		return this.#options
	}

	/**
	 * Active Bluetooth interface.
	 * @readonly
	 */
	get bluetoothInterface() {
		return this.#bluetoothInterface
	}

	/**
	 * Set specific configuration options.
	 * @param options - The configuration options.
	 * @throws A {@link BluConfigurationError} when invalid configuration
	 *  options were provided.
	 */
	set(options: BluConfigurationOptions) {
		try {
			this.#options = configurationOptionsGuard.parse({
				...this.options,
				...options,
			})
		} catch (error) {
			;(error as Error).name = "BluParseError"

			throw new BluConfigurationError(
				`Argument "options" contains invalid configuration options.`,
				error,
			)
		}
	}

	/**
	 * Use a different Bluetooth interface.
	 * @remarks The interface provided will be used for all Bluetooth
	 *  operations. Useful for registering Web Bluetooth polyfills that allow
	 *  you to use Blu in environments in which Web Bluetooth is not supported..
	 */
	useBluetoothInterface(bluetoothInterface: BluBluetooth) {
		this.#bluetoothInterface = bluetoothInterface

		bluetoothState.initialize()
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
		this.#options = defaultConfigurationOptions
	}
}

/**
 * Default configuration options for Blu.
 */
export const defaultConfigurationOptions: BluRequiredConfigurationOptions = {
	advertisementScannerConfiguration: { acceptAllAdvertisements: true },
	deviceScannerConfiguration: { acceptAllDevices: true },
	devices: [
		{
			type: BluDevice,
			validator: () => true,
			interfaceMatching: true,
			interfaceDiscoveryAttempts: 2,
			interfaceDiscoveryAttemptDelay: 100,
			interfaceExtensiveDiscovery: false,
			connectionTimeout: false,
			automaticallyEnableNotifications: true,
		},
	],
	logging: true,
	dataTransferLogging: false,
}

/**
 * Configuration options.
 */
export interface BluRequiredConfigurationOptions {
	/**
	 * The advertisement scanner configuration.
	 * @remarks Only relevant when you intend to use the experimental
	 *  {@link BluScanner.startScanningForAdvertisements} function.
	 *  You can find an explanation for each property in the
	 *  {@link https://webbluetoothcg.github.io/web-bluetooth/scanning.html#scanning | Web Bluetooth Scanning draft}.
	 * @defaultValue `{ acceptAllAdvertisements: true }`
	 */
	advertisementScannerConfiguration: BluetoothLEScanOptions

	/**
	 * The device scanner configuration.
	 * @remarks You can find an explanation for each property in the
	 *  {@link https://developer.mozilla.org/en-US/docs/Web/API/Bluetooth/requestDevice#parameters | MDN documentation}.
	 *
	 *  The `optionalServices` property is omitted, as it will be automatically
	 *  populated by Blu with services that are **not** marked
	 *  as {@link BluServiceDescription.advertised | advertised} in
	 *  the interfaces of all device types from the {@link devices | devices configuration}.
	 *
	 *  Please make sure that the options you provide enable the discovery of
	 *  all devices in your {@link devices | devices configuration}.
	 * @defaultValue `{ acceptAllDevices: true }`
	 */
	deviceScannerConfiguration:
		| {
				filters: BluetoothLEScanFilter[]
				optionalManufacturerData?: number[] | undefined
		  }
		| {
				acceptAllDevices: boolean
				optionalManufacturerData?: number[] | undefined
		  }

	/**
	 * The supported devices.
	 * @remarks When multiple devices are provided, the `validator` function of
	 *  each device will be evaluated in the order of devices in this array.
	 *  This means that if a scanned device matches the `validator` function of
	 *  multiple devices, it will be considered a match for the first device
	 *  with a `validator` function that returns `true`.
	 *
	 *  By default, all scanned devices will be constructed as generic
	 *  {@link BluDevice} instances with default options.
	 */
	devices: {
		/**
		 * The device type.
		 * @remarks Will be used to construct a device object if the scanned
		 *  device passes the `validator` function.
		 * @defaultValue {@link BluDevice}
		 */
		type: typeof BluDevice

		/**
		 * A validator function for scanned devices, that is used to validate
		 * incoming scanned devices in order to match them to a given device
		 * type.
		 * @remarks If it returns `true` the scanned device is considered a
		 *  match for the given device type. If it returns `false` the scanned
		 *  device is considered to not be a match and is ignored. Returns
		 *  `true` by default.
		 * @param bluetoothDevice - The incoming scanned Bluetooth device to
		 *  validate.
		 * @returns The validation result.
		 * @defaultValue `() => true`
		 */
		validator: (bluetoothDevice: BluBluetoothDevice) => boolean

		/**
		 * The device interface matching type.
		 * @remarks Instructs Blu how to handle discrepancies between the
		 *  expected and actual Bluetooth interfaces of the device when trying
		 *  to connect it. The expected Bluetooth interface is inferred from
		 *  the {@link BluDevice.["interface"] | interface} of the configured
		 *  `deviceType`. Components discovered through extensive interface
		 *  discovery (when `interfaceExtensiveDiscovery` is `true`) will not be
		 *  considered when evaluating discrepancies.
		 *
		 *  **Available options**
		 *
		 *  - `true`: The device's Bluetooth interface must exactly match all
		 *  expectations, but can include additional services, characteristics
		 *  or descriptors. A connection attempt will fail if any of the
		 *  device's expected endpoints are missing or if any characteristic has
		 *  mismatching "read", "write", "write witout response" and "notify"
		 *  properties.
		 *
		 *  - `false`: The device's Bluetooth interface must not match any
		 *  expectations. Not recommended for production environments.
		 *
		 *  **Example**
		 *
		 *  - A Bluetooth device is expected to have a battery service. This
		 *  service is somehow missing from the device's actual Bluetooth
		 *  interface. A connection attempt would fail when `interfaceMatching`
		 *  is `true`.
		 * @defaultValue `true`
		 */
		interfaceMatching: boolean

		/**
		 * The number of available attempts to discover the device's interface.
		 * @remarks When a device's interface cannot be discovered, Blu will
		 *  retry the discovery process up to the specified number of attempts.
		 *  This can be useful when a device's interface is not fully
		 *  discoverable after connecting to it. This can happen due to
		 *  communication interference or other disruptive factors.
		 *
		 *  The given number must be greater than 0 and less than or equal to
		 *  10.
		 * @defaultValue `2`
		 */
		interfaceDiscoveryAttempts: number

		/**
		 * The delay between subsequent device interface discovery attempts in
		 * milliseconds.
		 * @remarks See `interfaceDiscoveryAttempts`.
		 *
		 *  Can be useful to prevent flooding the Bluetooth stack with requests
		 *  when a device's interface is not fully discoverable after connecting
		 *  to it. This can happen due to communication interference or other
		 *  disruptive factors.
		 *  @defaultValue `100`
		 */
		interfaceDiscoveryAttemptDelay: number

		/**
		 * Enable extensive device interface discovery?
		 * @remarks When enabled, Blu will discover all services,
		 *  characteristics and descriptors of a device during interface
		 *  discovery using
		 *  [`BluetoothRemoteGATTServer.getPrimaryServices()`](https://developer.mozilla.org/en-US/docs/Web/API/BluetoothRemoteGATTServer/getPrimaryServices).
		 *  This may lead to the discovery of services, characteristics and
		 *  descriptors that are not described in the device's
		 *  {@link BluDevice.["interface"] | interface}. Since this is a
		 *  time-consuming operation that may lead to a significant increase in
		 *  connection time, it is disabled by default.
		 * @defaultValue `false`
		 */
		interfaceExtensiveDiscovery: boolean

		/**
		 * The time to wait for a device connection to be established in
		 * milliseconds before a connection attempt fails.
		 * @remarks Can be `false` (no timeout, i.e. wait indefinitely) or a
		 *  `number` (timeout in milliseconds).
		 *
		 *  Keep in mind that the connection time can vary drastically,
		 *  depending on what tasks you run within the `beforeReady()` hooks
		 *  across the device's interface.
		 * @defaultValue `false`
		 */
		connectionTimeout: number | false

		/**
		 * Automatically listen to notifiable characteristics?
		 * @remarks Can be a `boolean` value or an array of
		 *  {@link BluInterfaceDescription.identifier | characteristic identifiers}.
		 *  If `false`, notification listening has to be manually enabled for
		 *  each characteristic by invoking
		 *  {@link BluCharacteristic.startListeningForNotifications}.
		 * @defaultValue `true`
		 */
		automaticallyEnableNotifications: boolean | string[]
	}[]

	/**
	 * Enable logging?
	 * @defaultValue `true`
	 */
	logging: boolean

	/**
	 * Enable data transfer logging?
	 * @remarks When data transfer logging is enabled, every data transfer will
	 *  be logged in detail. Great for debugging. Will be ignored if logging is
	 *  disabled.
	 * @defaultValue `false`
	 */
	dataTransferLogging: boolean
}

type DeepPartial<T> = {
	[P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P]
}

/**
 * A zod guard for `BluetoothServiceUUID`.
 */
const bluetoothServiceUUIDGuard = z.string().or(z.number())

/**
 * A zod guard for `BluetoothDataFilter`.
 */
const bluetoothDataFilterGuard = z.object({
	dataPrefix: z.custom<BufferSource>((x) => isBufferSource(x)).optional(),
	mask: z.custom<BufferSource>((x) => isBufferSource(x)).optional(),
})

/**
 * A zod guard for `BluetoothManufacturerDataFilter`.
 */
const bluetoothManufacturerDataFilterGuard = bluetoothDataFilterGuard.extend({
	companyIdentifier: z.number(),
})

/**
 * A zod guard for `BluetoothServiceDataFilter`.
 */
const bluetoothServiceDataFilterGuard = bluetoothDataFilterGuard.extend({
	service: bluetoothServiceUUIDGuard,
})

/**
 * A zod guard for `BluetoothLEScanFilter`.
 */
const bluetoothLEScanFilterGuard = z.object({
	name: z.string().optional(),
	namePrefix: z.string().optional(),
	services: z.array(z.string().or(z.number())).optional(),
	manufacturerData: z.array(bluetoothManufacturerDataFilterGuard).optional(),
	serviceData: z.array(bluetoothServiceDataFilterGuard).optional(),
})

/**
 * A zod guard for `RequestDeviceOptions`.
 */
const requestDeviceOptionsGuard = z
	.object({
		filters: z.array(bluetoothLEScanFilterGuard),
		optionalManufacturerData: z.array(z.number()).optional(),
	})
	.or(
		z.object({
			acceptAllDevices: z.boolean(),
			optionalManufacturerData: z.array(z.number()).optional(),
		}),
	)

/**
 * A zod guard for `BluetoothLEScanOptions`.
 */
const bluetoothLEScanOptionsGuard = z
	.object({
		filters: z.array(bluetoothLEScanFilterGuard),
		keepRepeatedDevices: z.boolean().optional(),
	})
	.or(
		z.object({
			acceptAllAdvertisements: z.boolean().optional(),
			keepRepeatedDevices: z.boolean().optional(),
		}),
	)

/**
 * A zod guard for configuration options.
 */
const configurationOptionsGuard = z.strictObject({
	advertisementScannerConfiguration: bluetoothLEScanOptionsGuard.default(
		defaultConfigurationOptions.advertisementScannerConfiguration,
	),
	deviceScannerConfiguration: requestDeviceOptionsGuard.default(
		defaultConfigurationOptions.deviceScannerConfiguration,
	),
	devices: z
		.array(
			z.strictObject({
				type: z
					.custom<
						typeof BluDevice
					>((x) => isSubclassOrSame(x, BluDevice))
					.default(defaultConfigurationOptions.devices[0].type),
				validator: z
					.function({
						input: [
							z.custom<BluBluetoothDevice>(
								(x) => x instanceof Object,
							),
						],
						output: z.boolean(),
					})
					.default(defaultConfigurationOptions.devices[0].validator),
				interfaceMatching: z
					.boolean()
					.default(
						defaultConfigurationOptions.devices[0]
							.interfaceMatching,
					),
				interfaceDiscoveryAttempts: z
					.number()
					.min(1)
					.max(10)
					.default(
						defaultConfigurationOptions.devices[0]
							.interfaceDiscoveryAttempts,
					),
				interfaceDiscoveryAttemptDelay: z
					.number()
					.default(
						defaultConfigurationOptions.devices[0]
							.interfaceDiscoveryAttemptDelay,
					),
				interfaceExtensiveDiscovery: z
					.boolean()
					.default(
						defaultConfigurationOptions.devices[0]
							.interfaceExtensiveDiscovery,
					),
				connectionTimeout: z
					.union([z.number(), z.literal(false)])
					.default(
						defaultConfigurationOptions.devices[0]
							.connectionTimeout,
					),
				automaticallyEnableNotifications: z
					.union([z.boolean(), z.array(z.string())])
					.default(
						defaultConfigurationOptions.devices[0]
							.automaticallyEnableNotifications,
					),
			}),
		)
		.min(1)
		.default(defaultConfigurationOptions.devices),
	logging: z.boolean().default(defaultConfigurationOptions.logging),
	dataTransferLogging: z
		.boolean()
		.default(defaultConfigurationOptions.dataTransferLogging),
})

/**
 * Blu's configuration options.
 */
export type BluConfigurationOptions =
	DeepPartial<BluRequiredConfigurationOptions>

/**
 * Blu's global configuration.
 * @remarks Handles everything related to the configuration of the Blu
 *  framework.
 */
const configuration = new BluConfiguration()
export default configuration
