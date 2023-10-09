import { BluCharacteristic, BluResponse, BluService, logger } from "@blu.js/blu"

export class ButtonService extends BluService {
	buttonAStateCharacteristic!: ButtonAStateCharacteristic
	buttonBStateCharacteristic!: ButtonBStateCharacteristic

	override beforeReady() {
		this.buttonAStateCharacteristic.on(
			"button-state-changed",
			(buttonState: ButtonStateResponse["buttonState"]) => {
				this.#emitButtonStatesChangedEvent()
				this.#emitButtonPressedEvent("A", buttonState)
			},
		)

		this.buttonBStateCharacteristic.on(
			"button-state-changed",
			(buttonState: ButtonStateResponse["buttonState"]) => {
				this.#emitButtonStatesChangedEvent()
				this.#emitButtonPressedEvent("B", buttonState)
			},
		)
	}

	get buttonStates() {
		return {
			a: this.buttonAStateCharacteristic.buttonState,
			b: this.buttonBStateCharacteristic.buttonState,
		}
	}

	#emitButtonStatesChangedEvent() {
		this.device.emit("button-states-changed", this.buttonStates)

		logger.debug(
			`Button states changed to ` +
				`A = ${this.buttonStates.a}, ` +
				`B = ${this.buttonStates.b}.`,
			this.device,
		)
	}

	#emitButtonPressedEvent(
		buttonName: string,
		buttonState: ButtonStateResponse["buttonState"],
	) {
		if (buttonState !== 1) {
			return
		}

		this.device.emit(`button-${buttonName.toLowerCase()}-pressed`)

		logger.log(`Button ${buttonName} pressed.`, this.device)
	}
}

class ButtonStateCharacteristic extends BluCharacteristic {
	override responseType = ButtonStateResponse

	#buttonState: ButtonStateResponse["buttonState"]

	override async beforeReady() {
		this.#buttonState = (await this.read<ButtonStateResponse>()).buttonState

		this.on("notification", response => {
			if (response instanceof ButtonStateResponse) {
				this.#buttonState = response.buttonState
				this.emit("button-state-changed", this.buttonState)
			}
		})
	}

	get buttonState() {
		return this.#buttonState
	}
}

class ButtonStateResponse extends BluResponse {
	get buttonState() {
		return this.data?.getUint8(0)
	}
}

export class ButtonAStateCharacteristic extends ButtonStateCharacteristic {}
export class ButtonBStateCharacteristic extends ButtonStateCharacteristic {}
