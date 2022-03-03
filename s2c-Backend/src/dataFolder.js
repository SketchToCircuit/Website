const fs = require('fs');
const path = require('path');
const {env} = require('process');

function init()//Initalize folders and files
{
    if(!fs.existsSync(env.SAVEFOLDER))
    {
        fs.mkdirSync(env.SAVEFOLDER);
    }
    if(!fs.existsSync(env.HINTFOLDER))
    {
        fs.mkdirSync(env.HINTFOLDER);
    }
    if(!fs.existsSync(env.LOGLOC));
    {
        fs.closeSync(fs.openSync(env.LOGLOC, 'w'))
    }

    let files = fs.readdirSync(env.HINTFOLDER);
    if(files)//If folder exists delete all files
    {
        files.forEach(file => {
            let absPAth = path.join(env.HINTFOLDER, file)
            fs.unlinkSync(absPAth);
        })
    }

    let copyPath = "/code/data/hints";
    files = fs.readdirSync(copyPath)
    if(files)//Copy files into hint folder
    {
        files.forEach(file => {
            let absPath = path.join(copyPath, file);
            let newPath = path.join(env.HINTFOLDER, file);
            fs.copyFileSync(absPath, newPath);
        });
    }
}

function writeErrorLog(data, level)//Write errors into log
{
    fs.appendFile(env.LOGLOC, '\n' + `[${level}]` + data, (e) => {});
}

module.exports = {
    init,
    writeErrorLog
}