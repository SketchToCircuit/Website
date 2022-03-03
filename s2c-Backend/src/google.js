const { OAuth2Client } = require('google-auth-library');
const { env } = require('process');

const o2Client = new OAuth2Client(env.O2ID);//Create oauth client

async function verifyGoogleToken(token) { //Using the oauth client verify provided token and get userdata
    const ticket = await o2Client.verifyIdToken({
        idToken: token,
        audience: env.O2ID
    });
    const payload = ticket.getPayload();
    return payload;
}

module.exports = {
    verifyGoogleToken
}