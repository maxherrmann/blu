import {
	BluCharacteristicDescription,
	BluConfigurationOptions,
	BluDevice,
	BluServiceDescription,
} from "@blu.js/blu"
import { BatteryLevelCharacteristic, BatteryService } from "./battery"

export class BatteryDevice extends BluDevice {
	static override protocol = [
		new BluServiceDescription({
			uuid: 0x180f,
			identifier: "batteryService",
			name: "Battery Service",
			type: BatteryService,
			characteristicDescriptions: [
				new BluCharacteristicDescription({
					uuid: 0x2a19,
					identifier: "batteryLevelCharacteristic",
					name: "Battery Level Characteristic",
					type: BatteryLevelCharacteristic,
					descriptorDescriptions: [],
					expectedProperties: "R--N",
				}),
			],
		}),
	]

	batteryService!: BatteryService

	get batteryLevel() {
		return this.batteryService.batteryLevel
	}
}

const scannerConfig: BluConfigurationOptions["scannerConfig"] = {
	acceptAllDevices: true,
	optionalServices: BatteryDevice.protocol.map(
		serviceDescription => serviceDescription.uuid,
	),
}

export default {
	scannerConfig: scannerConfig,
	deviceType: BatteryDevice,
} as BluConfigurationOptions
