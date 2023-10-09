/**
 * Is the provided subject an array buffer view?
 * @param subject - The subject.
 */
export default function isArrayBufferView(subject: unknown) {
	return ArrayBuffer.isView(subject)
}
