const disk = require('diskusage');
const fs = require('fs');
const path_module = require('path');

const path = '/media/pi/Cloud';

const SizeUnits = ['B', 'KB', 'MB', 'GB'];

var ex = {}
ex.getSpaceInfo = function(){
    let ret = {};

    try {
        const info = disk.checkSync(path);
        ret = info;
        ret.error = false
    } catch (err) {
        ret.error = true;
        console.log(err)
    }

    return ret;
}

ex.getFileList = function(dir){
    let ret = {};

    try {
        let files = fs.readdirSync(path + dir);
        if (dir.charAt(dir.length - 1) !== '/') dir += '/';
        ret.list = [];
        for(let i in files){
            if (dir === '/' && files[i] === 'System Volume Information') continue;

            let size = (fs.statSync(path + dir + files[i]))["size"]
            let sizestr = '';

            for(let j = 0; j < SizeUnits.length; j++){
                if (size <= 1024) {
                    sizestr = (size.toFixed(2) + SizeUnits[j]);
                    break;
                }
                size /= 1024;
            }

            ret.list.push({
                name : files[i],
                ext : path_module.extname(files[i]),
                size : sizestr
            })
        }
        ret.error = false;
    } catch (err) {
        ret.error = true;
        console.log(err)
    }

    return ret;
}

module.exports = ex;