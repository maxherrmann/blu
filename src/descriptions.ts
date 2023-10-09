import BluCharacteristic, {
	type BluCharacteristicProperties,
} from "./characteristic"
import BluDescriptor from "./descriptor"
import { BluDescriptionConstructionError } from "./errors"
import BluService from "./service"
import isArray from "./utils/isArray"
import isSubclassOrSelf from "./utils/isSubclassOrSelf"

import type BluDevice from "./device"

/**
 * Generic description for a Bluetooth protocol.
 * @remarks Used as a base for {@link BluServiceDescription},
 *  {@link BluCharacteristicDescription} and {@link BluDescriptorDescription}.
 * @public
 */
export class BluProtocolDescription {
	/**
	 * The protocol's UUID.
	 * @readonly
	 */
	readonly uuid:
		| BluetoothServiceUUID
		| BluetoothCharacteristicUUID
		| BluetoothDescriptorUUID

	/**
	 * The protocol's identifier.
	 * @remarks Used for addressing the described protocol from the
	 *  {@link BluDevice} object. The protocol will only be addressable as a
	 *  generic protocol when the identifier is `undefined`.
	 * @readonly
	 */
	readonly identifier?: string

	/**
	 * The protocol's name.
	 * @remarks Used for internal reference.
	 * @defaultValue "Generic Protocol"
	 * @readonly
	 */
	readonly name: string = "Generic Protocol"

	/**
	 * Construct a description for a Bluetooth protocol.
	 * @param uuid - The protocol's UUID.
	 * @param identifier - The protocol's identifier. When no
	 *  identifier is set, no direct access property will be added to the parent
	 *  protocol.
	 * @param name - The protocol's name. Defaults to "Generic
	 *  Protocol".
	 * @throws A {@link BluDescriptionConstructionError} when invalid arguments
	 *  were provided.
	 */
	constructor({
		uuid,
		identifier,
		name,
	}: {
		uuid:
			| BluetoothServiceUUID
			| BluetoothCharacteristicUUID
			| BluetoothDescriptorUUID
		identifier?: string
		name?: string
	}) {
		if (typeof uuid !== "string" && typeof uuid !== "number") {
			throw new BluDescriptionConstructionError(
				`Argument "uuid" must be either of type "string" or ` +
					`"number".`,
			)
		}

		if (typeof identifier !== "string" && identifier !== undefined) {
			throw new BluDescriptionConstructionError(
				`Argument "identifier" must be either of type "string" ` +
					`or "undefined".`,
			)
		}

		if (typeof name !== "string" && name !== undefined) {
			throw new BluDescriptionConstructionError(
				`Argument "name" must be of type "string" or "undefined".`,
			)
		}

		if (typeof uuid === "string") {
			uuid = uuid.toLowerCase()
		}

		this.uuid = uuid
		this.identifier = identifier
		if (name) this.name = name
	}
}

/**
 * Description for a Bluetooth service.
 * @sealed
 * @public
 */
export class BluServiceDescription extends BluProtocolDescription {
	/**
	 * The type that represents the described service.
	 * @defaultValue {@link BluService} itself.
	 * @readonly
	 */
	readonly type: typeof BluService

	/**
	 * The {@link BluCharacteristicDescription}s for the described service's
	 *  characteristics.
	 * @readonly
	 */
	readonly characteristics: BluCharacteristicDescription[]

	/**
	 * Construct a description for a Bluetooth service.
	 * @param uuid - The service's UUID.
	 * @param identifier - The service's identifier. Used for
	 *  accessing the described service directly from the {@link BluDevice} object.
	 *  The service will only be accessible as a generic service when omitted.
	 * @param name - The service's name. Used for internal
	 *  reference. Defaults to "Generic Service".
	 * @param type - The service's type. Defaults to
	 *  {@link BluService} itself.
	 * @param characteristicDescriptions - The descriptions for the
	 *  service's characteristics.
	 * @throws A {@link BluDescriptionConstructionError} when invalid arguments
	 *  were provided.
	 */
	constructor({
		uuid,
		identifier,
		name = "Generic Service",
		type = BluService,
		characteristicDescriptions = [],
	}: {
		uuid: BluetoothServiceUUID
		identifier?: string
		name?: string
		type?: typeof BluService
		characteristicDescriptions?: BluCharacteristicDescription[]
	}) {
		super({ uuid, identifier, name })

		if (!isSubclassOrSelf(type, BluService)) {
			throw new BluDescriptionConstructionError(
				`Argument "type" must be a class that is or extends ` +
					`"Service".`,
			)
		}

		if (
			!isArray(characteristicDescriptions) ||
			!characteristicDescriptions.every(
				characteristicDescription =>
					characteristicDescription instanceof
					BluCharacteristicDescription,
			)
		) {
			throw new BluDescriptionConstructionError(
				`Argument "characteristicDescriptions" must be an array ` +
					`of "CharacteristicDescription".`,
			)
		}

		this.type = type
		this.characteristics = characteristicDescriptions
	}
}

/**
 * Description for a Bluetooth characteristic.
 * @sealed
 * @public
 */
export class BluCharacteristicDescription extends BluProtocolDescription {
	/**
	 * The type that represents the described characteristic.
	 * @defaultValue {@link BluCharacteristic} itself.
	 * @readonly
	 */
	readonly type: typeof BluCharacteristic

	/**
	 * The {@link BluDescriptorDescription}s for the described characteristic's
	 *  descriptors.
	 * @readonly
	 */
	readonly descriptors: BluDescriptorDescription[]

	/**
	 * The described characteristic's expected properties, formatted as an
	 *  {@link BluCharacteristicProperties.toString | indicator string}. `null`
	 *  if there are no expected properties.
	 * @readonly
	 */
	readonly expectedProperties: string | null

	/**
	 * Construct a description for a Bluetooth characteristic.
	 * @param uuid - The characteristic's UUID.
	 * @param identifier - The characteristic's identifier. Used
	 *  for accessing the described characteristic directly from the
	 *  {@link BluService} object. The characteristic will only be accessible as a
	 *  generic characteristic when omitted.
	 * @param name - The characteristic's name. Used for internal
	 *  reference. Defaults to "Generic Characteristic".
	 * @param type - The characteristic's type. Defaults to
	 *  {@link BluCharacteristic} itself.
	 * @param descriptorDescriptions - The descriptions for the
	 *  characteristic's descriptors.
	 * @param expectedProperties - The characteristic's expected
	 *  properties as an {@link BluCharacteristicProperties.toString | indicator string}.
	 *  Used for validation.
	 * @throws A {@link BluDescriptionConstructionError} when invalid arguments
	 *  were provided.
	 */
	constructor({
		uuid,
		identifier,
		name = "Generic Characteristic",
		type = BluCharacteristic,
		descriptorDescriptions = [],
		expectedProperties,
	}: {
		uuid: BluetoothCharacteristicUUID
		identifier?: string
		name?: string
		type?: typeof BluCharacteristic
		descriptorDescriptions?: BluDescriptorDescription[]
		expectedProperties?: string
	}) {
		super({ uuid, identifier, name })

		if (!isSubclassOrSelf(type, BluCharacteristic)) {
			throw new BluDescriptionConstructionError(
				`Argument "type" must be a class that is or extends ` +
					`"Characteristic".`,
			)
		}

		if (
			!isArray(descriptorDescriptions) ||
			!descriptorDescriptions.every(
				descriptorDescription =>
					descriptorDescription instanceof BluDescriptorDescription,
			)
		) {
			throw new BluDescriptionConstructionError(
				`Argument "descriptorDescriptions" must be an array ` +
					`of "DescriptorDescription".`,
			)
		}

		if (
			typeof expectedProperties !== "string" &&
			expectedProperties !== undefined
		) {
			throw new BluDescriptionConstructionError(
				`Argument "expectedProperties" must be either of type ` +
					`"string" or "undefined".`,
			)
		}

		if (
			typeof expectedProperties === "string" &&
			!expectedProperties.match(/^[R-][W-][w-][N-]$/)
		) {
			throw new BluDescriptionConstructionError(
				`Argument "expectedProperties" contains a string ` +
					`that is incorrectly formatted.`,
			)
		}

		this.type = type
		this.descriptors = descriptorDescriptions
		this.expectedProperties = expectedProperties ?? null
	}
}

/**
 * Description for a Bluetooth descriptor.
 * @sealed
 * @public
 */
export class BluDescriptorDescription extends BluProtocolDescription {
	/**
	 * The type that represents the described descriptor.
	 * @defaultValue {@link BluDescriptor} itself.
	 * @readonly
	 */
	readonly type: typeof BluDescriptor

	/**
	 * Construct a description for a Bluetooth descriptor.
	 * @param uuid - The descriptor's UUID.
	 * @param identifier - The descriptor's identifier. Used for
	 *  accessing the described descriptor directly from the
	 *  {@link BluCharacteristic} object. The descriptor will only be accessible
	 *  as a generic descriptor when omitted.
	 * @param name - The descriptor's name. Used for internal
	 *  reference. Defaults to "Generic Descriptor".
	 * @param type - The descriptor's type. Defaults to
	 *  {@link BluDescriptor} itself.
	 * @throws A {@link BluDescriptionConstructionError} when invalid arguments
	 *  were provided.
	 */
	constructor({
		uuid,
		identifier,
		name = "Generic Descriptor",
		type = BluDescriptor,
	}: {
		uuid: BluetoothDescriptorUUID
		identifier?: string
		name?: string
		type?: typeof BluDescriptor
	}) {
		super({ uuid, identifier, name })

		if (!isSubclassOrSelf(type, BluDescriptor)) {
			throw new BluDescriptionConstructionError(
				`Argument "type" must be a class that is or extends ` +
					`"Descriptor".`,
			)
		}

		this.type = type
	}
}
