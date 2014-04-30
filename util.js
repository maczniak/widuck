
function parse_name(title) {
	var idx = title.indexOf(':')
	if (idx == -1) {
		return [ '', title ]
	} else {
		return [ title.substring(0, idx), title.substring(idx + 1) ]
	}
}

module.exports.parse_name = parse_name

