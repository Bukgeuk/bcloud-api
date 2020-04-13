const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const Account = JSON.parse(fs.readFileSync(path.join(__dirname, 'account.json'), 'utf8'));

var ex = {};

ex.getAccountObj = function(){
    return Account;
}

ex.checkLogin = function(username, password){
    if(Account[username] === undefined){
        return false;
    }

    if (Account[username].password === crypto.createHash('sha512').update(password).digest('hex')) {
        return true;
    } else {
        return false;
    }
}

ex.changePassword = function(username, password, newpassword){
    if(Account[username].password === crypto.createHash('sha512').update(password).digest('hex')){
        Account[username].password = crypto.createHash('sha512').update(newpassword).digest('hex');

        fs.writeFileSync(path.join(__dirname, 'account.json'), JSON.stringify(Account));

        return true;
    } else {
        return false;
    }
}

module.exports = ex;