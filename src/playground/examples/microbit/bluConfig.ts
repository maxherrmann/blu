import {
	BluCharacteristicDescription,
	BluConfigurationOptions,
	BluDevice,
	BluServiceDescription,
} from "@blu.js/blu"
import {
	AccelerometerDataCharacteristic,
	AccelerometerPeriodCharacteristic,
	AccelerometerService,
} from "./accelerometer"
import {
	ButtonAStateCharacteristic,
	ButtonBStateCharacteristic,
	ButtonService,
} from "./button"
import {
	DeviceInformationService,
	FirmwareRevisionCharacteristic,
	HardwareRevisionCharacteristic,
	ManufacturerNameCharacteristic,
	ModelNumberCharacteristic,
	SerialNumberCharacteristic,
} from "./deviceInformation"
import {
	TemperatureCharacteristic,
	TemperaturePeriodCharacteristic,
	TemperatureService,
} from "./temperature"

export class Microbit extends BluDevice {
	static override protocol = [
		new BluServiceDescription({
			uuid: "0000180a-0000-1000-8000-00805f9b34fb",
			identifier: "deviceInformationService",
			name: "BluDevice Information Service",
			type: DeviceInformationService,
			characteristicDescriptions: [
				new BluCharacteristicDescription({
					uuid: "00002a24-0000-1000-8000-00805f9b34fb",
					identifier: "modelNumberCharacteristic",
					name: "Model Number Characteristic",
					type: ModelNumberCharacteristic,
					descriptorDescriptions: [],
					expectedProperties: "R---",
				}),
				new BluCharacteristicDescription({
					uuid: "00002a25-0000-1000-8000-00805f9b34fb",
					identifier: "serialNumberCharacteristic",
					name: "Serial Number Characteristic",
					type: SerialNumberCharacteristic,
					descriptorDescriptions: [],
					expectedProperties: "R---",
				}),
				new BluCharacteristicDescription({
					uuid: "00002a26-0000-1000-8000-00805f9b34fb",
					identifier: "hardwareRevisionCharacteristic",
					name: "Hardware Revision Characteristic",
					type: HardwareRevisionCharacteristic,
					descriptorDescriptions: [],
					expectedProperties: "R---",
				}),
				new BluCharacteristicDescription({
					uuid: "00002a27-0000-1000-8000-00805f9b34fb",
					identifier: "firmwareRevisionCharacteristic",
					name: "Firmware Revision Characteristic",
					type: FirmwareRevisionCharacteristic,
					descriptorDescriptions: [],
					expectedProperties: "R---",
				}),
				new BluCharacteristicDescription({
					uuid: "00002a29-0000-1000-8000-00805f9b34fb",
					identifier: "manufacturerNameCharacteristic",
					name: "Manufacturer Name Characteristic",
					type: ManufacturerNameCharacteristic,
					descriptorDescriptions: [],
					expectedProperties: "R---",
				}),
			],
		}),
		new BluServiceDescription({
			uuid: "e95d0753-251d-470a-a062-fa1922dfa9a8",
			identifier: "accelerometerService",
			name: "Accelerometer Service",
			type: AccelerometerService,
			characteristicDescriptions: [
				new BluCharacteristicDescription({
					uuid: "e95dca4b-251d-470a-a062-fa1922dfa9a8",
					identifier: "accelerometerDataCharacteristic",
					name: "Accelerometer Data Characteristic",
					type: AccelerometerDataCharacteristic,
					descriptorDescriptions: [],
					expectedProperties: "R--N",
				}),
				new BluCharacteristicDescription({
					uuid: "e95dfb24-251d-470a-a062-fa1922dfa9a8",
					identifier: "accelerometerPeriodCharacteristic",
					name: "Accelerometer Period Characteristic",
					type: AccelerometerPeriodCharacteristic,
					descriptorDescriptions: [],
					expectedProperties: "RW--",
				}),
			],
		}),
		new BluServiceDescription({
			uuid: "e95d9882-251d-470a-a062-fa1922dfa9a8",
			identifier: "buttonService",
			name: "Button Service",
			type: ButtonService,
			characteristicDescriptions: [
				new BluCharacteristicDescription({
					uuid: "e95dda90-251d-470a-a062-fa1922dfa9a8",
					identifier: "buttonAStateCharacteristic",
					name: "Button A State Characteristic",
					type: ButtonAStateCharacteristic,
					descriptorDescriptions: [],
					expectedProperties: "R--N",
				}),
				new BluCharacteristicDescription({
					uuid: "e95dda91-251d-470a-a062-fa1922dfa9a8",
					identifier: "buttonBStateCharacteristic",
					name: "Button B State Characteristic",
					type: ButtonBStateCharacteristic,
					descriptorDescriptions: [],
					expectedProperties: "R--N",
				}),
			],
		}),
		new BluServiceDescription({
			uuid: "e95d6100-251d-470a-a062-fa1922dfa9a8",
			identifier: "temperatureService",
			name: "Temperature Service",
			type: TemperatureService,
			characteristicDescriptions: [
				new BluCharacteristicDescription({
					uuid: "e95d9250-251d-470a-a062-fa1922dfa9a8",
					identifier: "temperatureCharacteristic",
					name: "Temperature Characteristic",
					type: TemperatureCharacteristic,
					descriptorDescriptions: [],
					expectedProperties: "R--N",
				}),
				new BluCharacteristicDescription({
					uuid: "e95d1b25-251d-470a-a062-fa1922dfa9a8",
					identifier: "temperaturePeriodCharacteristic",
					name: "Temperature Period Characteristic",
					type: TemperaturePeriodCharacteristic,
					descriptorDescriptions: [],
					expectedProperties: "RW--",
				}),
			],
		}),
	]

	deviceInformationService!: DeviceInformationService
	accelerometerService!: AccelerometerService
	buttonService!: ButtonService
	temperatureService!: TemperatureService

	get modelNumber() {
		return this.deviceInformationService.modelNumber
	}

	get serialNumber() {
		return this.deviceInformationService.serialNumber
	}

	get hardwareRevision() {
		return this.deviceInformationService.hardwareRevision
	}

	get firmwareRevision() {
		return this.deviceInformationService.firmwareRevision
	}

	get manufacturerName() {
		return this.deviceInformationService.manufacturerName
	}

	get accelerometerData() {
		return this.accelerometerService.accelerometerData
	}

	get accelerometerPeriod() {
		return this.accelerometerService.accelerometerPeriod
	}

	setAccelerometerPeriod(
		...args: Parameters<AccelerometerService["setAccelerometerPeriod"]>
	) {
		return this.accelerometerService.setAccelerometerPeriod(...args)
	}

	get buttonStates() {
		return this.buttonService.buttonStates
	}

	get temperature() {
		return this.temperatureService.temperature
	}

	get temperaturePeriod() {
		return this.temperatureService.temperaturePeriod
	}

	setTemperaturePeriod(
		...args: Parameters<TemperatureService["setTemperaturePeriod"]>
	) {
		return this.temperatureService.setTemperaturePeriod(...args)
	}
}

const deviceScannerConfig: BluConfigurationOptions["deviceScannerConfig"] = {
	filters: [
		{
			namePrefix: "BBC micro:bit",
		},
	],
	optionalServices: Microbit.protocol.map(
		serviceDescription => serviceDescription.uuid,
	),
}

export default {
	deviceScannerConfig: deviceScannerConfig,
	deviceType: Microbit,
	deviceProtocolMatching: "off",
	deviceConnectionTimeout: 10000,
} as BluConfigurationOptions
