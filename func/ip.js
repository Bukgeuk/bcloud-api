const requestip = require('request-ip');
const log = require('./log');

const pattern = /::ffff:/;

let ex = {};

ex.getClientIp = (req) => {
    let str = requestip.getClientIp(req);
    return str.replace(pattern, '');
}

module.exports = ex;