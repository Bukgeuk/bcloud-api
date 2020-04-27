const fs = require('fs-extra'); 

exports.log = (type, file, text) => {
    let temp = new Date();
    let date = temp.toISOString().split('T')[0]
    let time = temp.toString().split(' ')[4]

    if(text[text.length - 1] === '\n') text = text.substr(0, text.length - 1)

    let msg = `[${time}] [${file}/${type}] ${text.replace(/\n/g, '\\n')}\n`;
    console.log(msg);

    fs.open('./Log/' + date + '.log', 'a+', function(err, fd){
        if (err) throw error

        let buf = Buffer.from(msg);
        fs.write(fd, buf, 0, buf.length, null, function(err, written, buffer){
            if(err) throw err;

            fs.close(fd, function(){})
        })
    })
}