const mongoose = require('mongoose');

const { Schema } = mongoose;
const { Types } = Schema;

const userSchema = new Schema({
	twitchID: {
		index: {
			unique: true
		},
		required: true,
		type: String
	},
	connections: {
		twitch: {
			type: String
		}
	},
	updated: {
		type: Date,
		default: Date.now
	}
});

const User = mongoose.model('User', userSchema);

mongoose.connect('mongodb://localhost/', {
	user: process.env.MONGO_USER,
	pass: process.env.MONGO_PASS,
	dbName: process.env.MONGO_DB,
	useNewUrlParser: true,
	useCreateIndex: true,
	useFindAndModify: true
});

const { connection: db } = mongoose;

db.on('connected', async () => {
	try {
		await Promise.all([
			User.init()
		]);
		console.log('Done initialized schemas');
	} catch(err) {
		console.error(err);
	}
});

db.on('disconnected', () => {
	console.log('Database disconnected');
});

db.on('error', err => {
	console.error(err);
});

module.exports = db;