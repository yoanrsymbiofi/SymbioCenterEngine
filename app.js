var http = require('http');
var child_process = require('child_process');
var express = require('express');
var app = express();
var server = http.createServer(app);
var jwt = require('jsonwebtoken');
var socketioJwt = require('socketio-jwt');
var sio = require('socket.io').listen(server);
var jwtSecret = 'BPOQlX9NnTnw7a8iQGNDUHM2RWAC8U1';
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

app.get('/login', function (req, res) {
    symbioDb.collection("users").find({"email": req.query.username, "password": req.query.password}).toArray(function (error, user) {
        if (error)
            console.log(error);
        if (user.length > 0) {
            var token = jwt.sign(user[0], jwtSecret, {expiresIn: 60 * 60 * 24});
            res.json({token: token});
        } else {
            res.send(401, 'Invalid user');
        }
    });
}).get('/', function (req, res) {
    res.setHeader('Content-Type', 'text/html');
    res.render('index.ejs', {title: "SymbioCenter Web"});
}).use(function (req, res, next) {
    res.setHeader('Content-Type', 'text/plain');
    res.status(404).send('Page introuvable !');
});

sio.set('authorization', socketioJwt.authorize({
    secret: jwtSecret,
    handshake: true
}));

sio.sockets.on('connection', function (socket) {
    if (userSockets[socket.client.request.decoded_token._id] == undefined)
        userSockets[socket.client.request.decoded_token._id] = [];
    userSockets[socket.client.request.decoded_token._id].push(socket.id);
    socket.on("signal", function (signal) {
        child_process.exec('algo/algo ' + signal, function (error, stdout, stderr) {
            cc = JSON.parse(stdout);
            cc.user_id = socket.client.request.decoded_token._id;
            symbioDb.collection("biofeedbacks").insert(cc, null, function (error, results) {
                if (error)
                    console.log(error);
            });
            for (var i in userSockets[socket.client.request.decoded_token._id])
                if (sio.sockets.connected[userSockets[socket.client.request.decoded_token._id][i]] != undefined)
                    sio.sockets.connected[userSockets[socket.client.request.decoded_token._id][i]].emit('signal-received', cc);
        });
    });

});

server.listen(9000, function () {
    console.log('listening on http://localhost:9000');
});
