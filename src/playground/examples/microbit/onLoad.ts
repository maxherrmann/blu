import { bluetooth } from "@blu.js/blu"
import { domNode } from "../../utils"
import { Microbit } from "./bluConfig"

export default function onLoad() {
	bluetooth.on("device-connected", device => {
		if (!(device instanceof Microbit)) {
			return
		}

		updateDeviceInformation(device)
		updateAccelerometerData(device.accelerometerData)
		updateButtonStates(device.buttonStates)
		updateTemperature(device.temperature)

		device.on("accelerometer-data-changed", updateAccelerometerData)
		device.on("button-states-changed", updateButtonStates)
		device.on("temperature-changed", updateTemperature)
	})

	function updateDeviceInformation(device: Microbit) {
		const modelNumberNode = domNode("#model-number")
		const serialNumberNode = domNode("#serial-number")
		const hardwareRevisionNode = domNode("#hardware-revision")
		const firmwareRevisionNode = domNode("#firmware-revision")
		const manufacturerNameNode = domNode("#manufacturer-name")

		modelNumberNode.innerHTML = device.modelNumber ?? "Unknown"
		serialNumberNode.innerHTML = device.serialNumber ?? "Unknown"
		hardwareRevisionNode.innerHTML = device.hardwareRevision ?? "Unknown"
		firmwareRevisionNode.innerHTML = device.firmwareRevision ?? "Unknown"
		manufacturerNameNode.innerHTML = device.manufacturerName ?? "Unknown"
	}

	function updateAccelerometerData(
		accelerometerData: Microbit["accelerometerData"],
	) {
		if (!accelerometerData) {
			return
		}

		const accelerometerDataXNode = domNode("#accelerometer-data-x")
		const accelerometerDataYNode = domNode("#accelerometer-data-y")
		const accelerometerDataZNode = domNode("#accelerometer-data-z")
		const accelerometerDataPitchNode = domNode("#accelerometer-data-pitch")
		const accelerometerDataRollNode = domNode("#accelerometer-data-roll")
		const accelerationSimulationNode = domNode(
			"#accelerometer-data-simulation",
		)

		accelerometerDataXNode.innerHTML = String(
			accelerometerData.x ?? "Unknown",
		)
		accelerometerDataYNode.innerHTML = String(
			accelerometerData.y ?? "Unknown",
		)
		accelerometerDataZNode.innerHTML = String(
			accelerometerData.z ?? "Unknown",
		)

		if (!accelerometerData.pitch || !accelerometerData.roll) {
			return
		}

		accelerometerDataPitchNode.innerHTML = `${accelerometerData.pitch}°`
		accelerometerDataRollNode.innerHTML = `${accelerometerData.roll}°`
		accelerationSimulationNode.style.transform = `
            rotateX(${accelerometerData.pitch}deg)
            rotateY(${accelerometerData.roll}deg)
        `
	}

	function updateButtonStates(buttonStates: Microbit["buttonStates"]) {
		const buttonAStateNode = domNode("#button-a-state")
		const buttonBStateNode = domNode("#button-b-state")

		buttonAStateNode.innerHTML = getButtonStateString(buttonStates.a)
		buttonBStateNode.innerHTML = getButtonStateString(buttonStates.b)
	}

	function getButtonStateString(buttonState: Microbit["buttonStates"]["a"]) {
		switch (buttonState) {
			case 0:
				return "Not Pressed"
			case 1:
				return "Pressed"
			case 2:
				return "Long Pressed"
			default:
				return "Unknown"
		}
	}

	function updateTemperature(temperature: Microbit["temperature"]) {
		if (!temperature) {
			return
		}

		const temperatureNode = domNode("#temperature")

		temperatureNode.innerHTML = `${temperature}°C`
	}
}
