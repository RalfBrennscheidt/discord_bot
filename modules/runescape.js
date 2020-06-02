const https = require('https');

//https://www.osrsbox.com/tools/item-search/
const itemIDs = {
	general_IDs : [1935, 1033, 314 , 1511, 1513, 1515, 1517, 1519, 1521, 1381, 1387, 1925],
	wood_IDs : [1511, 1513, 1515, 1517, 1519, 1521 ],
	ores_IDs : [436 , 438 , 440 , 442 , 444 , 447 , 449 , 451],
	bars_IDs : [2349, 2351, 2353, 2355, 2357, 2359, 2361, 2363],
	magicrunes_IDs : [554 , 555 , 556 , 559 , 560 , 561 , 563 , 564 , 1436, 7936],
	zamorak_IDs : [1033, 1035, 245 , 2653, 2655, 2657, 2659, 3478],
	guthix_IDs : [2669, 2671, 2673, 2675, 3480],
	saradomin_IDs : [2661, 2663, 2665, 2667, 3479],
	robes_IDs : [542 , 544 , 1033, 1035, 577 , 581 , 7390, 7394 , 7392, 7396 , 12449 , 12451]
}

const minutes_between_info_refesh = 30;
const interval_between_info_refresh = minutes_between_info_refesh * 60 * 1000;

let OSRS_ge_current_prices = {};

function fetchData(array_of_IDs, message_type) {
	let i = 0;
	let j = 0;
	let newData = '\n'; 
	let IDs = array_of_IDs.length;

	array_of_IDs.forEach (function(Obj) {
		j++
		if (Obj == 0) {
			console.log('invalid itemID');
			return;
		}
		if (Obj == undefined) return;

		let options = {
			hostname: 'services.runescape.com',
			path: '/m=itemdb_oldschool/api/catalogue/detail.json?item=' + Obj,
			method: 'GET'
		}

		const req = https.request(options, res => {
			//console.log(`statusCode: ${res.statusCode}`);
			if (res.statusCode == '404') {
				console.log(`error 404: OSRS ${Obj}`);
				return;
			}
			if (res.statusCode == '503') {
				console.log(`error 503: OSRS ${Obj}`);
				return;
			}
			res.on('data', d => {
				let data = JSON.parse(d);
				newData = newData + `${data.item.name}: ${data.item.current.price}: ${data.item.today.price} \n`

				if (j == IDs) {
					if (typeof newData !== 'undefined') {
						OSRS_ge_current_prices[message_type] = (OSRS_ge_current_prices[message_type] = newData) || newData;
					}
				}
			});
		});
		
		req.on('error', error => {
			console.error(`Error message 1\n ${error}`);
		});

		req.end();
	});
}

function update_ge_prices() {
    let extra_delay = 0;
    for (let [key, value] of Object.entries(itemIDs)) {
        extra_delay = extra_delay + 2500;
        setTimeout(function() {
            //console.log(key);
            fetchData(value, key.slice(0, -4), );
        }, extra_delay);
    }

    console.log('done with updating runescape');
    module.exports.OSRS_ge_current_prices = OSRS_ge_current_prices;
    return true;
}

function keep_ge_uptodate() {
	setInterval(function() {
		update_ge_prices();
	}, interval_between_info_refresh);
}

module.exports.keep_ge_uptodate = keep_ge_uptodate;
module.exports.update_ge_prices = update_ge_prices;