// import modules
const express = require('express');
const path = require('path');
const fs = require('fs');
const bodyParser = require('body-parser');
const crypto = require('crypto');
const cors = require('cors');

// import custom modules
const disk = require('./func/disk');
const account = require('./account');
const session = require('./func/session')

const app = express();
const port = 3000;

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended:true}));
app.use(cors());

app.listen(port, function() {
    console.log("Server Start on port " + port);
});

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