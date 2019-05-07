const express = require('express');
const jwt = require('jsonwebtoken');

const { JWT_SECRET } = process.env;

const { getUserByToken, getToken } = require('../twitch');
const db = require('../db');
const User = db.model('User');

const app = express.Router();

app.get('/', (req, res) => {
	res.json({ hi: 'hello' });
});

app.use('/oauth/twitch', require('./oauth-twitch'));

async function verifyJWTHeader(req, res, next) {
	req.jwtToken = await new Promise((resolve, reject) => {
		jwt.verify(req.get('authorization'), JWT_SECRET, {}, (err, decoded) => {
			err ? reject(err) : resolve(decoded);
		});
	});
	next();
}

app.get(
	'/twitch/user',
	verifyJWTHeader,
	async (req, res) => {
		let tokenData = await getToken(req.jwtToken.id);
		if(!tokenData) {
			throw new Error('Unauthorized');
		}
		const { body } = await getUserByToken(tokenData.access_token);
		res.json({ user: body.data[0] });
	},
	(err, req, res, next) => res.unauthorized()
);

app.use((err, req, res, next) => {
	console.error(err);
	res.error();
});

module.exports = app;