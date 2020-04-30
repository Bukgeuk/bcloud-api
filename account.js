const fs = require('fs-extra');
const path = require('path');
const crypto = require('crypto');

const Account = JSON.parse(fs.readFileSync(path.join(__dirname, 'account.json'), 'utf8'));

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

        fs.writeFileSync(path.join(__dirname, 'account.json'), JSON.stringify(Account));

        return true;
    } else {
        return false;
    }
}

ex.createSalt = function() {
    return new Promise(function(resolve, reject){
        crypto.randomBytes(16, function(err, buffer){
            if(err) reject();
            else resolve(buffer.toString('base64'));
        })
    })
}

module.exports = ex;