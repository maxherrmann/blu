import {
	BluCharacteristic,
	BluResponse,
	BluService,
	BluCharacteristicOperationError,
	logger,
	convert,
} from "@blu.js/blu"

export class TemperatureService extends BluService {
	temperatureCharacteristic!: TemperatureCharacteristic
	temperaturePeriodCharacteristic!: TemperaturePeriodCharacteristic

	get temperature() {
		return this.temperatureCharacteristic.temperature
	}

	get temperaturePeriod() {
		return this.temperaturePeriodCharacteristic.temperaturePeriod
	}

	setTemperaturePeriod(
		...args: Parameters<
			TemperaturePeriodCharacteristic["setTemperaturePeriod"]
		>
	) {
		return this.temperaturePeriodCharacteristic.setTemperaturePeriod(
			...args,
		)
	}
}

export class TemperatureCharacteristic extends BluCharacteristic {
	override responseType = TemperatureResponse

	#temperature: TemperatureResponse["temperature"]

	override async beforeReady() {
		this.#temperature = (await this.read<TemperatureResponse>()).temperature

		this.on("notification", response => {
			if (
				response instanceof TemperatureResponse &&
				(this.#temperature === null ||
					this.#temperature !== response.temperature)
			) {
				this.#temperature = response.temperature

				this.service.device.emit(
					"temperature-changed",
					this.temperature,
				)

				logger.log(
					`Temperature changed to ${this.temperature}°C.`,
					this.service.device,
				)
			}
		})
	}

	get temperature() {
		return this.#temperature
	}
}

class TemperatureResponse extends BluResponse {
	get temperature() {
		return this.data?.getInt8(0)
	}
}

export class TemperaturePeriodCharacteristic extends BluCharacteristic {
	override responseType = TemperaturePeriodResponse

	#temperaturePeriod: TemperaturePeriodResponse["temperaturePeriod"]

	override async beforeReady() {
		await this.setTemperaturePeriod(15000)
	}

	get temperaturePeriod() {
		return this.#temperaturePeriod
	}

	async setTemperaturePeriod(time: number) {
		if (typeof time !== "number") {
			throw new BluCharacteristicOperationError(
				this,
				`Argument "time" must be of type "number".`,
			)
		}

		if (time < 0 || time > 65535) {
			throw new BluCharacteristicOperationError(
				this,
				`Argument "time" must be an UInt16 value.`,
			)
		}

		try {
			await this.write(convert.toUint16Array(time))

			logger.debug(
				`Set temperature period to ${time}ms.`,
				this.service.device,
			)

			this.#temperaturePeriod = (
				await this.read<TemperaturePeriodResponse>()
			).temperaturePeriod
		} catch (error) {
			throw new BluCharacteristicOperationError(
				this,
				"Could not set temperature period.",
				error,
			)
		}
	}
}

class TemperaturePeriodResponse extends BluResponse {
	get temperaturePeriod() {
		return this.data?.getUint16(0, true)
	}
}
