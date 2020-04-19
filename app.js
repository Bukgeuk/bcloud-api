// import modules
const express = require('express');
const path = require('path');
const fs = require('fs-extra');
const bodyParser = require('body-parser');
const crypto = require('crypto');
const cors = require('cors');
const multer = require('multer');
const formidable = require('formidable');

// import custom modules
const disk = require('./func/disk');
const account = require('./account');
const session = require('./func/session');
const download = require('./func/download');

const app = express();
const port = 3000;
const upath = '/media/pi/Cloud';

let upload = multer({
    fileFilter: function (req, res, cb) {
        const form = new formidable.IncomingForm();
        form.parse(req, (err, fields, files) => {
            if (!session.checkSession2(req.body.id, req.body.key).result) {
                req.detectError = true;
                cb(null, false);
            } else cb(null, true);
        });
    },
    storage: multer.diskStorage({
        destination : function (req, file, cb) {
            cb(null, upath + req.body.dir);
        },
        filename : function (req, file, cb) {
            let flag = false;
            let i = 0;
            const rname = file.originalname.substr(0, file.originalname.length - req.body.ext.length);
            let name2 = rname + req.body.ext;
            while (!flag) {
                if (!fs.existsSync(upath + req.body.dir + name2)){
                    if(i === 0) cb(null, file.originalname);
                    else cb(null, `${rname} (${i})${req.body.ext}`);
                    flag = true;
                } else {
                    i++;
                    name2 = `${rname} (${i})${req.body.ext}`;
                }
            }
            
        }
    })
})

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended:true}));
app.use(cors());

app.post('/uploadsingle', upload.single('file'), (req, res) => {
    let ret = {};
    
    if(req.detectError){
        ret.result = false;
        res.json(ret);
        return;
    }

    session.createSession(req.body.id).then(function(data){
        ret.result = true;
        ret.session = data;
        res.json(ret);
    })
})

app.post('/uploadmultiple', upload.array('files'), (req, res) => {
    let ret = {};
    
    if(req.detectError){
        ret.result = false;
        res.json(ret);
        return;
    }

    session.createSession(req.body.id).then(function(data){
        ret.result = true;
        ret.session = data;
        res.json(ret);
    })
})

app.post('/login', (req, res) => {
    let ret = {};

    if(account.checkLogin(req.body.id, req.body.pw)) {
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
        session.createSession(req.body.id).then(function(data){
            ret.session = data;
            res.json(ret);
        })
    } else {
        ret.result = false;
        res.json(ret);
    }
})

app.post('/remove', (req, res) => {
    let ret = {};
    
    if (session.checkSession2(req.body.id, req.body.key).result) {
        ret.remove = disk.remove(req.body.dir, req.body.target);
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

app.post('/changedir', (req, res) => {
    let ret = {};
    
    if (session.checkSession2(req.body.id, req.body.key).result) {
        ret.changedir = disk.changedir(req.body.origindir, req.body.newdir);
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

app.post('/createfolder', (req, res) => {
    let ret = {};
    
    if (session.checkSession2(req.body.id, req.body.key).result) {
        ret.createfolder = disk.createfolder(req.body.dir, req.body.name);
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
        else res.download(getfile.target, check.obj.name);
    }

})

app.listen(port, function() {
    console.log("Server Start on port " + port);
});