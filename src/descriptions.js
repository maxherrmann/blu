const Service = require("./service.js")
const Characteristic = require("./characteristic.js")
const Descriptor = require("./descriptor.js")

const isArray = require("../utils/isArray.js")
const isSubclass = require("../utils/isSubclass.js")
const BluError = require("../utils/bluError.js")

class Description {
	uuid
	identifier
	name

	constructor(
		uuid,
		identifier = null,
		name = "Unspecified Entity"
	) {
		if (typeof uuid !== "string" && typeof uuid !== "number") {
			throw new DescriptionConstructionError(
				`Argument "uuid" must be either of type "string" or "number".`
			)
		}

		if (typeof uuid === "string") {
			uuid = uuid.toLowerCase()
		}

		if (identifier !== null && typeof identifier !== "string") {
			throw new DescriptionConstructionError(
				`Argument "identifier" must be either "null" or of type "string".`
			)
		}

		if (typeof name !== "string") {
			throw new DescriptionConstructionError(
				`Argument "name" must be of type "string".`
			)
		}

		this.uuid = uuid
		this.identifier = identifier
		this.name = name
	}
}

class ServiceDescription extends Description {
	type
	characteristics

	constructor(
		uuid,
		identifier,
		name = "Unspecified Service",
		type = Service,
		characteristicDescriptions = []
	) {
		super(uuid, identifier, name)

		if (!isSubclass(type, Service)) {
			throw new ServiceDescriptionConstructionError(
				`Argument "type" must be a class that is or extends "Service".`
			)
		}

		if (
			!isArray(characteristicDescriptions) ||
			!characteristicDescriptions.every(characteristicDescription =>
				characteristicDescription instanceof CharacteristicDescription
			)
		) {
			throw new ServiceDescriptionConstructionError(
				`Argument "characteristicDescriptions" must be an array ` +
				`of "CharacteristicDescription".`
			)
		}

		this.type = type
		this.characteristics = characteristicDescriptions
	}
}

class CharacteristicDescription extends Description {
	type
	descriptors
	expectedIndicators

	constructor(
		uuid,
		identifier,
		name = "Unspecified Characteristic",
		type = Characteristic,
		descriptorDescriptions = [],
		expectedIndicators = null
	) {
		super(uuid, identifier, name)

		if (!isSubclass(type, Characteristic)) {
			throw new CharacteristicDescriptionConstructionError(
				`Argument "type" must be a class that is or extends "Characteristic".`
			)
		}

		if (
			!isArray(descriptorDescriptions) ||
			!descriptorDescriptions.every(descriptorDescription =>
				descriptorDescription instanceof DescriptorDescription
			)
		) {
			throw new CharacteristicDescriptionConstructionError(
				`Argument "descriptorDescriptions" must be an array ` +
				`of "DescriptorDescription".`
			)
		}

		if (expectedIndicators !== null && typeof expectedIndicators !== "string") {
			throw new CharacteristicDescriptionConstructionError(
				`Argument "expectedIndicators" must be either "null" ` +
				`or of type "string".`
			)
		}

		if (
			typeof expectedIndicators === "string" &&
			!expectedIndicators.match(/^[R-][W-][w-][N-]$/)
		) {
			throw new CharacteristicDescriptionConstructionError(
				`Argument "expectedIndicators" contains a string ` +
				`that is incorrectly formatted.`
			)
		}

		this.type = type
		this.descriptors = descriptorDescriptions
		this.expectedIndicators = expectedIndicators ?? null
	}
}

class DescriptorDescription extends Description {
	type

	constructor(
		uuid,
		identifier = null,
		name = "Unspecified Descriptor",
		type = Descriptor
	) {
		super(uuid, identifier, name)

		if (!isSubclass(type, Descriptor)) {
			throw new DescriptorDescriptionConstructionError(
				`Argument "type" must be a class that is or extends "Descriptor".`
			)
		}

		this.type = type
	}
}

class DescriptionConstructionError extends BluError {}
class ServiceDescriptionConstructionError extends BluError {}
class CharacteristicDescriptionConstructionError extends BluError {}
class DescriptorDescriptionConstructionError extends BluError {}

module.exports = {
	ServiceDescription: ServiceDescription,
	CharacteristicDescription: CharacteristicDescription,
	DescriptorDescription: DescriptorDescription
}