const mongoose = require('mongoose');
const rp = require('request-promise-native').defaults({
	simple: false,
	resolveWithFullResponse: true
});

const db = require('./db');
const User = db.model('User');

const accessTokenCache = [];

const {
	TWITCH_CLIENT_ID,
	TWITCH_CLIENT_SECRET,
	TWITCH_REDIRECT_URI
} = process.env;

const idAPI = rp.defaults({
	url: 'https://id.twitch.tv/oauth2/token',
	method: 'post',
	qs: {
		client_id: TWITCH_CLIENT_ID,
		client_secret: TWITCH_CLIENT_SECRET
	},
	json: true
});

const helix = rp.defaults({
	baseUrl: 'https://api.twitch.tv/helix/',
	headers: {
		'Client-ID': TWITCH_CLIENT_ID
	},
	json: true
});

function getTokenFromDBID(id) {
	if(!mongoose.Types.ObjectId.isValid(id)) {
		console.error('Invalid ID');
		return null;
	}
	if(typeof id === 'string') {
		id = mongoose.Types.ObjectId.createFromHexString(id);
	}
	const now = Date.now();
	const index = accessTokenCache.findIndex(n => id.equals(n.id));
	const token = accessTokenCache[index];
	if(!token) {
		return null;
	}
	else if(token.expires <= now) {
		accessTokenCache.splice(index, 1);
		token.expired = true;
		return token;
	}
	return token;
}

function setTokenFromDBID(id, token) {
	const existingToken = getTokenFromDBID(id);
	if(existingToken) {
		Object.assign(existingToken, token);
	}
	else {
		token.id = id;
		accessTokenCache.push(token);
	}
}

async function getToken(id) {
	const existingToken = getTokenFromDBID(id);
	if(existingToken && !existingToken.expired) {
		return existingToken;
	}
	const dbUser = await User.findById(id);
	if(!dbUser || !dbUser.connections.twitch) {
		return null;
	}
	const tokenData = await refreshToken(dbUser.connections.twitch);
	if(tokenData.status && tokenData.status !== 200) {
		return null;
	}
	if(dbUser.connections.twitch !== tokenData.refresh_token) {
		await dbUser.updateOne({
			connections: {
				twitch: tokenData.refresh_token
			}
		});
	}
	tokenData.expires = Date.now() + tokenData.expires_in * 0.9 * 1000;
	setTokenFromDBID(id, tokenData);
	return tokenData;
}

async function codeToToken(code) {
	const res = await idAPI({
		qs: {
			redirect_uri: TWITCH_REDIRECT_URI,
			grant_type: 'authorization_code',
			code
		}
	});
	// TODO:
	if(res.statusCode !== 200) {
		console.error({ 
			function: 'codeToToken',
			statusCode: res.statusCode,
			body: res.body
		});
	}
	return res.body;
}

async function refreshToken(refresh_token) {
	const res = await idAPI({
		qs: {
			grant_type: 'refresh_token',
			refresh_token
		}
	});
	// TODO:
	if(res.statusCode !== 200) {
		console.error({
			function: 'refreshToken',
			statusCode: res.statusCode,
			body: res.body
		});
	}
	return res.body;
}

function getUserByToken(bearer) {
	return helix({
		url: 'users',
		auth: { bearer }
	});
}

module.exports = {
	accessTokenCache,
	setTokenFromDBID,
	getTokenFromDBID,

	getToken,

	codeToToken,
	refreshToken,

	getUserByToken
};