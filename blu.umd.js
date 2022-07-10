module.exports = {
	bluetooth: require("./src/bluetooth.js"),
	configuration: require("./src/configuration.js"),
	logger: require("./src/logger.js"),
	scanner: require("./src/scanner.js"),
	version: require("./src/version.js"),

	ServiceDescription: require("./src/descriptions.js").ServiceDescription,
	CharacteristicDescription: require("./src/descriptions.js").CharacteristicDescription,
	DescriptorDescription: require("./src/descriptions.js").DescriptorDescription,
	Service: require("./src/service.js"),
	Characteristic: require("./src/characteristic.js"),
	Descriptor: require("./src/descriptor.js"),
	Device: require("./src/device.js"),
	Request: require("./src/request.js"),
	Response: require("./src/response.js"),
	BluError: require("./utils/bluError.js")
}