const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const Room = require('../schemas/room');
const Chat = require('../schemas/chat');
const User = require('../schemas/user');

const router = express.Router();

fs.readdir('uploads', (error) => {
    if (error) {
        console.error('uploads폴더가 없어 uploads폴더를 생성합니다.');
        fs.mkdirSync('uploads');
    }
});

const upload = multer({
    storage: multer.diskStorage({
        destination(req, file, cb) {
            cb(null, 'uploads/');
        },
        filename(req, file, cb) {
            const ext = path.extname(file.originalname);
            cb(null, path.basename(file.originalname, ext) + new Date().valueOf() + ext);
        },
    }),
    limits: { fileSize: 10 * 1024 * 1024 },
});

router.post('/room/:id/gif', upload.single('gif'), async (req, res, next) => {
    try {
        const chat = new Chat({
            room: req.params.id,
            user: req.session.color,
            gif: req.file.filename,
        });
        await chat.save();
        req.app.get('io').of('/chat').to(req.params.id).emit('chat', chat);
        res.send('ok');
    } catch (error) {
        console.error(error);
        next(error);
    }
});

router.get('/', async (req, res) => {
    try {
        const rooms = await Room.find({});
        res.render('main', { rooms, title: 'GIF 채팅방', error: req.flash('roomError') });
    } catch (error) {
        console.error(error);
        next(error);
    }
});

router.get('/room', (req, res) => {
    res.render('room', { title: 'GIF 채팅방 생성' });
});

router.post('/room', async (req, res, next) => {
    try {
        const date = new Date();
        const room = new Room({
            title: req.body.title,
            max: req.body.max,
            owner: req.session.color,
            password: req.body.password,
            createdAt: date.getTime() + 32400000,
        });
        const newRoom = await room.save();
        const io = req.app.get('io');
        io.of('/room').emit('newRoom', newRoom);
        res.redirect(`/room/${newRoom._id}?password=${req.body.password}`);
    } catch (error) {
        console.error(error);
        next(error);
    }
});

router.get('/room/:id', async (req, res, next) => {
    try {
        const room = await Room.findOne({ _id: req.params.id });
        const io = req.app.get('io');
        if (!room) {
            req.flash('roomError', '존재하지 않는 방입니다.');
            return res.redirect('/');
        }
        if (room.password && room.password !== req.query.password) {
            req.flash('roomError', '비밀번호가 틀렸습니다.');
            return res.redirect('/');
        }
        const { rooms } = io.of('/chat').adapter;
        if (rooms && rooms[req.params.id] && room.max <= rooms[req.params.id].length) {
            req.flash('roomError', '허용 인원이 초과하였습니다.');
            return res.redirect('/');
        }
        const user = await User.findOne({ $and: [{ color: req.session.color, room: req.params.id }] });
        if (user) {
            req.flash('roomError', '이미 같은 채팅방에 참여 중입니다.');
            return res.redirect('/');
        }
        const date = new Date();
        await new User({
            room: room._id,
            color: req.session.color,
            createdAt: date.getTime() + 32400000,
        }).save();
        const chats = await Chat.find({ room: room._id }).sort('createdAt');
        return res.render('chat', {
            room,
            title: room.title,
            chats,
            user: req.session.color,
        });
    } catch (error) {
        console.error(error);
        next(error);
    }
});

router.delete('/room/:id', async (req, res, next) => {
    try {
        await Room.deleteOne({ _id: req.params.id });
        await Chat.deleteOne({ room: req.params.id });
        res.send('ok');
        setTimeout(() => {
            req.app.get('io').of('/room').emit('removeRoom', req.params.id);
        }, 2000);
    } catch (error) {
        console.error(error);
        next(error);
    }
});

router.post('/room/:id/chat', async (req, res, next) => {
    try {
        const date = new Date();
        const chat = new Chat({
            room: req.params.id,
            user: req.session.color,
            chat: req.body.chat,
            createdAt: date.getTime() + 32400000,
        });
        await chat.save();
        req.app.get('io').of('/chat').to(req.params.id).emit('chat', chat);
        res.send('ok');
    } catch (error) {
        console.error(error);
        next(error);
    }
});

router.delete('/room/user/:color', async (req, res, next) => {
    try {
        await User.deleteOne({ color: '#' + req.params.color });
        res.send('ok');
    } catch (error) {
        console.error(error);
        next(error);
    }
});

module.exports = router;
