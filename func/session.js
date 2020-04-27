const crypto = require('crypto');

var ex = {};

let sessions = {};

let download_sessions = {};

let upload_sessions = {};

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
            delete sessions[id];
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
        delete sessions[id];
        ret.result = true;
    }
    
    return ret;
}

function downloadSessionCreate(dir, name){
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

function uploadSessionCreate(dir, name, ext){
    return new Promise(function(resolve, reject){
        crypto.randomBytes(64, function (err, buffer) {
            let ret = {};
            
            if (err) {
                ret.error = true;
                resolve(ret);
            }

            let key = buffer.toString('hex');

            if (upload_sessions[key] === undefined) {
                upload_sessions[key] = {
                    dir : dir,
                    name : name,
                    ext : ext
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
        while (!flag) {
            let create = await downloadSessionCreate(dir, name);
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
        delete download_sessions[key];
        ret.result = true;
    }
    
    return ret;
}

ex.createUploadSession = function(id, dir, name, ext){
    let ret = {};
    let flag = false;
    return new Promise(async function(resolve, reject){
        while(!flag){
            let create = await uploadSessionCreate(id, dir, name, ext);
            if(!create.error) {
                flag = true;
                ret = create;
            }
        }

        resolve(ret);
    })
}

ex.checkUploadSession = function(key){
    let ret = {};

    if (upload_sessions[key] === undefined) {
        ret.result = false;
    } else {
        ret.obj = upload_sessions[key];
        delete upload_sessions[key];
        ret.result = true;
    }
    
    return ret;
}


module.exports = ex;