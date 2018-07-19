const express = require("express");
const body_parser = require("body-parser");  // Parses JSON
const bcrypt = require("bcrypt-nodejs");   // Hash password
const cors = require("cors");   // Allow testing on HTTP
const knex = require("knex");   // Talk to SQL database

const db = knex({
	client: 'pg',
	connection: {
		connectionString: process.env.DATABASE_URL,
		ssl: true,
	}
});


const app = express();
app.use(body_parser.json());
app.use(cors());

app.get('/', (req, res) => {
	res.json("Everything is fine!!!!");
})


app.post('/signin', (req, res) => {
	db.select('email', 'hash').from('login')
	.where({
		email: req.body.email
	})
	.then(data => {
		const equal = bcrypt.compareSync(req.body.password, data[0].hash)
		if (equal) {
			return db.select("*").from("users")
			.where({
				email: req.body.email
			})
			.then(user => {
				res.json(user[0]);
			})
			.catch(err => res.status(400).json("Unable to get user"));
		} else {
			res.status(400).json("Wrong login information");
		}
	})
	.catch(err => res.status(400).json("Wrong login information"));
})

app.post('/register', (req, res) => {
	if (!req.body.name || !req.body.email || !req.body.password) {
		return res.status(400).json("Wrong register information");
	}
	const hash = bcrypt.hashSync(req.body.password);
	db.transaction(trx => {
		trx.insert({
			hash: hash,
			email: req.body.email
		})
		.into("login")
		.returning("email")
		.then(email => {
			return trx("users")
			.returning("*")
			.insert({
				email: email[0],
				name: req.body.name,
				joined: new Date()
			})
			.then(user => {
				res.json(user[0]);
			})
			
		})
		.then(trx.commit)
		.catch(trx.rollback)
	})
	.catch(err => res.status(400).json(err));
})

app.get('/profile/:id', (req, res) => {
	const { id } = req.params;
	db.select("*").from("users").where({
		id: id
	}).then(user => {
		if (user.length) {
			res.json(user[0]);
		} else {
			res.status(400).json("User not found");
		}
	})
})

app.put('/image', (req, res) => {
	const { id } = req.body;
	db("users").where({
		id: id
	})
	.increment('entries', 1)
	.returning('entries')
	.then(entries => {
		res.json(entries[0]);
	})
	.catch(err => res.status(400).json("Error updating entries"));
})



app.listen(process.env.PORT || 3000, () => {
	console.log(`The server is listening on port ${process.env.PORT}`);
});