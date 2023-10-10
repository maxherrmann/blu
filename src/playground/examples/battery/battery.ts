import { BluCharacteristic, BluResponse, BluService, logger } from "@blu.js/blu"

export class BatteryService extends BluService {
	batteryLevelCharacteristic!: BatteryLevelCharacteristic

	get batteryLevel() {
		return this.batteryLevelCharacteristic.batteryLevel
	}
}

export class BatteryLevelCharacteristic extends BluCharacteristic {
	override responseType = BatteryLevelResponse

	#batteryLevel: BatteryLevelResponse["batteryLevel"]

	override async beforeReady() {
		this.#batteryLevel = (
			await this.read<BatteryLevelResponse>()
		).batteryLevel

		this.on("notification", response => {
			if (
				response instanceof BatteryLevelResponse &&
				this.#batteryLevel !== response.batteryLevel
			) {
				this.#batteryLevel = response.batteryLevel

				this.service.device.emit(
					"battery-level-changed",
					this.#batteryLevel,
				)

				logger.log(
					`Battery level changed to ${
						this.#batteryLevel
							? `${this.#batteryLevel}%`
							: `"unknown".`
					}.`,
					this.service.device,
				)
			}
		})
	}

	get batteryLevel() {
		return this.#batteryLevel
	}
}

class BatteryLevelResponse extends BluResponse {
	get batteryLevel() {
		return this.data?.getUint8(0)
	}
}
