const express = require('express');
const passport = require('passport');
const bcrypt = require('bcrypt');
const { isLoggedIn, isNotLoggedIn } = require('./middlewares');
const { User } = require('../models');

const router = express.Router();

const request = require('request');


router.post('/join', isNotLoggedIn, async (req, res, next) => {
    const { email, nick, password } = req.body;
    try {
        const exUser = await User.findOne({
            where: { 
                email,
            },
        });
        if (exUser) {
            req.flash('joinError', '이미 가입된 이메일입니다.');
            return res.redirect('/join');
        }
        const hash = await bcrypt.hash(password, 12);
        await User.create({
            email,
            nick,
            password: hash,
        });
        return res.redirect('/');
    } catch (error) {
        console.error(error);
        return next(error);
    }
});

router.post('/login', isNotLoggedIn, (req, res, next) => {
    passport.authenticate('local', (authError, user, info) => {
        if (authError) {
            console.error(authError);
            return next(authError);
        }
        if (!user) {
            req.flash('localError', info.message);
            return res.redirect('/');
        }
        return req.login(user, (loginError) => {
            if (loginError) {
                console.error(loginError);
                return next(loginError);
            }
            return res.redirect('/');
        });
    })(req, res, next); // 미들웨어 내의 미들웨어에는 (req, res, next)를 붙입니다.
});

router.get('/logout', isLoggedIn, (req, res, next) => {
    req.logout();
    req.session.destroy();
    res.redirect('/');
});

router.get('/kakao', passport.authenticate('kakao'));

router.get('/kakao/callback', passport.authenticate('kakao', {
    failureredirect: '/',
}), (req, res) => {
    res.redirect('/');
});

router.get('/kakao/logout', isLoggedIn, (req, res, next) => {
    const options = {
        method: 'POST',
        url: 'https://kapi.kakao.com/v1/user/logout',
        headers: {
            'Content-Type': 'application/json;charset=UTF-8',
            'Authorization': `Bearer ${req.user.accessToken}`
        },
        form: {
            id: req.user.snsId,
        },
    };
    
    request(options, async (error, response, body) => {
        if (!error && response.statusCode == 200) {
            var info = JSON.parse(body);
            console.log(info);
        }
        if (error) {
            console.log(error);
        }
        req.logout();
        req.session.destroy();
        res.redirect('/');
    });
});

router.get('/kakao/withdrawal', isLoggedIn, (req, res, next) => {
    const options = {
        method: 'POST',
        url: 'https://kapi.kakao.com/v1/user/unlink',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'Authorization': 'KakaoAK ba537b18749a483a5482e8a7e54dec51'
        },
        form: {
            target_id_type: 'user_id',
            target_id: req.user.snsId,
        },
    };

    request(options, async (error, response, body) => {
        if (!error && response.statusCode == 200) {
            var info = await JSON.parse(body);
            console.log(info);
            const result = await User.destroy({
                where: {
                    snsId: info.id,
                },
            });
            if (result) {
                req.logout();
                req.session.destroy();
            }
        }
        if (error) {
            console.log(error);
        }
        res.redirect('/');
    });
});

module.exports = router;
