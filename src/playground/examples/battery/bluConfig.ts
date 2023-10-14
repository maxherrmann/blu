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
			uuid: "0000180f-0000-1000-8000-00805f9b34fb",
			identifier: "batteryService",
			name: "Battery Service",
			type: BatteryService,
			characteristicDescriptions: [
				new BluCharacteristicDescription({
					uuid: "00002a19-0000-1000-8000-00805f9b34fb",
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
