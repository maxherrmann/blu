export const bluetooth = require("./src/bluetooth.js")
export const configuration = require("./src/configuration.js")
export const logger = require("./src/logger.js")
export const scanner = require("./src/scanner.js")
export const version = require("./src/version.js")

export const {
	ServiceDescription,
	CharacteristicDescription,
	DescriptorDescription
} = require("./src/descriptions.js")
export const Service = require("./src/service.js")
export const Characteristic = require("./src/characteristic.js")
export const Descriptor = require("./src/descriptor.js")
export const Request = require("./src/request.js")
export const Response = require("./src/response.js")
export const Device = require("./src/device.js")

export const BluError = require("./utils/bluError.js")

export default {
	bluetooth: bluetooth,
	configuration: configuration,
	logger: logger,
	scanner: scanner,
	version: version,

	ServiceDescription: ServiceDescription,
	CharacteristicDescription: CharacteristicDescription,
	DescriptorDescription: DescriptorDescription,
	Service: Service,
	Characteristic: Characteristic,
	Descriptor: Descriptor,
	Device: Device,
	Request: Request,
	Response: Response,

	BluError: BluError
}