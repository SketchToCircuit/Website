const fs = require('fs');
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
}


module.exports = {
    init
}