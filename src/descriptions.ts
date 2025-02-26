import BluCharacteristic from "./characteristic.js"
import BluDescriptor from "./descriptor.js"
import BluDevice from "./device.js"
import { BluInterfaceDescriptionConstructionError } from "./errors.js"
import BluResponse from "./response.js"
import BluService from "./service.js"
import isSubclassOrSame from "./utils/isSubclassOrSame.js"

/**
 * Generic description for a Bluetooth interface component.
 * @remarks Used as a base for {@link BluServiceDescription},
 *  {@link BluCharacteristicDescription} and {@link BluDescriptorDescription}.
 */
export class BluInterfaceDescription {
	/**
	 * The component's UUID.
	 * @readonly
	 */
	readonly uuid:
		| BluetoothServiceUUID
		| BluetoothCharacteristicUUID
		| BluetoothDescriptorUUID

	/**
	 * The component's identifier.
	 * @remarks Used for addressing the described interface component from the
	 *  {@link BluDevice} object. The component will only be addressable as a
	 *  generic component when the identifier is `undefined`.
	 * @defaultValue `undefined`
	 * @readonly
	 */
	readonly identifier?: string

	/**
	 * The component's name.
	 * @remarks Used for internal reference.
	 * @defaultValue "Generic Interface Component"
	 * @readonly
	 */
	readonly name: string

	/**
	 * Is the component optional?
	 * @remarks Sometimes a device's Bluetooth interface changes over time and
	 *  adds components that will not be present in earlier revisions of the
	 *  device's Bluetooth interface until updated. In that case we can mark it
	 *  as optional. Optional components are ignored when Blu checks a device's
	 *  Bluetooth interface and
	 *  {@link BluConfigurationOptions.deviceInterfaceMatching} is `true` in the
	 *  active configuration.
	 * @defaultValue `false`
	 * @readonly
	 */
	readonly optional: boolean

	/**
	 * Construct a description for a Bluetooth interface component.
	 * @param uuid - The component's UUID.
	 * @param identifier - The component's identifier. When no identifier is
	 *  set, no direct access property will be added to the parent component.
	 * @param name - The component's name. Defaults to "Generic Interface
	 *  Component".
	 * @param optional - Is the component optional? Defaults to `false`.
	 * @throws A {@link BluInterfaceDescriptionConstructionError} when invalid
	 *  arguments were provided.
	 */
	constructor({
		uuid,
		identifier,
		name = "Generic Interface Component",
		optional = false,
	}: {
		uuid:
			| BluetoothServiceUUID
			| BluetoothCharacteristicUUID
			| BluetoothDescriptorUUID
		identifier?: string
		name?: string
		optional?: boolean
	}) {
		if (typeof uuid === "string") {
			uuid = uuid.toLowerCase()
		}

		this.uuid = uuid
		this.identifier = identifier
		this.optional = optional
		this.name = name
	}
}

/**
 * Description for a Bluetooth service.
 */
export class BluServiceDescription extends BluInterfaceDescription {
	/**
	 * The type that represents the described service.
	 * @defaultValue The type of {@link BluService}.
	 * @readonly
	 */
	readonly type: typeof BluService<BluDevice>

	/**
	 * The {@link BluCharacteristicDescription}s for the described service's
	 *  characteristics.
	 * @defaultValue `[]`
	 * @readonly
	 */
	readonly characteristics: BluCharacteristicDescription[]

	/**
	 * Is the service being advertised by the device?
	 * @remarks If set to `true` the service will be added to the
	 *  `optionalServices` property of the Web Bluetooth API's
	 *  {@link https://developer.mozilla.org/en-US/docs/Web/API/Bluetooth/requestDevice#options | requestDevice() options}.
	 * @defaultValue `false`
	 * @readonly
	 */
	readonly advertised: boolean

	/**
	 * Construct a description for a Bluetooth service.
	 * @param uuid - The service's UUID.
	 * @param identifier - The service's identifier. Used for accessing the
	 *  described service directly from the {@link BluDevice} object. The
	 *  service will only be accessible as a generic service when omitted.
	 *  Defaults to `undefined`.
	 * @param name - The service's name. Used for internal reference. Defaults
	 *  to "Generic Service".
	 * @param type - The service's type. Defaults to the type of
	 *  {@link BluService}.
	 * @param characteristicDescriptions - The descriptions for the service's
	 *  characteristics. Defaults to `[]`.
	 * @param advertised - Is the service being advertised by the device?
	 *  Defaults to `false`.
	 * @param optional - Is the service optional? Defaults to `false`.
	 * @throws A {@link BluInterfaceDescriptionConstructionError} when invalid
	 *  arguments were provided.
	 */
	constructor({
		uuid,
		identifier,
		name = "Generic Service",
		type = BluService,
		characteristicDescriptions = [],
		advertised = false,
		optional,
	}: {
		uuid: BluetoothServiceUUID
		identifier?: string
		name?: string
		type?: typeof BluService<BluDevice>
		characteristicDescriptions?: BluCharacteristicDescription[]
		advertised?: boolean
		optional?: boolean
	}) {
		super({ uuid, identifier, name, optional })

		this.type = type
		this.characteristics = characteristicDescriptions
		this.advertised = advertised
	}
}

/**
 * Description for a Bluetooth characteristic.
 */
export class BluCharacteristicDescription extends BluInterfaceDescription {
	/**
	 * The type that represents the described characteristic.
	 * @defaultValue The type of {@link BluCharacteristic}.
	 * @readonly
	 */
	readonly type: typeof BluCharacteristic<BluService, typeof BluResponse>

	/**
	 * The {@link BluDescriptorDescription}s for the described characteristic's
	 *  descriptors.
	 * @defaultValue `[]`
	 * @readonly
	 */
	readonly descriptors: BluDescriptorDescription[]

	/**
	 * The described characteristic's expected properties. `undefined` if there
	 * are no expectations.
	 * @remarks Each property can be `undefined` as well to mark it as not being
	 * expected.
	 * @defaultValue `undefined`
	 * @readonly
	 */
	readonly expectedProperties?: Partial<BluetoothCharacteristicProperties>

	/**
	 * Construct a description for a Bluetooth characteristic.
	 * @param uuid - The characteristic's UUID.
	 * @param identifier - The characteristic's identifier. Used for accessing
	 *  the described characteristic directly from the {@link BluService}
	 *  object. The characteristic will only be accessible as a generic
	 *  characteristic when omitted. Defaults to `undefined`.
	 * @param name - The characteristic's name. Used for internal reference.
	 *  Defaults to "Generic Characteristic".
	 * @param type - The characteristic's type. Defaults to the type of
	 *  {@link BluCharacteristic}.
	 * @param descriptorDescriptions - The descriptions for the characteristic's
	 *  descriptors. Defaults to `[]`.
	 * @param expectedProperties - The characteristic's expected properties.
	 *  Used for validation. Defaults to `undefined`.
	 * @param optional - Is the characteristic optional? Defaults to `false`.
	 * @throws A {@link BluInterfaceDescriptionConstructionError} when invalid
	 *  arguments were provided.
	 */
	constructor({
		uuid,
		identifier,
		name = "Generic Characteristic",
		type = BluCharacteristic,
		descriptorDescriptions = [],
		expectedProperties,
		optional,
	}: {
		uuid: BluetoothCharacteristicUUID
		identifier?: string
		name?: string
		type?: typeof BluCharacteristic<BluService, typeof BluResponse>
		descriptorDescriptions?: BluDescriptorDescription[]
		expectedProperties?: Partial<BluetoothCharacteristicProperties>
		optional?: boolean
	}) {
		super({ uuid, identifier, name, optional })

		this.type = type
		this.descriptors = descriptorDescriptions
		this.expectedProperties = expectedProperties
	}
}

/**
 * Description for a Bluetooth descriptor.
 */
export class BluDescriptorDescription extends BluInterfaceDescription {
	/**
	 * The type that represents the described descriptor.
	 * @defaultValue The type of {@link BluDescriptor}.
	 * @readonly
	 */
	readonly type: typeof BluDescriptor<BluCharacteristic>

	/**
	 * Construct a description for a Bluetooth descriptor.
	 * @param uuid - The descriptor's UUID.
	 * @param identifier - The descriptor's identifier. Used for accessing the
	 *  described descriptor directly from the {@link BluCharacteristic} object.
	 *  The descriptor will only be accessible as a generic descriptor when
	 *  omitted. Defaults to `undefined`.
	 * @param name - The descriptor's name. Used for internal reference.
	 *  Defaults to "Generic Descriptor".
	 * @param type - The descriptor's type. Defaults to the type of
	 *  {@link BluDescriptor}.
	 * @param optional - Is the descriptor optional? Defaults to `false`.
	 * @throws A {@link BluInterfaceDescriptionConstructionError} when invalid
	 *  arguments were provided.
	 */
	constructor({
		uuid,
		identifier,
		name = "Generic Descriptor",
		type = BluDescriptor,
		optional,
	}: {
		uuid: BluetoothDescriptorUUID
		identifier?: string
		name?: string
		type?: typeof BluDescriptor<BluCharacteristic>
		optional?: boolean
	}) {
		super({ uuid, identifier, name, optional })

		if (!isSubclassOrSame(type, BluDescriptor)) {
			throw new BluInterfaceDescriptionConstructionError(
				`Argument "type" must be a class that is or extends ` +
					`"Descriptor".`,
			)
		}

		this.type = type
	}
}
