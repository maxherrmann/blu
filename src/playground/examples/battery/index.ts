import bluConfig from "./bluConfig"
import onLoad from "./onLoad"

export default {
	id: "battery",
	name: "Battery",
	description:
		"Implementation example for a generic Bluetooth device that provides a standard battery service.",
	bluConfig: bluConfig,
	onLoad: onLoad,
} as BluPlaygroundExample
