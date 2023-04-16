import EventEmitter from "../utils/eventEmitter.js"

export default class Service extends EventEmitter {
	device
	description
	characteristics

	_bluetoothService

	constructor(device, bluetoothService, description) {
		super()

		this.device = device
		this.description = description
		this.characteristics = []

		this._bluetoothService = bluetoothService
	}

	get uuid() {
		return this._bluetoothService.uuid
	}

	async onceReady() {}
}