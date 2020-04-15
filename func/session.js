const crypto = require('crypto');

var ex = {};

let sessions = {};

let download_sessions = {};

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
        sessions[id] = undefined;
        ret.result = true;
    }
    
    return ret;
}

function DownloadSessionCreate(dir, name){
    return new Promise(function(resolve, reject){
        crypto.randomBytes(64, function (err, buffer) {
            let ret = {};
            
            if (err) {
                ret.error = true;
                resolve(ret);
            }

            let key = buffer.toString('hex');

            if (download_sessions[key] === undefined) {
                download_sessions[key] = {
                    dir : dir,
                    name : name
                }
                ret.key = key;

                resolve(ret);
            } else {
                ret.error = true;
                resolve(ret);
            }
        })
    })
}

ex.createDownloadSession = function(dir, name){
    let ret = {};
    let flag = false;
    return new Promise(async function(resolve, reject){
        while(!flag){
            let create = await DownloadSessionCreate(dir, name);
            if(!create.error) {
                flag = true;
                ret = create;
            }
        }

        resolve(ret);
    })
}

ex.checkDownloadSession = function(key){
    let ret = {};

    if (download_sessions[key] === undefined) {
        ret.result = false;
    } else {
        ret.obj = download_sessions[key];
        download_sessions[key] = undefined;
        ret.result = true;
    }
    
    return ret;
}


module.exports = ex;