const Discord = require('discord.js');
const https = require('https');
const pingMonitor = require('ping-monitor');

// botkey //
const bot_config = require('./botConfig.json');

// Discord //
const client = new Discord.Client();
var connected_to_discord = false;

const discord_server_admins = [
	'367767515771830309',	// Archosaur
]

// all stuff Lotro related //
var ping_monitor_interval = 1; // minutes
var lotro_server_status = true;
const lotro_server_online = 'Lotro servers are up';
const lotro_server_offline = 'Lotro servers are down';

const lotro_server_ips = 	[
	'198.252.160.98', 	// Arkenstone
	'198.252.160.99',	// Branywine
	'198.252.160.100',	// Crickhollow
	'198.252.160.101',	// Gladden
	'198.252.160.102',	// Landroval
	'198.252.160.103',	// Belegear
	'198.252.160.104',	// Evernight
	'198.252.160.105',	// Gwaihir
	'198.252.160.106',	// Laurelin
	'198.252.160.107'	// Sirannon
];

const myPingMonitor = new pingMonitor({
	address: 	lotro_server_ips[2],
	port:		9000,
    interval: 	ping_monitor_interval
});

var current_lotro_beacon_issue;

// all stuff Runescape related //
const allows_GE_channels =  [
	'710989901075578913', 	// test server - general
	'713130722097102908'	// Brave Company - runescape
];	

const minutes_between_info_refesh = 30;
const interval_between_info_refresh = minutes_between_info_refesh * 60 * 1000;

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

var OSRS_ge_current_prices = {};

// console for debugging //
var console_channel;
const console_channel_ID = '711994899544670230';
const console_server_ID = '710989900605816963';

// timeout settings //
var people_on_timeout = {};
const max_before_message_timeout = 5;
const time_to_reset_message_timeout = 5; // minutes
const interval_to_reset_message_timneout = time_to_reset_message_timeout * 60 * 1000;
const message_on_timeout_counter = `Slow down please, I'm not fast enough!`;

// General //
const no_permission_to_use_request = 'You have no permission to use this command';
const OSRS_error_message = 'no info loaded or no valid command';
const no_command_available = 'no command found'
const prefix = '!';
const brave_bot_command_list = 'http://archosaur.nl/bravebot.html';
const version = '1.0.0';

// functions //
function fetchData(array_of_IDs, message_type) {
	var i = 0;
	var j = 0;
	var newData = '\n'; 
	var IDs = array_of_IDs.length;

	//log_to_discord_console(`updating ${message_type}`);

	array_of_IDs.forEach (function(Obj) {
		j++
		if (Obj == 0) {
			console.log('invalid itemID');
			return;
		}
		if (Obj == undefined) return;

		var options = {
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
				var data = JSON.parse(d);
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

function log_to_discord_console(to_log_thingy) {
	if (typeof console_channel === 'undefined') return;

	if (typeof to_log_thingy == 'string') {
		console_channel.send(to_log_thingy);
	}
}

function check_people_for_timeout(userID) {
	if (discord_server_admins.includes(userID)) return false;

	if (people_on_timeout[userID] == max_before_message_timeout) {
		return true;
	} else {
		people_on_timeout[userID] = (people_on_timeout[userID] + 1) || 1;
		console.log(people_on_timeout[userID]);
		return false;
	}
}

function alert_people_on_timeout(messageObject) {
	messageObject.reply(message_on_timeout_counter);
}

function reply_back_to_user(messageObject, message) {
	if (check_people_for_timeout(messageObject.author.id)) {
		alert_people_on_timeout(messageObject);
		return;
	}
	messageObject.reply(message);
}

function update_info() {
	var extra_delay = 0;
	for (let [key, value] of Object.entries(itemIDs)) {
		extra_delay = extra_delay + 2000;
		
		setTimeout(function() {
			setInterval(function() {
				fetchData(value.slice(-3), key);
			}, interval_between_info_refresh);
		}, extra_delay);
	}
}


async function GetLatestArticleURL() {
	const baseURL = 'https://www.lotro.com/en/game/articles';
	return new Promise((resolve,reject) => {
		// Use HTTPS module to fetch data from url          
		https.get(baseURL, (resp) => {
		let data = '';
   
		// Event: data -> As long as we receive a response (long html code for ex.) keep adding chunks of data to "data" variable
		resp.on('data', (chunk) => {
			data += chunk;
		});
	   
		// Event: response ended - we received all data
		resp.on('end', () => {
			var re = /lotro-beacon-issue-\d\d\d/gm; // define a "regular expression"
			let result = data.match(re); // match data against our regular expression
			// take the result from regular expression and sort it by last
			resolve(baseURL + '/' + result.sort(function (a, b) {
				return a.attr - b.attr
			})[0]
			);
		});
		}).on("error", (err) => {
			console.log("Error: " + err.message);
			reject(err.message);
		});
	});
	// Thanks to Grumpyoldcoder and Samwai.
}

// Discord setup
client.on('ready', () => {
	console.log(`Logged in as ${client.user.tag}!`);
	console_channel = client.guilds.cache.find(guilds => guilds.id === console_server_ID).channels.cache.find(channels => channels.id === console_channel_ID);
	log_to_discord_console('Bot startup!');
});

// ping pong
client.on('message', msg => {
	if (msg.author.bot) return;
	
	if (msg.content === 'ping') {
		reply_back_to_user(msg, 'pong');
	}
});

// Command 'handler'
client.on('message', incomming_discord_message => {
	// command example: !lotro servers
	if (incomming_discord_message.author.bot) return;
	if (!incomming_discord_message.content.startsWith(prefix)) return;
	
	let arguments = incomming_discord_message.content.toLocaleLowerCase().slice(1).split(' ');
	console.log(arguments);
	let command = arguments.shift();

	switch(command){
		case 'help':
			reply_back_to_user(incomming_discord_message, 'List of commands: ' + brave_bot_command_list);
			break;
		case 'commands':
			reply_back_to_user(incomming_discord_message, 'List of commands: ' + brave_bot_command_list);
			break;
		case 'ge':
			let ge_command = arguments.shift();
			let new_message = client.guilds.cache.find(guilds => guilds.id === incomming_discord_message.channel.guild.id).channels.cache.find(channels => channels.id === incomming_discord_message.channel.id);
			switch(ge_command) {
				case 'all':
					if (incomming_discord_message.author.username === 'Archosaur' && incomming_discord_message.author.id === '367767515771830309') {
						for (let [key, value] of Object.entries(OSRS_ge_current_prices)) {
							new_message.send(value);
							console.log(value);
						}
					} else {
						reply_back_to_user(no_permission_to_use_request);
					}
					break;
				default:
					if (typeof ge_command === 'undefined') return;

					let information =  OSRS_ge_current_prices[ge_command];
									
					if (typeof information !== 'undefined') {
						reply_back_to_user(incomming_discord_message, information);
					} else if (typeof information === 'undefined') {
						reply_back_to_user(incomming_discord_message, OSRS_error_message);
					}
			}
			break;
		case 'get':
			let get_command = arguments.shift()
			switch(get_command) {
				case 'info':
					if (incomming_discord_message.author.username === 'Archosaur') {
					console.log(msg);
					console_channel.send( '\n' +
						incomming_discord_message.channel.guild.name + '\n' +
						incomming_discord_message.channel.guild.id + '\n' +
						incomming_discord_message.channel.name + '\n' +
						incomming_discord_message.channel.id + '\n' +
						incomming_discord_message.author.username + '\n' +
						incomming_discord_message.author.id
					);
					} else {
						incomming_discord_message.reply(no_permission_to_use_request);
					}
					break;
				case 'userinfo':
					reply_back_to_user(incomming_discord_message, '\n' +
						'username:            ' + incomming_discord_message.author.username + '\n' +
						'user ID:                 ' + incomming_discord_message.author.id + '\n' +
						'bot:                        ' + incomming_discord_message.author.bot + '\n' +
						'avatar:                   ' + incomming_discord_message.author.avatar + '\n' +
						'last message ID:  ' + incomming_discord_message.author.lastMessageID + '\n' +
						'joined at (Unix):   ' + incomming_discord_message.channel.guild.joinedTimestamp
					);
			}
			break;
		case 'coffee':
			reply_back_to_user(incomming_discord_message, 'error: 418');
			break;
		case 'lotro':
			let lotro_command = arguments.shift()
			if (lotro_command === 'servers') {
				if (lotro_server_status) {
					incomming_discord_message.reply(lotro_server_online);
				} else {
					incomming_discord_message.reply(lotro_server_offline);
				}
			} else if (lotro_command === 'beacon') {
				console.log('we are here');
				GetLatestArticleURL().then((latestArticleURL) => {
					console.log(latestArticleURL);
					reply_back_to_user(incomming_discord_message, latestArticleURL);
				});
				
			} 
			break;
		default:
			reply_back_to_user(incomming_discord_message, no_command_available);
	}
});


// Lotro ping test //
myPingMonitor.on('up', function (res, state) {
	if (ping_monitor_interval != 5) {
		console.log('Yay!! ' + res.address + ':' + res.port + ' is up.');
		setTimeout(function() {
			log_to_discord_console(lotro_server_online);
		}, 1000);
		
	}
	ping_monitor_interval = 5;
	lotro_server_status = true;
});

myPingMonitor.on('down', function (res, state) {
	if (ping_monitor_interval != 1) {
		console.log('Oh Snap!! ' + res.address + ':' + res.port + ' is down! ');
		setTimeout(function() {
			log_to_discord_console(lotro_server_offline);
		}, 1000);
	}
	ping_monitor_interval = 1;
	lotro_server_status = false;
});

myPingMonitor.on('timeout', function (error, res) {
    console.log(error);
});

myPingMonitor.on('error', function (error, res) {
	if (res.code === 'ECONNREFUSED') {
		if (ping_monitor_interval != 1) {
			console.log('Oh Snap!! ' + res.address + ':' + res.port + ' is down! ');
			setTimeout(function() {
				log_to_discord_console(lotro_server_offline);
			}, 1000);
		}
		ping_monitor_interval = 1;
		lotro_server_status = false;
	} else {
		console.log(error);
	}
});

// Timers //
setInterval(function() {
	if (Object.keys(people_on_timeout).length > 0) {
		log_to_discord_console('timeout counter reset on set interval');
	}
	people_on_timeout = {};
}, interval_to_reset_message_timneout);

//give the bot time to connect, then call OSRS GE
setTimeout(function() {
	log_to_discord_console('updating Runescape information')
	let extra_delay = 0;
	for (let [key, value] of Object.entries(itemIDs)) {
		extra_delay = extra_delay + 2500;
		setTimeout(function() {
			console.log(key);
			fetchData(value, key.slice(0, -4));
		}, extra_delay);
	}
}, 2000);


// true startup //
update_info();

client.login(bot_config.bot_key);
