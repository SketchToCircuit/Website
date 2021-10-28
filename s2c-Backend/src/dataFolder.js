const fs = require('fs');
const path = require('path');
const {env} = require('process');

function init()
{
    if(!fs.existsSync(env.SAVEFOLDER))
    {
        fs.mkdirSync(env.SAVEFOLDER);
    }
    if(!fs.existsSync(env.HINTFOLDER))
    {
        fs.mkdirSync(env.HINTFOLDER);
    }

    let files = fs.readdirSync(env.HINTFOLDER);
    if(files)
    {
        files.forEach(file => {
            let absPAth = path.join(env.HINTFOLDER, file)
            fs.unlinkSync(absPAth);
        })
    }

    let copyPath = "/code/data/hints";
    files = fs.readdirSync(copyPath)
    if(files)
    {
        files.forEach(file => {
            let absPath = path.join(copyPath, file);
            let newPath = path.join(env.HINTFOLDER, file);
            fs.copyFileSync(absPath, newPath);
        });
    }
}


module.exports = {
    init
}