import { BluCharacteristic, BluResponse, BluService } from "@blu.js/blu"
import { bufferToString } from "./utils"

export class DeviceInformationService extends BluService {
	modelNumberCharacteristic?: ModelNumberCharacteristic
	serialNumberCharacteristic?: SerialNumberCharacteristic
	hardwareRevisionCharacteristic?: HardwareRevisionCharacteristic
	firmwareRevisionCharacteristic?: FirmwareRevisionCharacteristic
	manufacturerNameCharacteristic?: ManufacturerNameCharacteristic

	get modelNumber() {
		return this.modelNumberCharacteristic?.dataString
	}

	get serialNumber() {
		return this.serialNumberCharacteristic?.dataString
	}

	get hardwareRevision() {
		return this.hardwareRevisionCharacteristic?.dataString
	}

	get firmwareRevision() {
		return this.firmwareRevisionCharacteristic?.dataString
	}

	get manufacturerName() {
		return this.manufacturerNameCharacteristic?.dataString
	}
}

export class DataStringCharacteristic extends BluCharacteristic {
	override responseType = DataStringResponse

	#dataString: DataStringResponse["dataString"]

	override async beforeReady() {
		this.#dataString = (await this.read<DataStringResponse>()).dataString
	}

	get dataString() {
		return this.#dataString
	}
}

class DataStringResponse extends BluResponse {
	get dataString() {
		if (this.data) {
			return bufferToString(this.data)
		}

		return
	}
}

export class FirmwareRevisionCharacteristic extends DataStringCharacteristic {}
export class HardwareRevisionCharacteristic extends DataStringCharacteristic {}
export class ManufacturerNameCharacteristic extends DataStringCharacteristic {}
export class ModelNumberCharacteristic extends DataStringCharacteristic {}
export class SerialNumberCharacteristic extends DataStringCharacteristic {}
