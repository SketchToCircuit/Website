const { env } = require('process');
const mysql = require('mysql');
const waitPort = require('wait-port');

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
    });
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
function getValidationData(base64Helper ,callback) {
    // order by random number to select random image
    // (RAND() + 1) * ( ) -> already validated images will always have a higher "sorting number" -> only taken if no others are left
    let query = "SELECT * FROM images, component_types WHERE component_type = component_id ORDER BY ((RAND() + 1) * (looked_at + 1)) LIMIT 1;";
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

function getDrawData(base64Helper,callback) {
    let query = "SELECT * FROM component_types ORDER BY RAND() LIMIT 1;";
    database.query(query, (err, result) => {
        if (err) {
            console.log(err);
        } else if (result.length >= 1) {
            async function combineData(r) {
                let drawData = new Object();
                drawData.type = r.file_prefix;
                drawData.componentText = r.draw_hint;
                drawData.componentImg = await base64Helper.getBase64Img(r.component_hint_img);
                drawData.labelText = "Bitte zeichnen Sie die Beschriftung für dieses Bauteil!";
                drawData.labelImg = await base64Helper.getBase64Img(r.labeled_hint_img);
                return drawData;
            }

            combineData(result[0]).then((drawData) => {
                callback(drawData);
            });
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
    storeImage
}