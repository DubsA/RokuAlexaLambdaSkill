var APP_ID = null; //replace this with your app ID to make use of APP_ID verification
////////////////////////////////////
var AWS = require('aws-sdk');
var dynamodb = new AWS.DynamoDB();
////////////////////////////////////
var AlexaSkill = require("./AlexaSkill");
var serverinfo = require("./serverinfo");
var http = require("http");
var storage = require("./storage")

var BUTTON_LIST = ["home","reverse","forward","play","select","left","right","down","back","instant replay","info","backspace","search","enter"];
var APP_LIST = [{name: "roku home news", appid: "31863"},
				{name: "radio", appid: "3423"},
				{name: "roku recommends", appid: "41922"},
				{name: "sling tv", appid: "46041"},
				{name: "cbs all access", appid: "31440"},
				{name: "nfl", appid: "44856"},
				{name: "watch espn", appid: "34376"},
				{name: "pbs kids", appid: "23333"},
				{name: "twitch", appid: "50539"},
				{name: "amazon video", appid: "13"},
				{name: "hulu", appid: "2285"},
				{name: "play movies", appid: "50025"},
				{name: "vudu", appid: "13842"},
				{name: "youtube", appid: "837"},
				{name: "beachbody on demand", appid: "63822"},
				{name: "netflix", appid: "12"},
				{name: "movie store and tv store", appid: "31012"}
];
				

if (serverinfo.host == "127.0.0.1") {
    throw "Default hostname found, edit your serverinfo.js file to include your server's external IP address";
}

var AlexaRoku = function () {
    AlexaSkill.call(this, APP_ID);
};

AlexaRoku.prototype = Object.create(AlexaSkill.prototype);
AlexaRoku.prototype.constructor = AlexaRoku;

function sendCommand(path,body,callback) {
    var opt = {
        host:serverinfo.host,
		port:serverinfo.port,
        path: path,
        method: 'POST',
    };

    var req = http.request(opt, function(res) {
		if (path != "/updateapplist") callback();
        res.setEncoding('utf8');
        res.on('data', function (chunk) {
            console.log('Response: ' + chunk);
			var testString = "Installed Apps: ";
			var appStringIndex = chunk.indexOf(testString);
			if (appStringIndex > -1) {
				var rokuAppString = chunk.substring(testString.length);
				var rokuAppObj = JSON.parse(rokuAppString);
				var numKeys = Object.keys(rokuAppObj).length;
				var count = 0
				Object.keys(rokuAppObj).forEach(function(key) {
					var data = {
						name: key,
						id: rokuAppObj[key]
					};
					count++;
					console.log(count, numKeys);
					storage.add(data, function(text) {
						console.log(text);
					});
					if (path == "/updateapplist" && count == numKeys) callback();
				});
			}
        });
    });

	if (body) req.write(body);
    req.end();
}

AlexaRoku.prototype.intentHandlers = {
    PlayLast: function (intent, session, response) {
		sendCommand("/roku/playlast",null,function() {
			response.tellWithCard("Playing the last Netflix show you searched");
		});
    },
	NextEpisode: function (intent, session, response) {
		sendCommand("/roku/nextepisode",null,function() {
			response.tellWithCard("Playing next episode");
		});
    },
	LastEpisode: function (intent, session, response) {
		sendCommand("/roku/lastepisode",null,function() {
			response.tellWithCard("Playing previous episode");
		});
    },
    Type: function (intent, session, response) {
		sendCommand("/roku/type",intent.slots.Text.value,function() {
			response.tellWithCard("Typing text: "+intent.slots.Text.value,"Roku","Typing text: "+intent.slots.Text.value);
		});
    },
	SearchPlay: function (intent, session, response) {
		sendCommand("/roku/searchplay",intent.slots.Text.value,function() {
			response.tellWithCard("Playing: "+intent.slots.Text.value,"Roku","Playing: "+intent.slots.Text.value);
		});
    },
	KeyPress: function (intent, session, response) {
		var text = intent.slots.Buttons.value.replace(/^\s+|\s+$/g,'').toLowerCase();
		if (text=="thank you") {
			response.tell("You're welcome");
		} else{
        sendCommand("/roku/keypress",intent.slots.Buttons.value,function() {
            response.ask(" ","Are you still there");
        });
		}
	},
	LaunchApp: function (intent, session, response) {
		var text = intent.slots.App.value.replace(/^\s+|\s+$/g,'').toLowerCase();
		var index = APP_LIST.map(function (e){return e.name;}).indexOf(text);
		if (index<0){
			response.ask("Did not find: "+intent.slots.App.value+" in the installed app list.","");
		} else{
			sendCommand("/roku/launch",APP_LIST[index].appid,function() {
			response.tell("Launching the "+APP_LIST[index].name+" app.");
		});
		}
	},
	VolumeUp: function(intent, session, response) {
	    sendCommand("/LGTV/volumeup",null,function() {
	        response.tell("Turning the volume up.");
	    });
	},
	VolumeDown: function(intent, session, response) {
	    sendCommand("/LGTV/volumedown",null,function() {
	        response.tell("Turning the volume down.");
	    });
	},
	ChangeVolume: function(intent, session, response) {
	    var newVolume = intent.slots.level.value;
	    sendCommand("/LGTV/volume",newVolume,function() {
	        response.tell("Set volume to "+newVolume+".");
	    });
	},
	UpdateAppList: function(intent, session, response) {
		sendCommand("/updateapplist",null,function() {
		//response.tell("Updating the Roku app list.");
		response.tell("");
		});
	},
    HelpIntent: function (intent, session, response) {
        response.tell("No help available at this time.");
    }
};

exports.handler = function (event, context) {
    var roku = new AlexaRoku();
    roku.execute(event, context);
	
	var tableName = "RokuApps";
    var datetime = new Date().getTime().toString();
};
