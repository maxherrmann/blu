export default function isSubclass(subject, classToTest) {
	return subject.prototype instanceof classToTest || subject === classToTest
}