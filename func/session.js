const crypto = require('crypto');

var ex = {};

let sessions = {};

ex.createSession = function(id){
    let ret = {};

    return new Promise(function(resolve, reject){
        crypto.randomBytes(64, function (err, buffer) {
            if (err) {
                ret.error = true;
                resolve(ret);
            }
            sessions[id] = buffer.toString('hex');
            ret.key = sessions[id];
            resolve(ret);
        })
    })
}

ex.checkSession = function(key){
    let ret = {};

    for (let id in sessions) {
        if (sessions[id] === undefined) continue;
        else if (sessions[id] !== key) continue;
        else {
            sessions[id] = undefined;
            ret.result = true;
            ret.id = id;
            return ret;
        }
    }

    ret.result = false;
    return ret;
}

ex.checkSession2 = function(id, key){
    let ret = {};

    if (sessions[id] === undefined) {
        ret.result = false;
    } else if (sessions[id] !== key) {
        ret.result = false;
    } else {
        ret.result = true;
    }
    
    return ret;
}

module.exports = ex;