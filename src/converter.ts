const textDecoder = new TextDecoder()

/**
 * Data converter.
 * @sealed
 * @public
 */
export class BluConverter {
	toInt8Array(...data: number[]) {
		return new Int8Array(data)
	}

	toUint8Array(...data: number[]) {
		return new Uint8Array(data)
	}

	toUint8ClampedArray(...data: number[]) {
		return new Uint8ClampedArray(data)
	}

	toInt16Array(...data: number[]) {
		return new Int16Array(data)
	}

	toUint16Array(...data: number[]) {
		return new Uint16Array(data)
	}

	toInt32Array(...data: number[]) {
		return new Int32Array(data)
	}

	toUint32Array(...data: number[]) {
		return new Uint32Array(data)
	}

	toFloat32Array(...data: number[]) {
		return new Float32Array(data)
	}

	toFloat64Array(...data: number[]) {
		return new Float64Array(data)
	}

	toBigInt64Array(...data: bigint[]) {
		return new BigInt64Array(data)
	}

	toBigUint64Array(...data: bigint[]) {
		return new BigUint64Array(data)
	}

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
