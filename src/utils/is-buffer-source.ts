/**
 * Checks whether the given subject is a buffer source.
 * @param subject - The subject.
 */
export default function isBufferSource(
	subject: unknown,
): subject is BufferSource {
	return subject instanceof ArrayBuffer || ArrayBuffer.isView(subject)
}
