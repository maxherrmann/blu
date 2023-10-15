const textDecoder = new TextDecoder()

/**
 * Data converter.
 * @sealed
 * @public
 */
export class BluConverter {
	/**
	 * Convert data to an `Int8Array`.
	 * @param data - The data.
	 */
	toInt8Array(...data: number[]) {
		return new Int8Array(data)
	}

	/**
	 * Convert data to an `Uint8Array`.
	 * @param data - The data.
	 */
	toUint8Array(...data: number[]) {
		return new Uint8Array(data)
	}

	/**
	 * Convert data to an `Uint8ClampedArray`.
	 * @param data - The data.
	 */
	toUint8ClampedArray(...data: number[]) {
		return new Uint8ClampedArray(data)
	}

	/**
	 * Convert data to an `Int16Array`.
	 * @param data - The data.
	 */
	toInt16Array(...data: number[]) {
		return new Int16Array(data)
	}

	/**
	 * Convert data to an `Uint16Array`.
	 * @param data - The data.
	 */
	toUint16Array(...data: number[]) {
		return new Uint16Array(data)
	}

	/**
	 * Convert data to an `Int32Array`.
	 * @param data - The data.
	 */
	toInt32Array(...data: number[]) {
		return new Int32Array(data)
	}

	/**
	 * Convert data to an `Uint32Array`.
	 * @param data - The data.
	 */
	toUint32Array(...data: number[]) {
		return new Uint32Array(data)
	}

	/**
	 * Convert data to an `Float32Array`.
	 * @param data - The data.
	 */
	toFloat32Array(...data: number[]) {
		return new Float32Array(data)
	}

	/**
	 * Convert data to an `Float64Array`.
	 * @param data - The data.
	 */
	toFloat64Array(...data: number[]) {
		return new Float64Array(data)
	}

	/**
	 * Convert data to an `BigInt64Array`.
	 * @param data - The data.
	 */
	toBigInt64Array(...data: bigint[]) {
		return new BigInt64Array(data)
	}

	/**
	 * Convert data to an `BigUint64Array`.
	 * @param data - The data.
	 */
	toBigUint64Array(...data: bigint[]) {
		return new BigUint64Array(data)
	}

	/**
	 * Convert data to a string.
	 * @param data - The data.
	 */
	toString(data?: ArrayBuffer | ArrayBufferView) {
		return textDecoder.decode(data)
	}
}

/**
 * Blu's global data converter.
 * @remarks Handles everything related to data conversion.
 * @public
 */
const convert = new BluConverter()
export default convert
