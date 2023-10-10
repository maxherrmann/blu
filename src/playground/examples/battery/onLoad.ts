import { bluetooth } from "@blu.js/blu"
import { domNode } from "../../utils"
import { BatteryDevice } from "./bluConfig"

export default function onLoad() {
	const batteryLevelNode = domNode("#battery-level")

	bluetooth.on("device-connected", device => {
		if (device instanceof BatteryDevice) {
			updateBatteryLevel(device.batteryLevel)
			device.on("battery-level-changed", updateBatteryLevel)
		}
	})

	function updateBatteryLevel(batteryLevel?: number) {
		batteryLevelNode.innerHTML = batteryLevel
			? `${batteryLevel}%`
			: "Unknown"
	}
}
