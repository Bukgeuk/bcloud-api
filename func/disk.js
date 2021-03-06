const disk = require('diskusage');
const fs = require('fs-extra');
const path_module = require('path');
const log = require('./log');
const share = require('./linkshare');

const path = '/mnt/Cloud';

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
        log.log("ERROR", "disk.js", `An error has occurred in getSpaceInfo()\n${err}`);
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
        log.log("ERROR", "disk.js", `An error has occurred in getFileList()\n${err}`);
    }

    return ret;
}

ex.rename = function(dir, currname, newname){
    let ret = {};

    try {
        if (dir.charAt(dir.length - 1) !== '/') dir += '/';

        if (fs.existsSync(path + dir + newname)) {
            ret.error = true;
        } else {
            fs.renameSync(path + dir + currname, path + dir + newname);

            if (share.getLinkByFile(dir, currname) !== undefined) {
                share.modify(dir + currname, dir + newname);
            }

            ret.error = false;
        }
    } catch (err) {
        ret.error = true;
        log.log("ERROR", "disk.js", `An error has occurred in rename()\n${err}`);
    }

    return ret;
}

ex.changedir = function(currfulldir, newfulldir){
    let ret = {};

    try {
        fs.renameSync(path + currfulldir, path + newfulldir);

        if (share.getLinkByDirectory(currfulldir) !== undefined) {
            share.modify(currfulldir, newfulldir);
        }

        ret.error = false;
    } catch (err) {
        ret.error = true;
        log.log("ERROR", "disk.js", `An error has occurred in changedir()\n${err}`);
    }

    return ret;
}

ex.remove = function(dir, target){
    let ret = {};

    try {
        if (dir.charAt(dir.length - 1) !== '/') dir += '/';
        fs.removeSync(path + dir + target);

        if (share.getLinkByFile(dir, target) !== undefined) {
            share.remove(dir, target);
        }

        ret.error = false;
    } catch (err) {
        ret.error = true;
        log.log("ERROR", "disk.js", `An error has occurred in remove()\n${err}`);
    }

    return ret;
}

ex.removemultiple = function(dir, target){
    let ret = {};

    try {
        if (dir.charAt(dir.length - 1) !== '/') dir += '/';

        for(let i = 0; i < target.length; i++){
            fs.removeSync(path + dir + target[i]);

            if (share.getLinkByFile(dir, target[i]) !== undefined) {
                share.remove(dir, target[i]);
            }
        }

        ret.error = false;
    } catch (err) {
        ret.error = true;
        log.log("ERROR", "disk.js", `An error has occurred in removemultiple()\n${err}`);
    }

    return ret;
}

ex.createfolder = function(dir, name){
    let ret = {};

    try {
        if (dir.charAt(dir.length - 1) !== '/') dir += '/';

        let flag = false;
        let i = 0;
        let name2 = name;
        while (!flag) {
            if (!fs.existsSync(path + dir + name2)){
                if(i === 0) fs.mkdirSync(path + dir + name);
                else fs.mkdirSync(`${path + dir + name} (${i})`);
                flag = true;
            } else {
                i++;
                name2 = `${name} (${i})`;
            }
        }

        ret.error = false;
    } catch (err) {
        ret.error = true;
        log.log("ERROR", "disk.js", `An error has occurred in createfolder()\n${err}`);
    }

    return ret;
}

module.exports = ex;