const { OAuth2Client } = require('google-auth-library');
const { env } = require('process');

const o2Client = new OAuth2Client(env.O2ID);

async function verifyGoogleToken(token) { //Google verify token
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