var http = require('http');
var child_process = require('child_process');
var express = require('express');
var app = express();
app.use(express.static("public"));
var server = http.createServer(app);
var sio = require('socket.io').listen(server);
var bodyParser = require('body-parser');
var userSockets = [];
var MongoClient = require("mongodb").MongoClient;
var symbioDb;
MongoClient.connect("mongodb://localhost/symbiocenterdb", function (error, db) {
    if (error)
        console.log(error);
    symbioDb = db;
});
app.set('view engine', 'ejs');
app.get('/', function (req, res) {
    res.setHeader('Content-Type', 'text/html');
    res.render('index.ejs', {title: "SymbioCenter Web"});
}).get('/expert', function (req, res) {
    res.setHeader('Content-Type', 'text/html');
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    res.render('expert.ejs', {title: "SymbioCenter Web"});
}).get('/algo', function (req, res) {
    child_process.exec('algo/algo3 ' + req.query.rr_list, function (error, stdout, stderr) {
        res.setHeader('Content-Type', 'text/html');
        res.send(stdout);
    });
}).use(function (req, res, next) {
    res.setHeader('Content-Type', 'text/plain');
    res.status(404).send('Page introuvable !');
});
require('socketio-auth')(sio, {
    authenticate: authenticate,
    disconnect: disconnect,
    timeout: 1000
});
function authenticate(socket, data, callback) {
    symbioDb.collection("users").find({"email": data.username, "password": data.password}).toArray(function (err, user) {
        user = user[0];
        if (data.username == "test" && data.password == "test") {
            var user = {};
            user.email = "test";
            user.password = "test";
            if (userSockets[123456789] == undefined)
                userSockets[123456789] = [];
            userSockets[123456789].push(socket.id);
        } else if (err || !user) {
            console.log("User not found");
            return callback(new Error("User not found"));
        } else {
            socket.client.user = user;
            console.log(socket.client.user.email + " connected");
            if (userSockets[user._id] == undefined)
                userSockets[user._id] = [];
            userSockets[user._id].push(socket.id);
        }
        return callback(null, user.password == data.password);
    });
}

function disconnect(socket) {
    console.log('disconnected');
}

sio.sockets.on('connection', function (socket) {
    socket.on("signal", function (signal) {
//        var rr = (signal * 60 / 1000);
        console.log(signal);
        for (var i in userSockets[socket.client.user._id])
            if (sio.sockets.connected[userSockets[socket.client.user._id][i]] != undefined)
                sio.sockets.connected[userSockets[socket.client.user._id][i]].emit('rr', signal);
    });
});

sendSignalTest();
function sendSignalTest() {
    var rr = Math.floor((1050 - 850) * Math.random()) + 850;
    for (var i in userSockets[123456789])
        if (sio.sockets.connected[userSockets[123456789][i]] != undefined)
            sio.sockets.connected[userSockets[123456789][i]].emit('rr', rr);
    setTimeout(sendSignalTest, rr);
}

server.listen(8080, function () {
    console.log('listening on http://localhost:8080');
});
