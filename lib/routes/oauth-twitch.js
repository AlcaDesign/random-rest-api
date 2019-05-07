const express = require('express');
const jwt = require('jsonwebtoken');

const {
	JWT_SECRET,
	TWITCH_CLIENT_ID,
	TWITCH_REDIRECT_URI,
	TWITCH_SCOPES
} = process.env;

const db = require('../db');
const {
	codeToToken, getUserByToken, /* getTokenFromDBID, */ setTokenFromDBID
} = require('../twitch');

const User = db.model('User');

const app = express.Router();

const authURL = 'https://id.twitch.tv/oauth2/authorize?' +
	new URLSearchParams({
		client_id: TWITCH_CLIENT_ID,
		redirect_uri: TWITCH_REDIRECT_URI,
		response_type: 'code',
		scope: TWITCH_SCOPES
	});

app.get('/', async (req, res) => {
	const state = await new Promise((resolve, reject) => {
		const payload = {};
		const options = { expiresIn: '20m' };
		jwt.sign(payload, JWT_SECRET, options, (err, encoded) => {
			err ? reject(err) : resolve(encoded);
		});
	});
	res.redirect(authURL + '&state=' + state);
});

app.get('/callback', async (req, res) => {
	const home = () => res.redirect('/');
	const { code, scope, state } = req.query;
	if(!code || !state) {
		console.log({ code, state });
		return home();
	}
	let decoded;
	try {
		decoded = await new Promise((resolve, reject) => {
			const options = {};
			jwt.verify(state, JWT_SECRET, options, (err, decoded) => {
				err ? reject(err) : resolve(decoded);
			});
		});
	} catch(err) {
		return home();
	}
	const tokenData = await codeToToken(code);
	// access_token
	// expires_in
	// refresh_token
	if(tokenData.status && tokenData.status !== 200) {
		return home();
	}
	tokenData.expires = Date.now() + tokenData.expires_in * 0.9 * 1000;
	const {
		body: { data: [ twitchUser ] = [] }
	} = await getUserByToken(tokenData.access_token);
	if(!twitchUser) {
		return home();
	}
	let dbUser = await User.findOne({ twitchID: twitchUser.id });
	if(!dbUser) {
		dbUser = await User.create({
			twitchID: twitchUser.id,
			connections: {
				twitch: tokenData.refresh_token
			}
		});
	}
	else if(dbUser.connections.twitch !== tokenData.refresh_token) {
		await dbUser.updateOne({
			connections: {
				twitch: tokenData.refresh_token
			}
		});
	}
	setTokenFromDBID(dbUser._id, tokenData);
	const token = await new Promise((resolve, reject) => {
		const payload = {
			id: dbUser._id
			// token: tokenData.access_token
		};
		// const options = { expiresIn: tokenData.expires_in };
		const options = { expiresIn: '14d' };
		jwt.sign(payload, JWT_SECRET, options, (err, encoded) => {
			err ? reject(err) : resolve(encoded);
		});
	});
	res.redirect('/#token=' + token);
});

app.use((err, req, res, next) => {
	console.error(err);
	res.error();
});

module.exports = app;