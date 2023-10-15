import blu from "@blu.js/blu"
import examples from "./examples"
import { BluPlaygroundError, domNode, setCollectionVisibility } from "./utils"

window.blu = blu

if (!blu.bluetooth.isSupported) {
	domNode(".content").style.display = "none"
	domNode("#bluetooth-not-supported-overlay").style.display = "block"

	throw new BluPlaygroundError(
		"Blu is not compatible with this browser, as it does not support " +
			"Bluetooth.",
	)
}

const bluetoothDataTransferLoggingToggle = domNode<HTMLInputElement>(
	"#bluetooth-data-transfer-logging",
)
const characteristicsNode = domNode("#device-characteristics")
const connectDeviceButton = domNode<HTMLButtonElement>("#connect-device")
const disconnectDeviceButton = domNode<HTMLButtonElement>("#disconnect-device")
const exampleControls = domNode("#example-controls")
const exampleDescription = domNode("#example-description")
const exampleSelect = domNode<HTMLSelectElement>("#example")
const identifierNode = domNode("#device-identifier")
const nameNode = domNode("#device-name")
const servicesNode = domNode("#device-services")
const versionLink = domNode<HTMLAnchorElement>("#blu-version")

setCollectionVisibility("connection", false)

bluetoothDataTransferLoggingToggle.checked =
	blu.configuration.options.dataTransferLogging
versionLink.href = versionLink.href + blu.version
versionLink.innerHTML = blu.version

for (const example of examples) {
	const option = document.createElement("option")

	option.value = example.id
	option.innerHTML = example.name

	exampleSelect.addEventListener("change", () => {
		if (exampleSelect.value === option.value) {
			exampleDescription.innerHTML = example.description

			blu.configuration.set(example.bluConfig)

			try {
				void fetch(`./examples/${example.id}/index.html`).then(
					response => {
						void response.text().then(text => {
							exampleControls.innerHTML = text

							example.onLoad()
						})
					},
				)
			} catch (error) {
				throw new BluPlaygroundError(
					`Could not load example "${example.id}".`,
					error,
				)
			}
		}
	})

	exampleSelect.add(option)
}

exampleSelect.dispatchEvent(new Event("change"))

connectDeviceButton.addEventListener("click", () => {
	connectDeviceButton.disabled = true

	blu.logger.debug("Select device...", "Blu Playground")

	blu.scanner
		.getDevice()
		.then(async device => {
			if (device) {
				blu.logger.log(
					`Connecting ${device.constructor.name}...`,
					"Blu Playground",
				)

				const onDisconnect = () => {
					setCollectionVisibility("connection", false)

					window.device = undefined

					/**
					 * Account for browser disconnect delay.
					 * Could be removed, but reconnecting right away leads to
					 * errors.
					 */
					setTimeout(() => {
						connectDeviceButton.disabled = false
						exampleSelect.disabled = false
					}, 2500)
				}

				exampleSelect.disabled = true

				try {
					await device.connect()
				} catch (error) {
					onDisconnect()

					blu.logger.error(error as Error)

					return
				}

				window.device = device

				nameNode.innerHTML = device.name
				identifierNode.innerHTML = `<code>${device.id}</code>`

				if (device.services.length > 0) {
					servicesNode.innerHTML = device.services
						.map(service => service.description.name)
						.join("<br>")
				}

				if (device.characteristics.length > 0) {
					characteristicsNode.innerHTML = device.characteristics
						.map(
							characteristic =>
								`<code class="${
									characteristic.hasExpectedProperties ??
									false
										? "green"
										: "red"
								}">` +
								`${characteristic.properties.toString()}</code> ${
									characteristic.description.name
								}`,
						)
						.join("<br>")
				}

				device.once("disconnected", onDisconnect)
				device.once("connection-lost", onDisconnect)

				disconnectDeviceButton.onclick = () => {
					device.disconnect()
				}

				setCollectionVisibility("connection", true)
			} else {
				blu.logger.debug("No device selected.", "Blu Playground")
			}
		})
		.catch(error => {
			blu.logger.error(
				new BluPlaygroundError("Device selection failed.", error),
			)
		})
		.finally(() => {
			connectDeviceButton.disabled = false
		})
})

bluetoothDataTransferLoggingToggle.addEventListener("change", () => {
	blu.configuration.set({
		dataTransferLogging: bluetoothDataTransferLoggingToggle.checked,
	})
})
