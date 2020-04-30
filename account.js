const fs = require('fs-extra');
const path = require('path');
const crypto = require('crypto');

const Account = JSON.parse(fs.readFileSync(path.join(__dirname, 'account.json'), 'utf8'));

function write() {
    let fd = fs.openSync('./account.json', 'w');
    fs.writeSync(fd, JSON.stringify(Account), null, 'utf8');
    fs.closeSync(fd);
}

let ex = {};

ex.getAccountObj = function(id){
    return Account[id];
}

ex.checkLogin = function(username, password){
    if(Account[username] === undefined){
        return false;
    }

    if (Account[username].password === crypto.createHash('sha512').update(password).digest('base64')) {
        return true;
    } else {
        return false;
    }
}

ex.changePassword = function(username, password, newpassword){
    if(Account[username].password === crypto.createHash('sha512').update(password).digest('base64')){
        Account[username].password = crypto.createHash('sha512').update(newpassword).digest('base64');

        write();

        return true;
    } else {
        return false;
    }
}

module.exports = ex;