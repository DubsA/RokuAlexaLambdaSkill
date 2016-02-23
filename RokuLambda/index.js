var APP_ID = null; //replace this with your app ID to make use of APP_ID verification

var AlexaSkill = require("./AlexaSkill");
var serverinfo = require("./serverinfo");
var http = require("http");

var BUTTON_LIST = ["home","reverse","forward","play","select","left","right","down","back","instant replay","info","backspace","search","enter"];
var APP_LIST = [{name: "roku home news", appid: "31863"},
			{name: "radio", appid: "3423"},
			{name: "roku recommends", appid: "41922"},
			{name: "youtube", appid: "837"},
			{name: "netflix", appid: "12"},
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
		callback();
        res.setEncoding('utf8');
        res.on('data', function (chunk) {
            console.log('Response: ' + chunk);
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
	ToggleTV: function (intent, session, response) {
		sendCommand("/toggletv",null,function() {
			response.tell("Affirmative");
		});	
	},
    	Type: function (intent, session, response) {
		sendCommand("/roku/type",intent.slots.Text.value,function() {
			response.tellWithCard("Typing text: "+intent.slots.Text.value,"Roku","Typing text: "+intent.slots.Text.value);
		});
    	},
	PlayPause: function (intent, session, response) {
		sendCommand("/roku/playpause",null,function() {
			response.tell("Affirmative");
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
	HelpIntent: function (intent, session, response) {
		response.tell("No help available at this time.");
    	}
};

exports.handler = function (event, context) {
    var roku = new AlexaRoku();
    roku.execute(event, context);
};
