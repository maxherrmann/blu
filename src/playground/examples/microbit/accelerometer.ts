import {
	BluCharacteristic,
	BluResponse,
	BluService,
	BluCharacteristicOperationError,
	logger,
} from "@blu.js/blu"

export class AccelerometerService extends BluService {
	accelerometerDataCharacteristic!: AccelerometerDataCharacteristic
	accelerometerPeriodCharacteristic!: AccelerometerPeriodCharacteristic

	get accelerometerData() {
		return this.accelerometerDataCharacteristic.accelerometerData
	}

	get accelerometerPeriod() {
		return this.accelerometerPeriodCharacteristic.accelerometerPeriod
	}

	setAccelerometerPeriod(
		...args: Parameters<
			AccelerometerPeriodCharacteristic["setAccelerometerPeriod"]
		>
	) {
		return this.accelerometerPeriodCharacteristic.setAccelerometerPeriod(
			...args,
		)
	}
}

export class AccelerometerDataCharacteristic extends BluCharacteristic {
	override responseType = AccelerometerDataResponse

	#accelerometerData?: ReturnType<
		AccelerometerDataResponse["getAccelerometerData"]
	>

	override beforeReady() {
		this.on("notification", response => {
			if (response instanceof AccelerometerDataResponse) {
				this.#accelerometerData = response.getAccelerometerData()

				this.service.device.emit(
					"accelerometer-data-changed",
					this.accelerometerData,
				)
			}
		})
	}

	get accelerometerData() {
		return this.#accelerometerData
	}
}

class AccelerometerDataResponse extends BluResponse {
	rawX?: number
	rawY?: number
	rawZ?: number
	x?: number
	y?: number
	z?: number

	getAccelerometerData() {
		this.rawX = this.data?.getInt16(0, true)
		this.rawY = this.data?.getInt16(2, true)
		this.rawZ = this.data?.getInt16(4, true)

		if (this.rawX && this.rawY && this.rawZ) {
			this.x = Number.parseFloat((this.rawX / 1000).toFixed(3))
			this.y = Number.parseFloat((this.rawY / 1000).toFixed(3))
			this.z = Number.parseFloat((this.rawZ / 1000).toFixed(3))
		}

		return {
			x: this.x,
			y: this.y,
			z: this.z,
			pitch: this.#getPitch(),
			roll: this.#getRoll(),
		}
	}

	#getPitch() {
		if (this.x && this.y && this.z) {
			const radians =
				Math.atan(
					this.y /
						Math.sqrt(Math.pow(this.x, 2) + Math.pow(this.z, 2)),
				) * -1
			const degrees = radians * (180 / Math.PI)

			return Number.parseFloat(degrees.toFixed(3))
		}

		return
	}

	#getRoll() {
		if (this.x && this.y && this.z) {
			const radians = Math.atan(
				this.x / Math.sqrt(Math.pow(this.y, 2) + Math.pow(this.z, 2)),
			)
			const degrees = radians * (180 / Math.PI)

			return Number.parseFloat(degrees.toFixed(3))
		}

		return
	}
}

export class AccelerometerPeriodCharacteristic extends BluCharacteristic {
	override responseType = AccelerometerPeriodResponse

	#accelerometerPeriod: AccelerometerPeriodResponse["accelerometerPeriod"]

	async onceReady() {
		await this.setAccelerometerPeriod(160)
	}

	get accelerometerPeriod() {
		return this.#accelerometerPeriod
	}

	async setAccelerometerPeriod(time: 1 | 2 | 5 | 10 | 20 | 80 | 160 | 640) {
		if (typeof time !== "number") {
			throw new BluCharacteristicOperationError(
				this,
				`Argument "time" must be of type "number".`,
			)
		}

		const validTimeValues = [1, 2, 5, 10, 20, 80, 160, 640]

		if (!validTimeValues.includes(time)) {
			throw new BluCharacteristicOperationError(
				this,
				`Argument "time" must be a valid UInt16 value. ` +
					`Valid values are: ${validTimeValues.join(", ")}.`,
			)
		}

		await this.write(new Uint16Array([time]))

		logger.debug(
			`Set accelerometer period to ${time} ms.`,
			this.service.device,
		)

		try {
			this.#accelerometerPeriod = (
				await this.read<AccelerometerPeriodResponse>()
			).accelerometerPeriod
		} catch (error) {
			throw new BluCharacteristicOperationError(
				this,
				"Could not set accelerometer period.",
				error,
			)
		}
	}
}

class AccelerometerPeriodResponse extends BluResponse {
	get accelerometerPeriod() {
		return this.data?.getUint16(0, true)
	}
}
