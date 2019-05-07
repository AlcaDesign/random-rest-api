require('dotenv').config();
const express = require('express');

const app = express();
const server = app.listen(process.env.HTTP_PORT, () => {
	console.log('Listening at :' + server.address().port);
});

app.response.notFound = function(message = '') {
	this.status(404).json({ error: 'Not Found', status: 404, message });
};

app.response.badRequest = function(message = '') {
	this.status(400).json({ error: 'Bad Request', status: 400, message });
};

app.response.unauthorized = function(message = '') {
	this.status(401).json({ error: 'Unauthorized', status: 401, message });
};

app.response.error = function(message = '') {
	this.status(500)
		.json({ error: 'Internal Server Error', status: 500, message });
};

app.set('view engine', 'pug');
app.set('views', './views');

app.use(express.static('./www/'));

app.get('/', (req, res) => {
	res.render('index', {}, (err, html) => {
		if(err) {
			res.sendStatus(500);
			console.error(err);
			return;
		}
		res.send(html);
	});
});

app.use('/api', require('./routes/api'));