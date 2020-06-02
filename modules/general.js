function unix_timestamp_to_date_string(unix_time = 0) {
	let date = new Date(unix_time);
	let return_string = '';
	if (date.getFullYear() !== 1970) {
		return_string += `${date.getFullYear()}-`;
	} 
	if (date.getMonth() !== 0) {
		return_string += `${date.getMonth()}-`;
	} 
	if (unix_time >= 86400000) {
		return_string += `${date.getDate()}-`;
	} 
	if (unix_time >= 3600000) {
		return_string += `${date.getHours()-1}:`;
	} 
	return_string += `${date.getMinutes()}:`;
	return_string += `${date.getSeconds()}`;
	return return_string
}

function unix_uptime_to_date_string(unix_time = 0) {
	let date = new Date(unix_time);
	let return_string = '';
	
	if (unix_time >= 86400000) {
		return_string += `${Math.floor(unix_time/86400000)}:`;
	} 
	if (unix_time >= 3600000) {
		return_string += `${date.getHours()-1}:`;
	} 
	return_string += `${date.getMinutes()}:`;
	return_string += `${date.getSeconds()}`;
	return return_string
}



module.exports.timestamp_to_string = unix_timestamp_to_date_string;
module.exports.uptime_to_string = unix_uptime_to_date_string;