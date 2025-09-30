const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
	email: {
		type: String,
		required: true,
		unique: true,
		lowercase: true,
		trim: true
	},
	password: {
		type: String,
		required: function() { return !this.isGoogleUser; }
	},
	googleId: {
		type: String,
		default: null
	},
	isGoogleUser: {
		type: Boolean,
		default: false
	},
	jwtToken: {
		type: String,
		default: null
	}
}, {
	timestamps: true
});

const User = mongoose.model('User', userSchema);

module.exports = User;
