const { env } = require('process');
const mysql = require('mysql');
const waitPort = require('wait-port');
const fs = require('fs');

var database;

async function init() {//Init database connection
    let host = env.MYSQL_HOST;
    await waitPort({host, port : 3306});//Wait until database server is running
    database = mysql.createConnection({//Define connection to database
        connectionLimit: 5,
        host: env.MYSQL_HOST,
        user: env.MYSQL_USER,
        password: env.MYSQL_PASSWORD,
        database: env.MYSQL_DB
    });

    database.connect(function(err) {//Connect to database
        if (err) {
            console.log("DB-Error: " + err);
            return;
        }
        console.log("Connected to database!");
        loadData();
    });
}

async function loadData()//Delete old component config and load the new one into the database
{
    let deleteQuery = "DELETE FROM component_types"
    let data = JSON.parse(fs.readFileSync(env.COMPONENTCFG));//Read component config from disk
    database.query(deleteQuery, (err, result) => {//Delete old config from database
        if (err) {
            console.error(err);
        }
    });
    let query = "INSERT INTO component_types(component_id, file_prefix, draw_hint, val_hint, component_hint_img, labeled_hint_img) VALUES(?,?,?,?,?,?);";
    for(var prop in data)//Insert components into database
    {
        database.query(query, [data[prop].component_id, data[prop].file_prefix, data[prop].draw_hint, data[prop].val_hint, data[prop].component_hint_img, data[prop].labeled_hint_img], (err, result) => {
            if (err) {
                console.error(err);
            }
        });
    }
}

function AddUser(googleId, username, email) {//Add new user to database
    function setEmail() {//Check if user email is empty and update it
        let query = "UPDATE google_user SET email = ? WHERE google_id = ? AND email is NULL;";
        query = mysql.format(query, [email, googleId]);
        database.query(query, (err, result) => {
            if (err) {
                console.error(err);
            }
        });
    }

    let query = "SELECT * FROM google_user WHERE google_id = ?;";
    query = mysql.format(query, googleId);
    database.query(query, (err, result) => {//Check if user exists
        if (err) {
            console.error(err);
        }

        if (!err && result && !result.length) {//If user does not exist add him to database else update email
            query = "INSERT INTO google_user(google_id, username, score, untrusted) VALUES(?,?,0,FALSE);";
            query = mysql.format(query, [googleId, username, email])
            database.query(query, (err, result) => {
                if (err) {
                    console.error(err);
                } else {
                    setEmail();
                }
            })
        } else {
            setEmail();
        }
    });
}

function getUserScore(googleId, callback)//Get userscore and leaderboard and returns in callback
{
    let query = "SELECT score FROM google_user WHERE google_id = ?";
    query = mysql.format(query, googleId);
    database.query(query, (err, result) => {
        if (err) {
            console.error(err);
        } else if (result.length >= 1) {
            getScoreBoard(result[0].score,callback);//Get leaderboard
        }
    });
}

function getScoreBoard(userScore, callback)//Get scoreboard from database and returns in callback
{
    let query = "SELECT score, username FROM google_user ORDER BY score DESC LIMIT ?";
    query = mysql.format(query, parseInt(env.NUM_SCORES, 10))
    database.query(query, (err, result) => {
        if (err) {
            console.error(err);
        } else if (result.length >= 1) {         
            callback(userScore, result);
        }
    });
}

function addUserScore(googleId, amount)//Add to userscore in database from google id
{
    let query = "UPDATE google_user SET score = score + ? WHERE google_id = ?";
    query = mysql.format(query, [amount, googleId]);
    database.query(query, (err, result) => {
        if (err) {
            console.error(err);
        }
    });
}

function addUserScoreFromImgId(imgId, amount)//Add to userscore in database using imageId
{
    let query = "SELECT drawer_id FROM images WHERE image_id = ?";
    query = mysql.format(query, imgId);
    database.query(query, (err, result) => {
        if (err) {
            console.error(err);
        }else if (result.length >= 1) {
            addUserScore(result[0].drawer_id, amount)
        }
    });
}

function getValidationData(base64Helper, googleId, callback) {//Get data for validation from database and filesystem
    //Order by random number to select random image
    //Prefer images with lower "looked_at"
    let query = "SELECT * FROM images, component_types WHERE component_type = component_id AND looked_at < ? AND drawer_id != ? ORDER BY (RAND() * 0.1 + looked_at) LIMIT 1;";
    query = mysql.format(query, [env.MAX_VALIDATION_RUNS, googleId]);
    database.query(query, (err, result) => {
        if (err) {
            console.error(err);
        } else if (result.length >= 1) {
            async function combineData(r) {
                let valData = new Object();
                valData.hintText = r.val_hint;
                [valData.hintImg, valData.valImg] = await Promise.all([base64Helper.getBase64Img(r.labeled_hint_img), base64Helper.getCombinedBase64Img(r.component_path, r.label_path)]);
                valData.imgId = r.image_id;
                return valData;
            }

            combineData(result[0]).then((valData) => {
                callback(valData);
            });
        }
    });
}

function getDrawData(lastDrawId, base64Helper, callback) {//Get imagedata from database
    //prefer types with fewer drawn images
    let query = "SELECT * FROM component_types WHERE component_id != ? ORDER BY (RAND() * (1 + (SELECT COUNT(*) FROM images WHERE component_type = component_id))) ASC LIMIT 1;";
    database.query(query, [lastDrawId], (err, result) => {
        if (err) {
            console.error(err);
        } else if (result.length >= 1) {
            async function combineData(r) {
                let drawData = new Object();
                drawData.type = r.file_prefix;
                drawData.id = r.component_id;
                drawData.componentText = r.draw_hint;
                drawData.labelText = "Please label the component somewhere";
                [drawData.componentImg, drawData.labelImg] = await Promise.all([base64Helper.getBase64Img(r.component_hint_img), base64Helper.getBase64Img(r.labeled_hint_img)]);
                return drawData;
            }

            combineData(result[0]).then((drawData) => {
                callback(drawData);
            });
        }
    });
}

function decideDrawValFromDB(googleId, onDraw, onValidate) {//Decides if user has to draw or validate
    let query = "SELECT COUNT(*) AS num FROM images WHERE looked_at < ? AND drawer_id != ?;"
    query = mysql.format(query, [env.MAX_VALIDATION_RUNS, googleId]);
    database.query(query, (err, result) => {
        if (err) {
            console.error(err);
            onDraw();
        } else {
            let drawProb;
            if (result[0].num < env.VALIDATING_COUNT) {//A certain amount of drawings have to be unvalidated
                onDraw();
            } else {
                const fewImgDrawProb = 0.9;//5 images to validate: 90% chance to draw
                const lotImgDrawProb = 0.2;//More than 50 imges to validate: 50% chance to draw

                let normalizedNum = Math.min(Math.max((result[0].num - 5) / 45.0, 0.0), 1.0);
                drawProb = normalizedNum * (lotImgDrawProb - fewImgDrawProb) + fewImgDrawProb;//Get chance that user as to draw

                if (Math.random() < drawProb) {
                    onDraw();
                } else {
                    onValidate();
                }
            }
        }
    });
}

function setValidated(imgId, validated, googleId) {//Set image as validated
    let query = "UPDATE images SET validated = validated + ?, validator_id = ?, looked_at = looked_at + 1 WHERE image_id = ?;";

    database.query(query, [validated ? 1 : 0, googleId, imgId], (err, result) => {
        if (err) {
            console.error(err);
        }
    });
}

function checkType(type, callback)//Check if component type exists
{
    let query = mysql.format("SELECT * FROM component_types WHERE file_prefix = ?", type);
    database.query(query,(err, result) => {
        if (err) {
            console.error(err);
        } else if (result.length >= 1) {
            callback();
        }
    });
}

function checkUser(google_id, callback) {//Check if user is untrusted
    let query = mysql.format("SELECT COUNT(*) AS num FROM google_user where google_id=? AND untrusted;", google_id);
    database.query(query,(err, result) => {
        if (err) {
            console.error(err);
        } else if (result[0].num === 0) {
            callback();
        } else {
            console.log(`User ${google_id} is untrusted.`);
        }
    });
}

function storeImage(component_path, label_path, drawer_id, component_type)//Insert new image into database
{
    let query = mysql.format("insert into images(component_path, label_path, drawer_id, component_type) values(?, ?, ?, (select component_id from component_types where file_prefix = ? limit 1));", [component_path, label_path, drawer_id, component_type]);
    database.query(query,(err, result) => {
        if(err) {console.error(err)};
    });
}

module.exports = {
    init,
    AddUser,
    getUserScore,
    getScoreBoard,
    addUserScore,
    addUserScoreFromImgId,
    getValidationData,
    getDrawData,
    setValidated,
    checkType,
    storeImage,
    decideDrawValFromDB,
    checkUser
}