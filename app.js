var http = require('http');
var child_process = require('child_process');
var express = require('express');
var app = express();
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
        if (err || !user) {
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
    console.log(socket.client.user.email + ' disconnected');
}

sio.sockets.on('connection', function (socket) {
    socket.on("signal", function (signal) {
        child_process.exec('algo/algo ' + signal, function (error, stdout, stderr) {
            cc = JSON.parse(stdout);
            cc.user_id = socket.client.user._id;
            symbioDb.collection("biofeedbacks").insert(cc, null, function (error, results) {
                if (error)
                    console.log(error);
            });
            for (var i in userSockets[socket.client.user._id])
                if (sio.sockets.connected[userSockets[socket.client.user._id][i]] != undefined)
                    sio.sockets.connected[userSockets[socket.client.user._id][i]].emit('signal-received', cc);
        });
    });
});

server.listen(8080, function () {
    console.log('listening on http://localhost:8080');
});
