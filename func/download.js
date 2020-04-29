const fs = require('fs-extra');

const path = '/media/pi/Cloud';

var ex = {};

ex.getfile = function(dir, file){
    let ret = {};

    try {
        if (dir.charAt(dir.length - 1) !== '/') dir += '/';

        if (fs.existsSync(path + dir + file)) {
            ret.target = (path + dir + file);
        } else {
            ret.error = true;
        }
    } catch (err) {
        ret.error = true;
        log.log("ERROR", "download.js", `An error has occurred in getfile()\n${err}`);
    }

    return ret;
}

module.exports = ex;