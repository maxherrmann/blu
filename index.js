import bluetooth from "./src/bluetooth.js"
import configuration from "./src/configuration.js"
import logger from "./src/logger.js"
import scanner from "./src/scanner.js"
import { version } from "./src/version.js"

import {
	ServiceDescription,
	CharacteristicDescription,
	DescriptorDescription
} from "./src/descriptions.js"
import Service from "./src/service.js"
import Characteristic from "./src/characteristic.js"
import Descriptor from "./src/descriptor.js"
import Request from "./src/request.js"
import Response from "./src/response.js"
import Device from "./src/device.js"

import BluError from "./utils/bluError.js"

export { default as bluetooth } from "./src/bluetooth.js"
export { default as configuration } from "./src/configuration.js"
export { default as logger } from "./src/logger.js"
export { default as scanner } from "./src/scanner.js"
export { version } from "./src/version.js"

export {
	ServiceDescription,
	CharacteristicDescription,
	DescriptorDescription
} from "./src/descriptions.js"
export { default as Service } from "./src/service.js"
export { default as Characteristic } from "./src/characteristic.js"
export { default as Descriptor } from "./src/descriptor.js"
export { default as Request } from "./src/request.js"
export { default as Response } from "./src/response.js"
export { default as Device } from "./src/device.js"

export { default as BluError } from "./utils/bluError.js"

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