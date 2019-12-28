const mongoose = require('mongoose');
const dotenv = require('dotenv');

dotenv.config();

module.exports = () => {
    const connect = () => {
        if (process.env.NODE_ENV !== 'production') {
            mongoose.set('debug', true);
        }
        mongoose.connect(`mongodb://${process.env.USER_NAME}:${process.env.DB_PASSWORD}@localhost:27017/admin`, {
            useUnifiedTopology: true,
            useNewUrlParser: true,
            dbName: 'nodejs',
        }, (err) => {
            if (err) {
                console.error('몽고디비 연결 에러: ', err);
            } else {
                console.log('몽고디비 연결 성공!');
            }
        });
    };
    connect();
    mongoose.connection.on('error', (err) => {
        console.error('몽고디비 연결 에러: ', err);
    });
    mongoose.connection.on('disconnected', () => {
        console.error('몽고디비 연결이 끊겼습니다. 연결을 재시도합니다.');
        connect();
    });
    require('./user');
    require('./comment');
};
