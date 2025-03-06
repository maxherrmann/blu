/* eslint-disable @typescript-eslint/no-unnecessary-condition */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-explicit-any */

/**
 * Checks whether the given subject is a subclass of `baseClass` or `baseClass`
 * itself.
 * @param subject - The subject.
 * @param baseClass - The base class.
 */
export default function isSubclassOrSame<T>(
	subject: unknown,
	baseClass: abstract new (...args: any[]) => T,
): subject is abstract new (...args: any[]) => T {
	if (typeof subject !== "function") {
		return false
	}

	let current = subject

	while (current) {
		if (current === baseClass) {
			return true
		}

		current = Object.getPrototypeOf(current)
	}

	return false
}
