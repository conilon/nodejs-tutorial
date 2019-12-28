const express = require('express');
const cookieParser = require('cookie-parser');
const morgan = require('morgan');
const path = require('path');
const session = require('express-session');
const flash = require('connect-flash');
const util = require('util');
require('dotenv').config();

var indexRouter = require('./routes/index');

const app = express();

app.set('port', process.env.PORT || 8080);

app.use(morgan('dev'));
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser(process.env.COOKIE_SECRET));
app.use(session({
    resave: false,
    saveUninitialized: false,
    secret: process.env.COOKIE_SECRET,
    cookie: {
        httpOnly: true,
        secure: false,
    },
}));
app.use(flash());

app.use('/', indexRouter);

app.use((req, res, next) => {
    const err = new Error('Not Found');
    err.status = 404;
    next(err);
});

const server = app.listen(app.get('port'), () => {
    console.log(app.get('port'), '번 포트에서 대기 중');
});

const io = require('socket.io').listen(server, {
    log: false,
    origins: '*:*',
    pingInterval: 3000,
    pingTimeout: 5000,
});

io.sockets.on('connection', (socket, opt) => {
    socket.emit('message', { msg: 'Welcome ' + socket.id });

    util.log('connection>>', socket.id, socket.handshake.query);

    socket.on('join', (roomId, fn) => {
        socket.join(roomId, () => {
            util.log('Join', roomId, Object.keys(socket.rooms));
            if (fn) {
                fn();
            }
        });
    });

    socket.on('leave', (roomId, fn) => {
        socket.leave(roomId, () => {
            if (fn) {
                fn();
            }
        });
    });

    socket.on('rooms', (fn) => {
        if (fn) {
            fn(Object.keys(socket.rooms));
        }
    });

    socket.on('message', (data, fn) => {
        util.log("message>>", data.msg, Object.keys(socket.rooms));
        if (fn) {
            fn(data.msg);
        }
        socket.broadcast.to(data.room).emit('message', { room: data.room, msg: data.msg });
    });

    socket.on('message-for-one', (socketId, msg, fn) => {
        socket.to(socketId).emit('message', { msg: msg });
    });

    socket.on('disconnecting', (data) => {
        util.log('disconnecting>>', socket.id, Object.keys(socket.rooms));
    });

    socket.on('disconnect', (roomId, fn) => {
        util.log('disconnect>>', socket.id, Object.keys(socket.rooms));
    });
});
