import {
	BluConfigurationOptions,
	BluDevice,
	BluServiceDescription,
} from "@blu.js/blu"

/**
 * Your device.
 *
 * Used by Blu to construct device objects that implement your own logic.
 */
class MyDevice extends BluDevice {
	/**
	 * Your device's expected protocol.
	 *
	 * Used by Blu to discover your device's actual protocol and compare it to
	 * expectations. It can contain `ServiceDescription`s that describe your
	 * device's expected services, their characteristics and their descriptors.
	 */
	static override protocol: BluServiceDescription[] = []

	// ...
}

/**
 * Your scanner configuration.
 *
 * Used by Blu to identify your device during device scans. This configuration
 * should be as tight as possible to prevent other devices from being scanned.
 */
const scannerConfig: BluConfigurationOptions["scannerConfig"] = {
	/**
	 * Accept all devices.
	 * Should only be used for demonstration purposes.
	 */
	acceptAllDevices: true,

	/**
	 * These services should be discoverable when connecting the device.
	 */
	optionalServices: MyDevice.protocol.map(
		serviceDescription => serviceDescription.uuid,
	),
}

/**
 * Your Blu configuration.
 */
export default {
	scannerConfig: scannerConfig,
	deviceType: MyDevice,
} as BluConfigurationOptions
