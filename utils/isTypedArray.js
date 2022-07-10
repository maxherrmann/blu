function isTypedArray(subject) {
	return ArrayBuffer.isView(subject)
}

module.exports = isTypedArray