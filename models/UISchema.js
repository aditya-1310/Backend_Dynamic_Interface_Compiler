const mongoose = require('mongoose')

const UISchemaSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100
  },
  description: {
    type: String,
    trim: true,
    maxlength: 500
  },
  schema: {
    type: Array,
    required: true,
    validate: {
      validator: function(v) {
        return Array.isArray(v) && v.length > 0
      },
      message: 'Schema must be a non-empty array'
    }
  }
}, {
  timestamps: true
})

// Index for faster queries
UISchemaSchema.index({ name: 1 })
UISchemaSchema.index({ createdAt: -1 })

module.exports = mongoose.model('UISchema', UISchemaSchema)
