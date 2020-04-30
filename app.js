// import modules
const express = require('express');
const path = require('path');
const fs = require('fs-extra');
const bodyParser = require('body-parser');
const crypto = require('crypto');
const cors = require('cors');
const multer = require('multer');
const rateLimit = require('express-rate-limit');
const https = require('https');

const option = {
    ca: fs.readFileSync('/etc/letsencrypt/live/raw.bcloud.kro.kr/fullchain.pem'),
    key: fs.readFileSync(path.resolve(process.cwd(), '/etc/letsencrypt/live/raw.bcloud.kro.kr/privkey.pem'), 'utf8').toString(),
    cert: fs.readFileSync(path.resolve(process.cwd(), '/etc/letsencrypt/live/raw.bcloud.kro.kr/cert.pem'), 'utf8').toString(),
};

// import custom modules
const disk = require('./func/disk');
const account = require('./account');
const session = require('./func/session');
const download = require('./func/download');
const log = require('./func/log');
const ip = require('./func/ip');
const share = require('./linkshare');

const app = express();
const port = 3000;
const upath = '/media/pi/Cloud';

let upload = multer({
    fileFilter: function (req, file, cb) {
        if (req.check) cb(null, true);
        else {
            req.cus = session.checkUploadSession(req.body.key);

            if (!req.cus.result) {
                req.detectError = true;
                cb(null, false);
            } else {
                req.check = true;
                cb(null, true);
            }
        } 
    },
    storage: multer.diskStorage({
        destination : function (req, file, cb) {
            cb(null, upath + req.cus.obj.dir);
        },
        filename : function (req, file, cb) {
            let flag = false;
            let i = 0;

            if (req.cus.obj.ext instanceof Array) {
                if (req.i === undefined) req.i = 0;

                const rname = file.originalname.substr(0, file.originalname.length - req.cus.obj.ext[req.i].length);
                let name2 = rname + req.cus.obj.ext[req.i];
                while (!flag) {
                    if (!fs.existsSync(upath + req.cus.obj.dir + name2)){
                        if(i === 0) cb(null, file.originalname);
                        else cb(null, `${rname} (${i})${req.cus.obj.ext[req.i]}`);
                        flag = true;
                    } else {
                        i++;
                        name2 = `${rname} (${i})${req.cus.obj.ext[req.i]}`;
                    }
                }
                req.i++;
            } else {
                const rname = file.originalname.substr(0, file.originalname.length - req.cus.obj.ext.length);
                let name2 = rname + req.cus.obj.ext;
                while (!flag) {
                    if (!fs.existsSync(upath + req.cus.obj.dir + name2)){
                        if(i === 0) cb(null, file.originalname);
                        else cb(null, `${rname} (${i})${req.cus.obj.ext}`);
                        flag = true;
                    } else {
                        i++;
                        name2 = `${rname} (${i})${req.cus.obj.ext}`;
                    }
                }
            }
        }
    })
})

app.use(rateLimit({
    windowMs: 1 * 60 * 1000,
    max: 100
}))
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended:true}));
app.use(cors());

app.post('/beforeupload', (req, res) => {
    let ret = {};
    if (session.checkSession2(req.body.id, req.body.key).result) {
        ret.result = true;
        session.createSession(req.body.id).then(function(data){
            ret.session = data;
            session.createUploadSession(req.body.id, req.body.dir, req.body.name, req.body.ext).then(function(data2){
                ret.uploadSession = data2;
                res.json(ret);
            })
        })
    } else {
        ret.result = false;
        res.json(ret);
    }
})

app.post('/uploadsingle', upload.single('file'), (req, res) => {
    let ret = {};
    
    if(req.detectError){
        log.log("WARN", "app.js", `Reject upload request { ip : "${ip.getClientIp(req)}", id : "${req.cus.obj.id}", dir : "${req.cus.obj.dir}", name : "${req.cus.obj.name}", count : 1 }`);
        ret.result = false;
        res.json(ret);
        return;
    }

    log.log("INFO", "app.js", `1 file uploaded { ip : "${ip.getClientIp(req)}", id : "${req.cus.obj.id}", dir : "${req.cus.obj.dir}", name : "${req.cus.obj.name}" }`);

    ret.result = true;
    res.json(ret);
})

app.post('/uploadmultiple', upload.array('files'), (req, res) => {
    let ret = {};
    
    if(req.detectError){
        let msg = `Reject upload request { ip : "${ip.getClientIp(req)}", id : "${req.cus.obj.id}", dir : "${req.cus.obj.dir}", name : [ `;

        for(let i = 0; i < req.cus.obj.ext.length; i++){
            if (i !== 0) msg += `, `;
    
            msg += `"${req.cus.obj.name[i]}"`;
        }
        msg += ` ], count : ${req.cus.obj.ext.length} }`;
    
        log.log("WARN", "app.js", msg);

        ret.result = false;
        res.json(ret);
        return;
    }

    let msg = `${req.cus.obj.ext.length} files uploaded { ip : "${ip.getClientIp(req)}", id : "${req.cus.obj.id}", dir : "${req.cus.obj.dir}", name : [ `;

    for(let i = 0; i < req.cus.obj.ext.length; i++){
        if (i !== 0) msg += `, `;

        msg += `"${req.cus.obj.name[i]}"`;
    }
    msg += ` ] }`;

    log.log("INFO", "app.js", msg);

    ret.result = true;
    res.json(ret);
})

app.post('/login', (req, res) => {
    let ret = {};

    if(account.checkLogin(req.body.id, req.body.pw)) {
        log.log("INFO", "app.js", `Approve login request { ip : "${ip.getClientIp(req)}", id : "${req.body.id}", pw : "${req.body.pw}" }`);
        ret.result = true;
        session.createSession(req.body.id).then(function(data){
            ret.session = data;
            res.json(ret);
        })
    } else {
        log.log("WARN", "app.js", `Reject login request { ip : "${ip.getClientIp(req)}", id : "${req.body.id}", pw : "${req.body.pw}" }`);
        ret.result = false;
        res.json(ret);
    }
})

app.post('/salt', (req, res) => {
    let ret = {};

    let temp = account.getAccountObj(req.body.id);

    if (temp !== undefined) {
        ret.result = true;
        ret.salt = temp.salt;
        res.json(ret);
    } else {
        ret.result = false;
        res.json(ret);
    }
})

app.post('/disk', (req, res) => {
    let ret = {};

    if (session.checkSession2(req.body.id, req.body.key).result) {
        ret.disk = disk.getSpaceInfo();
        ret.result = true;
        session.createSession(req.body.id).then(function(data){
            ret.session = data;
            res.json(ret);
        })
    } else {
        ret.result = false;
        res.json(ret);
    }
})

app.post('/dir', (req, res) => {
    let ret = {};

    if (session.checkSession2(req.body.id, req.body.key).result) {
        ret.dir = disk.getFileList(req.body.dir);
        ret.result = true;
        session.createSession(req.body.id).then(function(data){
            ret.session = data;
            res.json(ret);
        })
    } else {
        ret.result = false;
        res.json(ret);
    }
})

app.post('/checksession', (req, res) => {
    let ret = {};
    let check = session.checkSession(req.body.key);
    if (check.result) {
        ret.id = check.id;
        ret.result = true;
        session.createSession(ret.id).then(function(data){
            ret.session = data;
            res.json(ret);
        })
    } else {
        ret.result = false;
        res.json(ret);
    }
})

app.post('/rename', (req, res) => {
    let ret = {};
    
    if (session.checkSession2(req.body.id, req.body.key).result) {
        ret.rename = disk.rename(req.body.dir, req.body.currname, req.body.newname);
        ret.result = true;
        log.log("INFO", "app.js", `1 file has been renamed { ip : "${ip.getClientIp(req)}", id : "${req.body.id}", dir : "${req.body.dir}", from : "${req.body.currname}", to : "${req.body.newname}" }`);
        session.createSession(req.body.id).then(function(data){
            ret.session = data;
            res.json(ret);
        })
    } else {
        log.log("WARN", "app.js", `Reject rename request { ip : "${ip.getClientIp(req)}", id : "${req.body.id}", dir : "${req.body.dir}", from : "${req.body.currname}", to : "${req.body.newname}" }`);
        ret.result = false;
        res.json(ret);
    }
})

app.post('/remove', (req, res) => {
    let ret = {};
    
    if (session.checkSession2(req.body.id, req.body.key).result) {
        ret.remove = disk.remove(req.body.dir, req.body.target);
        ret.result = true;
        log.log("INFO", "app.js", `1 file removed { ip : "${ip.getClientIp(req)}", id : "${req.body.id}", dir : "${req.body.dir}", name : "${req.body.target}" }`);
        session.createSession(req.body.id).then(function(data){
            ret.session = data;
            res.json(ret);
        })
    } else {
        log.log("WARN", "app.js", `Reject remove request { ip : "${ip.getClientIp(req)}", id : "${req.body.id}", dir : "${req.body.dir}", name : "${req.body.target}" }`);
        ret.result = false;
        res.json(ret);
    }
})

app.post('/removemultiple', (req, res) => {
    let ret = {};
    
    if (session.checkSession2(req.body.id, req.body.key).result) {
        ret.remove = disk.removemultiple(req.body.dir, req.body.target);
        ret.result = true;

        let msg = `${req.body.target.length} files removed { ip : "${ip.getClientIp(req)}", id : "${req.body.id}", dir : "${req.body.dir}", name : [ `;

        for(let i = 0; i < req.body.target.length; i++){
            if (i !== 0) msg += `, `;
    
            msg += `"${req.body.target[i]}"`;
        }
        msg += ` ] }`;

        log.log("INFO", "app.js", msg);
        
        session.createSession(req.body.id).then(function(data){
            ret.session = data;
            res.json(ret);
        })
    } else {
        let msg = `Reject remove request { ip : "${ip.getClientIp(req)}", id : "${req.body.id}", dir : "${req.body.dir}", name : [ `;

        for(let i = 0; i < req.body.target.length; i++){
            if (i !== 0) msg += `, `;
    
            msg += `"${req.body.target[i]}"`;
        }
        msg += ` ], count : ${req.body.target.length} }`;

        log.log("WARN", "app.js", msg);

        ret.result = false;
        res.json(ret);
    }
})

app.post('/changedir', (req, res) => {
    let ret = {};
    
    if (session.checkSession2(req.body.id, req.body.key).result) {
        ret.changedir = disk.changedir(req.body.origindir, req.body.newdir);
        ret.result = true;
        log.log("INFO", "app.js", `1 file moved { ip : "${ip.getClientIp(req)}", id : "${req.body.id}", from : "${req.body.origindir}", to : "${req.body.newdir}" }`);
        session.createSession(req.body.id).then(function(data){
            ret.session = data;
            res.json(ret);
        })
    } else {
        log.log("WARN", "app.js", `Reject change directory request { ip : "${ip.getClientIp(req)}", id : "${req.body.id}", from : "${req.body.origindir}", to : "${req.body.newdir}" }`);
        ret.result = false;
        res.json(ret);
    }
})

app.post('/createfolder', (req, res) => {
    let ret = {};
    
    if (session.checkSession2(req.body.id, req.body.key).result) {
        ret.createfolder = disk.createfolder(req.body.dir, req.body.name);
        ret.result = true;
        log.log("INFO", "app.js", `New folder created { ip : "${ip.getClientIp(req)}", id : "${req.body.id}", dir : "${req.body.dir}", name : "${req.body.name}" }`);
        session.createSession(req.body.id).then(function(data){
            ret.session = data;
            res.json(ret);
        })
    } else {
        log.log("WARN", "app.js", `Reject create folder request { ip : "${ip.getClientIp(req)}", id : "${req.body.id}", dir : "${req.body.dir}", name : "${req.body.name}" }`);
        ret.result = false;
        res.json(ret);
    }
})

app.post('/download', (req, res) => {
    let ret = {};
    
    if (session.checkSession2(req.body.id, req.body.key).result) {
        ret.result = true;
        session.createSession(req.body.id).then(function(data){
            ret.session = data;
            session.createDownloadSession(req.body.dir, req.body.name).then(function(data2){
                ret.downloadSession = data2;
                res.json(ret);
            })
        })
    } else {
        ret.result = false;
        res.json(ret);
    }
})

app.get('/download', (req, res) => {

    let check = session.checkDownloadSession(req.query.file);

    if (check.result) {
        let getfile = download.getfile(check.obj.dir, check.obj.name);

        if (getfile.error) return;
        else {
            log.log("INFO", "app.js", `Approve download request { ip : "${ip.getClientIp(req)}", downloadSession : "${req.query.file}" }`);
            res.download(getfile.target, check.obj.name);
        }
    } else {
        log.log("WARN", "app.js", `Reject download request { ip : "${ip.getClientIp(req)}", downloadSession : "${req.query.file}" }`);
    }

})

app.post('/share', (req, res) => {
    let ret = {};
    
    if (session.checkSession2(req.body.id, req.body.key).result) {
        ret.result = true;
        session.createSession(req.body.id).then(function(data){
            ret.session = data;

            if (req.body.dir.charAt(req.body.dir.length - 1) !== '/') req.body.dir += '/';

            share.add(req.body.dir, req.body.name).then(function(data2){
                ret.share = data2;
                res.json(ret);
            })
        })
    } else {
        ret.result = false;
        res.json(ret);
    }
})

app.get('/share', (req, res) => {
    let check = share.getFileByLink(req.query.file);

    if (check === undefined) {
        res.sendFile(__dirname + '/shareError.html');
    } else {
        res.download(upath + check, check.substr(check.lastIndexOf('/')));
    }
})

https.createServer(option, app).listen(port, () => {
    log.log("INFO", "app.js", "Server start on port " + port);
});