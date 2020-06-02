/* required modules */
const Discord = require('discord.js');
const https = require('https');
const pingMonitor = require('ping-monitor');

const general = require('./modules/general.js');
const runescape = require('./modules/runescape.js');

// Load bot config
const bot_config = require('./bot_config.json');
// Load system strings
const systemStrings = require('./strings.json');

//#region  constants

// botkey //
const bot_key = bot_config.bot_key;

// Discord //
const discordClient = new Discord.Client();
let connected_to_discord = false;

const discord_server_admins = [
	'367767515771830309'	// Archosaur
]

// all stuff Lotro related //
let ping_monitor_interval = 1; // minutes
let lotro_server_status = true;

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

// all stuff Runescape related //
const allows_GE_channels =  [
	'710989901075578913', 	// test server - general
	'713130722097102908'	// Brave Company - runescape
];	

// console for debugging //
let console_channel;

let current_lotro_beacon_issue;

// timeout settings //
let people_on_timeout = {};
const max_before_message_timeout = 5;
const time_to_reset_message_timeout = 5; // minutes
const interval_to_reset_message_timneout = time_to_reset_message_timeout * 60 * 1000;

// General //
const prefix = '!';
const version = '1.1.0';

//#endregion


/* functions */

const myPingMonitor = new pingMonitor({
	address: 	lotro_server_ips[2],
	port:		9000,
    interval: 	ping_monitor_interval
});

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
	messageObject.reply(systemStrings.discord_reply_on_timeout);
}

function reply_back_to_user(messageObject, message) {
	if (check_people_for_timeout(messageObject.author.id)) {
		alert_people_on_timeout(messageObject);
		return;
	}
	messageObject.reply(message);
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
			let re = /lotro-beacon-issue-\d\d\d/gm; // define a "regular expression"
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
discordClient.on('ready', () => {
	console.log(`Logged in as ${discordClient.user.tag}!`);
	console_channel = discordClient.guilds.cache.find(guilds => guilds.id === bot_config.console_server_ID).channels.cache.find(channels => channels.id === bot_config.console_channel_ID);
	log_to_discord_console('Bot startup!');
});

// ping pong
discordClient.on('message', msg => {
	if (msg.author.bot) return; // ignore bot messages to avoid loops
	
	if (msg.content === 'ping') {
		reply_back_to_user(msg, 'pong');
	}
});

// Command 'handler'
discordClient.on('message', incomming_discord_message => {
	// command example: !lotro servers
	if (incomming_discord_message.author.bot) return;
	if (!incomming_discord_message.content.startsWith(prefix)) return;
	
	let arguments = incomming_discord_message.content.toLocaleLowerCase().slice(1).split(' ');
	console.log(arguments);
	let command = arguments.shift();

	switch(command){
		case 'help':
			reply_back_to_user(incomming_discord_message, 'List of commands: ' + bot_config.brave_bot_command_list);
			break;
		case 'commands':
			reply_back_to_user(incomming_discord_message, 'List of commands: ' + bot_config.brave_bot_command_list);
			break;
		case 'ge':
			if (!allows_GE_channels.includes(incomming_discord_message.channel.id)) return;
			
			let ge_command = arguments.shift();
			let new_message = discordClient.guilds.cache.find(guilds => guilds.id === incomming_discord_message.channel.guild.id).channels.cache.find(channels => channels.id === incomming_discord_message.channel.id);
			switch(ge_command) {
				case 'all':
					if (incomming_discord_message.author.username === 'Archosaur' && incomming_discord_message.author.id === '367767515771830309') {
						for (let [key, value] of Object.entries(runescape.OSRS_ge_current_prices)) {
							new_message.send(value);
							console.log(value);
						}
					} else {
						reply_back_to_user(systemStrings.no_permission_to_use_command);
					}
					break;
				default:
					if (typeof ge_command === 'undefined') return;

					let information =  runescape.OSRS_ge_current_prices[ge_command];
									
					if (typeof information !== 'undefined') {
						reply_back_to_user(incomming_discord_message, information);
					} else if (typeof information === 'undefined') {
						reply_back_to_user(incomming_discord_message, runescape.OSRS_error_message);
					}
			}
			break;
		case 'get':
			let get_command = arguments.shift()
			switch(get_command) {
				case 'info':
					if (incomming_discord_message.author.username === 'Archosaur') {
					console.log(incomming_discord_message);
					console_channel.send( '\n' +
						incomming_discord_message.channel.guild.name + '\n' +
						incomming_discord_message.channel.guild.id + '\n' +
						incomming_discord_message.channel.name + '\n' +
						incomming_discord_message.channel.id + '\n' +
						incomming_discord_message.author.username + '\n' +
						incomming_discord_message.author.id
					);
					} else {
						incomming_discord_message.reply(systemStrings.no_permission_to_use_command);
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
				case 'botinfo':
					reply_back_to_user(incomming_discord_message, '\n' +
						'bot name:             ' + 'Brave Bot' + '\n' +
						'bot version:          ' + version + '\n' +
						'bot startup time: ' + general.timestamp_to_string(discordClient.readyTimestamp) + '\n' +
						'bot uptime:           ' + general.uptime_to_string(discordClient.uptime) + '\n'
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
					incomming_discord_message.reply(systemStrings.lotro_server_online);
				} else {
					incomming_discord_message.reply(systemStrings.lotro_server_offline);
				}
			} else if (lotro_command === 'beacon') {
				GetLatestArticleURL().then((latestArticleURL) => {
					console.log(latestArticleURL);
					reply_back_to_user(incomming_discord_message, latestArticleURL);
				});
				
			} 
			break;
		case 'github':
			reply_back_to_user(incomming_discord_message, bot_config.github_brave_bot);
			break;
		default:
			reply_back_to_user(incomming_discord_message, systemStrings.no_command_available);
	}
});


// Lotro ping test //
myPingMonitor.on('up', function (res, state) {
	if (ping_monitor_interval != 5) {
		console.log('Yay!! ' + res.address + ':' + res.port + ' is up.');
		setTimeout(function() {
			log_to_discord_console(systemStrings.lotro_server_online);
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
				log_to_discord_console(systemStrings.lotro_server_offline);
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

// true startup //
runescape.update_ge_prices();
runescape.keep_ge_uptodate();

discordClient.login(bot_key);
