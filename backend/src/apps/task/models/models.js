const { Schema, model } = require('mongoose');

const TaskSchema = new Schema(
    {
	"title": { type: String, required: true },
	"detail": { type: String, default: '' },
	"status": { type: String, enum: ['to do', 'in process', 'finished'], default: 'to do'},
	"task_date": { type: Date, required: true },
    "remember": {type: Boolean, default: false},
	"user_id": { type: Schema.Types.ObjectId, ref: 'User'}
    },
    { timestamps: true } // create createdAt and updatedAt fields automatically
)

module.exports = model('Task', TaskSchema)