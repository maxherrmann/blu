const textEncoder = new TextEncoder()
const textDecoder = new TextDecoder()

export function stringToBuffer(string: string) {
	return textEncoder.encode(string)
}

export function bufferToString(buffer: AllowSharedBufferSource) {
	return textDecoder.decode(buffer)
}
