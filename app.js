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
var Parse = require('parse/node');
Parse.serverURL = 'https://www.symbiocenter.com/parse';

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
}).get('/login', function (req, res) {
    res.setHeader('Content-Type', 'text/html');
    Parse.initialize('ilYgUXld1YqqqMvfpqRk59OqXt6MAKd8jis9oLhg','bylx336ZKZ4fQYnClEQ4TrTxMmkn1BhWYK07fgkP', 'myMasterKey');
    Parse.User.logIn(req.query.username, req.query.password, {
        success: function (user) {
            res.send("ok");
        },
        error: function (user, error) {
            res.send(error);
        }
    });
}).get('/calc_cc', function (req, res) {
    sliding_time = 30000;
    if (req.query.sliding_time != undefined)
        sliding_time = req.query.sliding_time;
    console.log("sliding_time " + sliding_time);
    child_process.exec('algo/algo5 ' + req.query.rr_list + " " + sliding_time, function (error, stdout, stderr) {
        res.setHeader('Content-Type', 'text/html');
        res.send(stdout);
    });
}).get('/calc_cc2', function (req, res) {
    sliding_time = 30000;
    if (req.query.sliding_time != undefined)
        sliding_time = req.query.sliding_time;
    console.log("sliding_time " + sliding_time);
    child_process.exec('algo/algo6 ' + req.query.rr_list + " " + sliding_time, function (error, stdout, stderr) {
        res.setHeader('Content-Type', 'text/html');
        res.send(stdout);
    });
}).get('/send_signal', function (req, res) {
    var username = req.param("username");
    var rr = req.param("signal");
    console.log(username + " send: " + rr);
    for (var i in userSockets[username])
        if (sio.sockets.connected[userSockets[username][i]] != undefined)
            sio.sockets.connected[userSockets[username][i]].emit('rr', rr);
    res.setHeader('Content-Type', 'text/html');
    res.send("ok");
}).get('/calcul_coherence', function (req, res) {
    res.setHeader('Content-Type', 'text/html');
    res.render('calcul_coherence.ejs', {title: "SymbioCenter Web"});
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

var rrGenTab = [832, 832, 784, 788, 772, 776, 752, 800, 776, 780, 800, 776, 720, 720, 752, 768, 748, 732, 728, 736, 772, 756, 748, 748, 764, 788, 800, 800, 764, 776, 808, 824, 828, 800, 828, 840, 848, 840, 812, 808, 796, 776, 804, 880, 868, 812, 784, 804, 808, 812, 812, 800, 792, 724, 736, 748, 716, 696, 732, 808, 952, 940, 884, 880, 872, 864, 848, 812, 764, 732, 712, 740, 816, 924, 916, 884, 904, 896, 892, 876, 828, 776, 740, 732, 740, 808, 904, 892, 872, 896, 884, 880, 852, 804, 764, 732, 732, 752, 840, 892, 896, 880, 880, 856, 840, 800, 772, 732, 724, 728, 800, 892, 912, 912, 908, 896, 880, 848, 800, 752, 736, 740, 772, 872, 892, 868, 844, 783, 756, 729, 736, 718, 694, 668, 784, 808, 808, 800, 780, 764, 736, 732, 716, 716, 732, 748, 760, 756, 752, 756, 756, 760, 760, 756, 772, 780, 796, 748, 724, 732, 764, 776, 744, 792, 780, 772, 780];
var _i = 0;
//sendSignalTest();
//function sendSignalTest() {
//    if (rrGenTab[_i] == undefined)
//        _i = 0;
//    rr = rrGenTab[_i];
//    _i++;
//    console.log("yoanr@symbiofi.com send: " + rr);
//    for (var i in userSockets["yoanr@symbiofi.com"])
//        if (sio.sockets.connected[userSockets["yoanr@symbiofi.com"][i]] != undefined)
//            sio.sockets.connected[userSockets["yoanr@symbiofi.com"][i]].emit('rr', rr);
//    setTimeout(sendSignalTest, rr);
//}

server.listen(8080, function () {
    console.log('listening on http://localhost:8069');
});
