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

MongoClient.connect("mongodb://localhost/f55887f22c0d448bad4e3ba68d9db565", function (error, db) {
    if (error)
        console.log(error);
    symbioDb = db;
});
app.set('view engine', 'ejs');
app.get('/', function (req, res) {
    res.setHeader('Content-Type', 'text/html');
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    res.render('expert.ejs', {title: "SymbioCenter Web"});
}).get('/test', function (req, res) {
    res.setHeader('Content-Type', 'text/html');
    res.render('index.ejs', {title: "SymbioCenter Web"});
}).get('/calc_cc', function (req, res) {
    child_process.exec('algo/algo5 ' + req.query.rr_list, function (error, stdout, stderr) {
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
    symbioDb.collection("_User").find({"email": data.username}).toArray(function (err, user) {
        user = user[0];
        if (err || !user) {
            console.log("User not found");
            return callback(new Error("User not found"));
        } else {
            socket.client.user = user;
            console.log(socket.client.user.email + " connected");
            if (userSockets[user.email] == undefined)
                userSockets[user.email] = [];
            userSockets[user.email].push(socket.id);
            return callback(null, true);
        }
        return callback(null, false);
    });
}

function disconnect(socket) {
    if (socket.client.user != undefined) {
        console.log(socket.client.user.email + ' disconnected');
        for (var i in userSockets[socket.client.user.email])
            if (userSockets[socket.client.user.email][i] == socket.id)
                userSockets[socket.client.user.email].splice(i, 1);
    } else {
        console.log('Unknown disconnected');
    }
}

sio.sockets.on('connection', function (socket) {
    socket.on("signal", function (signal) {
        console.log(socket.client.user.email + " send :" + signal);
        for (var i in userSockets[socket.client.user.email])
            if (sio.sockets.connected[userSockets[socket.client.user.email][i]] != undefined)
                sio.sockets.connected[userSockets[socket.client.user.email][i]].emit('rr', signal);
    });
});

sendSignalTest();
function sendSignalTest() {
    var rr = Math.floor((1050 - 850) * Math.random()) + 850;
    console.log("yoanr@symbiofi.com send :" + signal);
    for (var i in userSockets["yoanr@symbiofi.com"])
        if (sio.sockets.connected[userSockets["yoanr@symbiofi.com"][i]] != undefined)
            sio.sockets.connected[userSockets["yoanr@symbiofi.com"][i]].emit('rr', rr);
    setTimeout(sendSignalTest, rr);
}

server.listen(8080, function () {
    console.log('listening on http://localhost:8080');
});
