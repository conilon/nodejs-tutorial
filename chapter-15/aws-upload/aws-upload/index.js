const AWS = require('aws-sdk');
const gm = require('gm').subClass({ imageMagick: true });
const s3 = new AWS.S3();

exports.handler = (event, context, callback) => {
    const Bucket = event.Records[0].s3.bucket.name;
    const Key = event.Records[0].s3.object.key;
    const filename = Key.split('/')[Key.split('/').length - 1];
    const ext = Key.split('.')[Key.split('.').length - 1];
    s3.getObject({ Bucket, Key }, (error, data) => {
        if (error) {
            console.error(error);
            return callback(error);
        }
        return gm(data.Body)
            .resize(200, 200, '^')
            .quality(90)
            .toBuffer(ext, (error, buffer) => {
                if (error) {
                    console.error(error);
                    return callback(error);
                }
                return s3.putObject({
                    Bucket,
                    Key: `thumb/${filename}`,
                    Body: buffer,
                }, (error) => {
                    if (error) {
                        console.error(error);
                        return callback(error);
                    }
                    return callback(null, `thumb/${filename}`);
                });
            });
    });
};
