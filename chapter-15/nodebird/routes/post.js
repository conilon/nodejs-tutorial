const express = require('express');
const multer = require('multer');
const path = require('path');
const AWS = require('aws-sdk');
const multer3 = require('multer-s3');
const fs = require('fs');

const { Post, Hashtag, User } = require('../models');
const { isLoggedIn } = require('./middlewares');

const router = express.Router();

fs.readdir('uploads', (error) => {
    if (error) {
        console.error('uploads폴더가 없어 uploads 폴더를 생성합니다.');
        fs.mkdirSync('uploads')
    }
});

AWS.config.update({
    accessKeyId: process.S3_ACCESS_KEY_ID,
    secretAccessKey: process.S3_SECRET_ACCESS_KEY,
    region: 'ap-northeast-2',
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

const upload2 = multer();

const upload3 = multer({
    storage: multer3({
        s3: new AWS.S3(),
        bucket: 'nodebird',
        key(req, file, cb) {
            cb(null, `original/${+new Date()}${path.basename(file.originalname)}`);
        }
    }),
    limits: { fileSize: 10 * 1024 * 1024 },
})

router.post('/img', isLoggedIn, upload3.single('img'), (req, res) => {
    console.log(req.file);
    // res.json({ url: `/img/${req.file.filename}` });
    res.json({ url: req.file.location });
    const originalUrl = req.file.location;
    const url = originalUrl.replace(/\/original\//, '/thumb/');
    res.json({ url, originalUrl });
});

router.post('/', isLoggedIn, upload2.none(), async (req, res, next) => {
    try {
        const post = await Post.create({
            content: req.body.content,
            img: req.body.url,
            userId: req.user.id,
        });
        const hashtag = req.body.content.match(/#[^\s]*/g);
        console.log(hashtag)
        if (hashtag) {
            const result = await Promise.all(hashtag.map(tag => Hashtag.findOrCreate({
                where: { title: tag.slice(1).toLowerCase() },
            })));
            await post.addHashtags(result.map(r => r[0]));
        }
        res.redirect('/');
    } catch (error) {
        console.error(error);
        next(error);
    }
});

router.get('/hashtag', async (req, res, next) => {
    const query = req.query.hashtag;
    if (!query) {
        return res.redirect('/');
    }
    try {
        const hashtag = await Hashtag.findOne({
            where: { title: query },
        });
        let posts = [];
        if (hashtag) {
            posts = await hashtag.getPosts({ include: [{ model: User }] });
        }
        return res.render('main', {
            title: `${query} | NodeBird`,
            user: req.user,
            twits: posts,
        });
    } catch (error) {
        console.error(error);
        next(error);
    }
});

module.exports = router;
