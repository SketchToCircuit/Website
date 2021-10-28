const { env } = require('process');
const mysql = require('mysql');
const waitPort = require('wait-port');
const fs = require('fs');

var database;

async function init() {
    let host = env.MYSQL_HOST;
    await waitPort({host, port : 3306});
    database = mysql.createConnection({
        connectionLimit: 5,
        host: env.MYSQL_HOST,
        user: env.MYSQL_USER,
        password: env.MYSQL_PASSWORD,
        database: env.MYSQL_DB
    });

    database.connect(function(err) {
        if (err) {
            console.log("DB-Error: " + err);
            return;
        }
        console.log("Connected to database!");
        loadData();
    });
}

async function loadData()
{
    let deleteQuery = "DELETE FROM component_types"
    let data = JSON.parse(fs.readFileSync(env.COMPONENTCFG));
    database.query(deleteQuery, (err, result) => {
        if (err) {
            console.log(err);
        }
    });
    let query = "INSERT INTO component_types(component_id, file_prefix, draw_hint, val_hint, component_hint_img, labeled_hint_img) VALUES(?,?,?,?,?,?);";
    for(var prop in data)
    {
        database.query(query, [data[prop].component_id, data[prop].file_prefix, data[prop].draw_hint, data[prop].val_hint, data[prop].component_hint_img, data[prop].labeled_hint_img], (err, result) => {
            if (err) {
                console.log(err);
            }
        });
        //console.log(data[prop].component_id);
    }
}

// add googleId to database
function AddUser(googleId) {
    let query = "SELECT * FROM google_user WHERE google_id = ?;";
    database.query(query, [googleId], (err, result) => {
        if (err) {
            console.log(err);
        }

        if (!err && result && !result.length) {
            query = "INSERT INTO google_user(google_id, untrusted) VALUES(?, FALSE);";
            database.query(query, [googleId], (err, result) => {
                if (err) {
                    console.log(err);
                }
            })
        }
    });
}

// get data for validation from database and filesystem
function getValidationData(base64Helper, googleId, callback) {
    // order by random number to select random image
    let query = "SELECT * FROM images, component_types WHERE component_type = component_id AND NOT looked_at AND drawer_id != ? ORDER BY RAND() LIMIT 1;";
    query = mysql.format(query, googleId);
    database.query(query, (err, result) => {
        if (err) {
            console.log(err);
        } else if (result.length >= 1) {
            async function combineData(r) {
                let valData = new Object();
                valData.hintText = r.val_hint;
                valData.hintImg = await base64Helper.getBase64Img(r.labeled_hint_img);
                valData.valImg = await base64Helper.getCombinedBase64Img(r.component_path, r.label_path);
                valData.imgId = r.image_id;
                return valData;
            }

            combineData(result[0]).then((valData) => {
                callback(valData);
            });
        }
    });
}

function getDrawData(lastDrawId, base64Helper, callback) {
    // prefer types with fewer drawn images
    let query = "SELECT * FROM component_types WHERE component_id != ? ORDER BY (RAND() * (1+(SELECT COUNT(*) FROM images WHERE component_type = component_id))) DESC LIMIT 1;";
    database.query(query, [lastDrawId], (err, result) => {
        if (err) {
            console.log(err);
        } else if (result.length >= 1) {
            async function combineData(r) {
                let drawData = new Object();
                drawData.type = r.file_prefix;
                drawData.id = r.component_id;
                drawData.componentText = r.draw_hint;
                drawData.componentImg = await base64Helper.getBase64Img(r.component_hint_img);
                drawData.labelText = "Please label the component somewhere";
                drawData.labelImg = await base64Helper.getBase64Img(r.labeled_hint_img);
                return drawData;
            }

            combineData(result[0]).then((drawData) => {
                callback(drawData);
            });
        }
    });
}

function decideDrawValFromDB(googleId, onDraw, onValidate) {
    let query = "SELECT COUNT(*) AS num FROM images WHERE NOT looked_at AND drawer_id != ?;"
    query = mysql.format(query, googleId);
    database.query(query, (err, result) => {
        if (err) {
            console.log(err);
            onDraw();
        } else {
            let drawProb;
            // at least 5 pictures have to be available for 
            if (result[0].num < 5) {
                onDraw();
            } else {
                // 5 images to validate: 90% chance to draw
                const fewImgDrawProb = 0.9;
                // more than 20 imges to validate: 30% chance to draw
                const lotImgDrawProb = 0.3;

                let normalizedNum = Math.min(Math.max((result[0].num - 5) / 15.0, 0.0), 1.0);
                drawProb = normalizedNum * (lotImgDrawProb - fewImgDrawProb) + fewImgDrawProb;

                if (Math.random() < drawProb) {
                    onDraw();
                } else {
                    onValidate();
                }
            }
        }
    });
}

function setValidated(imgId, validated, googleId) {
    let query = "UPDATE images SET validated = ?, validator_id = ?, looked_at = TRUE WHERE image_id = ?;";

    database.query(query, [validated, googleId, imgId], (err, result) => {
        if (err) {
            console.log(err);
        }
    });
}

function checkType(type, callback)
{
    let query = mysql.format("SELECT * FROM component_types WHERE file_prefix = ?", type);
    database.query(query,(err, result) => {
        if (err) {
            console.log(err);
        } else if (result.length >= 1) {
            callback();
        }
    });
}

function storeImage(component_path, label_path, drawer_id, component_type)
{
    let query = mysql.format("insert into images(component_path, label_path, drawer_id, component_type) values(?, ?, ?, (select component_id from component_types where file_prefix = ? limit 1));", [component_path, label_path, drawer_id, component_type]);
    database.query(query,(err, result) => {
        if(err) {console.log(err)};
    });
}

module.exports = {
    init,
    AddUser,
    getValidationData,
    getDrawData,
    setValidated,
    checkType,
    storeImage,
    decideDrawValFromDB
}