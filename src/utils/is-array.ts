/**
 * Checks whether the given subject is an array.
 * @param subject - The subject.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export default function isArray(subject: unknown): subject is any[] {
	return Array.isArray(subject)
}
