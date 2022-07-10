const Service = require("./service.js")
const Characteristic = require("./characteristic.js")
const Descriptor = require("./descriptor.js")

const isArray = require("../utils/isArray.js")
const isSubclass = require("../utils/isSubclass.js")
const BluError = require("../utils/bluError.js")

class ServiceDescription {
	name
	identifier
	type
	uuid
	characteristics

	constructor(name, identifier, type, uuid, characteristicDescriptions) {
		if (typeof name !== "string") {
			throw new ServiceDescriptionConstructionError(
				`Argument "name" must be of type "string".`
			)
		}

		if (typeof identifier !== "string") {
			throw new ServiceDescriptionConstructionError(
				`Argument "identifier" must be of type "string".`
			)
		}

		if (!isSubclass(type, Service)) {
			throw new ServiceDescriptionConstructionError(
				`Argument "type" must be a class that is or extends "Service".`
			)
		}

		if (typeof uuid !== "string" && typeof uuid !== "number") {
			throw new ServiceDescriptionConstructionError(
				`Argument "uuid" must be either of type "string" or "number".`
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

		if (typeof uuid === "string") {
			uuid = uuid.toLowerCase()
		}

		this.name = name
		this.identifier = identifier
		this.type = type
		this.uuid = uuid
		this.characteristics = characteristicDescriptions
	}
}

class CharacteristicDescription {
	name
	identifier
	type
	uuid
	descriptors
	expectedIndicators

	constructor(name, identifier, type, uuid, descriptorDescriptions, expectedIndicators) {
		if (typeof name !== "string") {
			throw new CharacteristicDescriptionConstructionError(
				`Argument "name" must be of type "string".`
			)
		}

		if (typeof identifier !== "string") {
			throw new ServiceDescriptionConstructionError(
				`Argument "identifier" must be of type "string".`
			)
		}

		if (!isSubclass(type, Characteristic)) {
			throw new CharacteristicDescriptionConstructionError(
				`Argument "type" must be a class that is or extends "Characteristic".`
			)
		}

		if (typeof uuid !== "string" && typeof uuid !== "number") {
			throw new CharacteristicDescriptionConstructionError(
				`Argument "uuid" must be either of type "string" or "number".`
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

		if (typeof expectedIndicators !== "string") {
			throw new CharacteristicDescriptionConstructionError(
				`Argument "expectedIndicators" must be either "undefined" ` +
				`or of type "string".`
			)
		}

		if (!expectedIndicators.match(/^[R-][W-][w-][N-]$/)) {
			throw new CharacteristicDescriptionConstructionError(
				`Argument "expectedIndicators" contains a string ` +
				`that is incorrectly formatted.`
			)
		}

		if (typeof uuid === "string") {
			uuid = uuid.toLowerCase()
		}

		this.name = name
		this.identifier = identifier
		this.type = type
		this.uuid = uuid
		this.descriptors = descriptorDescriptions
		this.expectedIndicators = expectedIndicators ?? null
	}
}

class DescriptorDescription {
	name
	identifier
	type
	uuid

	constructor(name, identifier, type, uuid) {
		if (typeof name !== "string") {
			throw new DescriptorDescriptionConstructionError(
				`Argument "name" must be of type "string".`
			)
		}

		if (typeof identifier !== "string") {
			throw new ServiceDescriptionConstructionError(
				`Argument "identifier" must be of type "string".`
			)
		}

		if (!isSubclass(type, Descriptor)) {
			throw new DescriptorDescriptionConstructionError(
				`Argument "type" must be a class that is or extends "Descriptor".`
			)
		}

		if (typeof uuid !== "string" && typeof uuid !== "number") {
			throw new DescriptorDescriptionConstructionError(
				`Argument "uuid" must be either of type "string" or "number".`
			)
		}

		if (typeof uuid === "string") {
			uuid = uuid.toLowerCase()
		}

		this.name = name
		this.identifier = identifier
		this.type = type
		this.uuid = uuid
	}
}

class ServiceDescriptionConstructionError extends BluError {}
class CharacteristicDescriptionConstructionError extends BluError {}
class DescriptorDescriptionConstructionError extends BluError {}

module.exports = {
	ServiceDescription: ServiceDescription,
	CharacteristicDescription: CharacteristicDescription,
	DescriptorDescription: DescriptorDescription
}