var http = require('http');
var child_process = require('child_process');
var express = require('express');
var app = express();
app.set('view engine', 'ejs');
var server = http.createServer(app);
var io = require('socket.io').listen(server);

app.get('/', function (req, res) {
    res.setHeader('Content-Type', 'text/html');
    res.render('index.ejs', {title: "SymbioCenter Web"});
}).get('/login', function (req, res) {
    res.setHeader('Content-Type', 'text/html');
    res.render('login.ejs', {title: "SymbioCenter Web"});
}).use(function (req, res, next) {
    res.setHeader('Content-Type', 'text/plain');
    res.status(404).send('Page introuvable !');
});

var users = [];
var counter2 = 0;

io.on('connection', function (socket) {

    if (socket.handshake.query.email != undefined) {
        users[socket.handshake.query.email] = socket.id;
        console.log("Nouveau client :" + socket.handshake.query.email);
    }

    socket.on("signal", function (signal) {
        signal = JSON.parse(signal);

        if (io.sockets.connected[users[signal.destinataire]] != undefined) {
            
            child_process.exec('algo/algo ' + signal.signal, function (error, stdout, stderr) {
                counter2++;
                console.log(counter2 + " " + JSON.stringify(stdout));
                io.sockets.connected[users[signal.destinataire]].emit('signal-received', signal.signal);
            });
        }
    });
});

server.listen(8080);