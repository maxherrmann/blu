/**
 * Is the provided subject a buffer source?
 * @param subject - The subject.
 */
export default function isBufferSource(subject: unknown) {
	return subject instanceof ArrayBuffer || ArrayBuffer.isView(subject)
}
