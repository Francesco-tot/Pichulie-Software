const { Schema, model } = require('mongoose');

const UserSchema = new Schema(
    {
	"email": { type: String, required: true},
	"password": { type: String, required: true},
	"name": { type: String, required: true},
    "age": { type: Number, required: true},
    },
    { timestamps: true } // create createdAt and updatedAt fields automatically
)

module.exports = model('User', UserSchema)