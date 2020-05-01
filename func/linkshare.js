const fs = require('fs-extra');
const path = require('path');
const crypto = require('crypto');

let links = require('../linkshare.json');
let files = {};
for(let link in links){
    files[links[link]] = link;
}

function CreateLink(dir, name) {
    return new Promise(function(resolve, reject){
        if(files[dir + name] !== undefined){
            resolve({ already : true });
        }

        crypto.randomBytes(64, function (err, buffer) {
            let ret = {};
            
            if (err) {
                ret.error = true;
                resolve(ret);
            }

            let link = buffer.toString('hex');

            if (links[link] === undefined) {
                links[link] = (dir + name);
                files[dir + name] = link;
                ret.key = link;

                write();

                resolve(ret);
            } else {
                ret.error = true;
                resolve(ret);
            }
        })
    })
}

function write() {
    let fd = fs.openSync('./linkshare.json', 'w');
    fs.writeSync(fd, JSON.stringify(links), null, 'utf8');
    fs.closeSync(fd);
}

let ex = {};

ex.add = (dir, name) => {
    let ret = {};
    let flag = false;
    return new Promise(async function(resolve, reject){
        while(!flag){
            let create = await CreateLink(dir, name);
            if (create.already) {
                flag = true;
                ret = {
                    error : false,
                    key : files[dir + name]
                }
            } else if(!create.error) {
                flag = true;
                ret = create;
            }
        }

        resolve(ret);
    })
}

ex.remove = (dir, name) => {
    delete links[files[dir + name]];
    delete files[dir + name];
    write();
}

ex.modify = (from, to) => {
    files[to] = files[from];
    delete files[from];

    links[files[to]] = to;
}

ex.getFileByLink = (link) => {
    return links[link];
}

ex.getLinkByFile = (dir, name) => {
    return files[dir + name];
}

ex.getLinkByDirectory = (fulldir) => {
    return files[fulldir];
}

module.exports = ex;