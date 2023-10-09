/**
 * Is the provided subject a subclass of the given class or the given class
 * itself?
 * @param subject - The subject.
 * @param classToTest - The class.
 */
export default function isSubclassOrSelf(
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	subject: any,
	classToTest: new (...args: never[]) => unknown,
) {
	// eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
	return subject?.prototype instanceof classToTest || subject === classToTest
}
