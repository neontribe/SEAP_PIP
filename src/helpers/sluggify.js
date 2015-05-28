module.exports = function (input) {
	var slug = input
		.toLowerCase()
		.replace(/[^\w ]+/g,'')
		.replace(/ +/g,'-');
	return slug;
};