const express = require('express');
const uuidv4 = require('uuid/v4');
const { User, Domain } = require('../models');

const router = express.Router();

router.get('/', async (req, res, next) => {
    try {
        const user = await User.findOne({
            where: { id: req.user && req.user.id || null },
            include: { model: Domain },
        });
        res.render('login', {
            user,
            loginError: req.flash('loginError'),
            domains: user && user.domains,
        });
    } catch (error) {
        console.error(error);
        next(error);
    }
});

router.post('/domain', async (req, res, next) => {
    try {
        const result = await Domain.create({
            userId: req.user.id,
            host: req.body.host,
            type: req.body.type,
            clientSecret: uuidv4(),
        });
        if (result) {
            res.redirect('/');
        }
    } catch (error) {
        console.error(err);
        next(error);
    }
});

module.exports = router;
