import { z } from "zod"
import type { BluBluetooth } from "./bluetoothInterface.js"
import bluetoothState from "./bluetoothState.js"
import BluDevice from "./device.js"
import { BluConfigurationError } from "./errors.js"
import isBufferSource from "./utils/isBufferSource.js"
import isSubclassOrSame from "./utils/isSubclassOrSame.js"

/**
 * Configuration for Blu.
 */
export class BluConfiguration {
	/**
	 * Active configuration options.
	 */
	#options = defaultOptions

	/**
	 * Active Bluetooth interface.
	 */
	// eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
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
	 * Use a different Bluetooth interface.
	 * @remarks The interface provided will be used for all Bluetooth
	 *  operations. It can be useful to provide a custom interface for utilizing
	 *  Web Bluetooth polyfills. This can potentially allow you to use Blu in
	 *  environments in which Web Bluetooth is not supported by default.
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
		this.#options = defaultOptions
	}
}

/**
 * Configuration options.
 */
export interface BluConfigurationOptions {
	/**
	 * The advertisement scanner configuration.
	 * @remarks Only relevant when you intend to use the experimental
	 *  {@link BluScanner.startScanningForAdvertisements} function.
	 *  You can find an explanation for each property in the
	 *  {@link https://webbluetoothcg.github.io/web-bluetooth/scanning.html#scanning | Web Bluetooth Scanning draft}.
	 * @defaultValue A configuration that instructs the scanner to scan
	 *  for all advertisements.
	 */
	advertisementScannerConfig?: BluetoothLEScanOptions

	/**
	 * The device scanner configuration.
	 * @remarks You can find an explanation for each property in the
	 *  {@link https://developer.mozilla.org/en-US/docs/Web/API/Bluetooth/requestDevice#parameters | MDN documentation}.
	 *  Setting the `optionalServices` property here has no effect, as it will
	 *  be automatically populated by Blu with services that are **not** marked
	 *  as {@link BluServiceDescription.advertised | advertised} in the
	 *  {@link BluDevice.interface} of the configured
	 *  {@link BluConfigurationOptions.deviceType}.
	 * @defaultValue A configuration that instructs the scanner to scan for all
	 *  devices.
	 */
	deviceScannerConfig?: RequestDeviceOptions

	/**
	 * The device type.
	 * @remarks Will be used to construct device objects for newly scanned
	 *  devices.
	 * @defaultValue The type of {@link BluDevice}.
	 */
	deviceType?: typeof BluDevice

	/**
	 * The device interface matching type.
	 * @remarks Will be evaluated during interface discovery, when connecting
	 *  new devices. Instructs Blu how to handle discrepancies between the
	 *  expected and actual Bluetooth interfaces of devices when trying to
	 *  connect them. The expected Bluetooth interface is inferred from the
	 *  {@link BluDevice.interface} of the configured
	 *  {@link BluConfigurationOptions.deviceType}. Components discovered
	 *  through
	 *  {@link BluConfigurationOptions.deviceInterfaceExtensiveDiscovery} will
	 *  not be considered when evaluating discrepancies.
	 *
	 *  **Available options**
	 *
	 *  - `true`: The device's Bluetooth interface must exactly match all
	 *  expectations, but can include additional services, characteristics or
	 *  descriptors. A connection attempt will fail if any of the device's
	 *  expected endpoints are missing or if any characteristic has mismatching
	 *  "read", "write", "write witout response" and "notify" properties.
	 *
	 *  - `false`: The device's Bluetooth interface must not match any
	 *  expectations. Not recommended for production environments.
	 *
	 *  **Example**
	 *
	 *  - A Bluetooth device is expected to have a battery service. This service
	 *  is somehow missing from the device's actual Bluetooth interface. A
	 *  connection attempt would fail when `deviceInterfaceMatching` is `true`.
	 * @defaultValue `true`
	 */
	deviceInterfaceMatching?: boolean

	/**
	 * The number of available attempts to discover a device's interface.
	 * @remarks When a device's interface cannot be discovered, Blu will retry
	 *  the discovery process up to the specified number of attempts. This can
	 *  be useful when a device's interface is not fully discoverable after
	 *  connecting to it. This can happen due to communication interference or
	 *  other disruptive factors.
	 *
	 *  The given number must be greater than 0 and less than or equal to 10.
	 * @defaultValue `2`
	 */
	deviceInterfaceDiscoveryAttempts?: number

	/**
	 * The delay between subsequent device interface discovery attempts in
	 * milliseconds.
	 * @remarks See
	 *  {@link BluConfigurationOptions.deviceInterfaceDiscoveryAttempts}. Can be
	 *  useful to prevent flooding the Bluetooth stack with requests when a
	 *  device's interface is not fully discoverable after connecting to it.
	 *  This can happen due to communication interference or other disruptive
	 *  factors.
	 *  @defaultValue `100`
	 */
	deviceInterfaceDiscoveryAttemptDelay?: number

	/**
	 * Enable extensive device interface discovery?
	 * @remarks When enabled, Blu will discover all services, characteristics
	 *  and descriptors of a device during interface discovery using
	 *  [`BluetoothRemoteGATTServer.getPrimaryServices()`](https://developer.mozilla.org/en-US/docs/Web/API/BluetoothRemoteGATTServer/getPrimaryServices).
	 *  This may lead to the discovery of services, characteristics
	 *  and descriptors that are not described in the
	 *  {@link BluDevice.interface}. Since this is a time-consuming operation
	 *  that may lead to a significant increase in connection time, it is
	 *  disabled by default.
	 * @defaultValue `false`
	 */
	deviceInterfaceExtensiveDiscovery?: boolean

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
	 * @remarks Will be evaluated during interface discovery, when connecting
	 *  new devices. Can be a `boolean` value or an array of
	 *  {@link BluInterfaceDescription.identifier | characteristic identifiers}.
	 *  If `false`, notifications have to be manually "enabled" for each
	 *  characteristic by invoking
	 *  {@link BluCharacteristic.startListeningForNotifications}.
	 * @defaultValue `true`
	 */
	autoEnableNotifications?: boolean | string[]

	/**
	 * Enable logging?
	 * @defaultValue `true`
	 */
	logging?: boolean

	/**
	 * Enable data transfer logging?
	 * @remarks When data transfer logging is enabled, every data transfer will
	 *  be logged in detail. Great for debugging. Will be ignored if logging is
	 *  disabled.
	 * @defaultValue `false`
	 */
	dataTransferLogging?: boolean
}

/**
 * Default configuration options for Blu.
 */
const defaultOptions: Required<BluConfigurationOptions> = {
	advertisementScannerConfig: { acceptAllAdvertisements: true },
	deviceScannerConfig: { acceptAllDevices: true },
	deviceType: BluDevice,
	deviceInterfaceMatching: true,
	deviceInterfaceDiscoveryAttempts: 2,
	deviceInterfaceDiscoveryAttemptDelay: 100,
	deviceInterfaceExtensiveDiscovery: false,
	deviceConnectionTimeout: false,
	autoEnableNotifications: true,
	logging: true,
	dataTransferLogging: false,
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
		optionalServices: z.array(bluetoothServiceUUIDGuard).optional(),
		optionalManufacturerData: z.array(z.number()).optional(),
	})
	.or(
		z.object({
			acceptAllDevices: z.boolean(),
			optionalServices: z.array(bluetoothServiceUUIDGuard).optional(),
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
			acceptAllAdvertisements: z.boolean(),
			keepRepeatedDevices: z.boolean().optional(),
		}),
	)

/**
 * A zod guard for configuration options.
 */
const configurationOptionsGuard = z
	.object({
		advertisementScannerConfig: bluetoothLEScanOptionsGuard.optional(),
		deviceScannerConfig: requestDeviceOptionsGuard.optional(),
		deviceType: z
			.custom<typeof BluDevice>((x) => isSubclassOrSame(x, BluDevice))
			.optional(),
		deviceInterfaceMatching: z.boolean().optional(),
		deviceInterfaceDiscoveryAttempts: z.number().min(1).max(10).optional(),
		deviceInterfaceDiscoveryAttemptDelay: z.number().optional(),
		deviceInterfaceExtensiveDiscovery: z.boolean().optional(),
		deviceConnectionTimeout: z.number().or(z.literal(false)).optional(),
		autoEnableNotifications: z.boolean().or(z.array(z.string())).optional(),
		logging: z.boolean().optional(),
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
 *  - `advertisementScannerConfig`: `{ acceptAllAdvertisements: true }`
 *
 *  - `deviceScannerConfig`: `{ acceptAllDevices: true }`
 *
 *  - `deviceType`: The type of {@link BluDevice}.
 *
 *  - `deviceInterfaceMatching`: `true`
 *
 *  - `deviceInterfaceDiscoveryAttempts`: `2`
 *
 *  - `deviceInterfaceDiscoveryAttemptDelay`: `100`
 *
 *  - `deviceInterfaceExtensiveDiscovery`: `false`
 *
 *  - `autoEnableNotifications`: `true`
 *
 *  - `logging`: `true`
 *
 *  - `dataTransferLogging`: `false`
 */
const configuration = new BluConfiguration()
export default configuration
