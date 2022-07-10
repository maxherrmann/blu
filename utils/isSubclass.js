function isSubclass(subject, classToTest) {
	return subject.prototype instanceof classToTest || subject === classToTest
}

module.exports = isSubclass