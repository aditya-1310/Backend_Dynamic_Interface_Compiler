const express = require('express')
const UISchema = require('../models/UISchema')
const router = express.Router()

// Get all schemas
router.get('/schemas', async (req, res) => {
  try {
    const schemas = await UISchema.find()
      .select('_id name description createdAt updatedAt')
      .sort({ createdAt: -1 })
      .limit(50) // Limit to prevent large responses

    res.json({
      success: true,
      schemas: schemas
    })
  } catch (error) {
    console.error('Error fetching schemas:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to fetch schemas'
    })
  }
})

// Get a specific schema by ID
router.get('/schemas/:id', async (req, res) => {
  try {
    const { id } = req.params

    if (!id.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid schema ID format'
      })
    }

    const schema = await UISchema.findById(id)

    if (!schema) {
      return res.status(404).json({
        success: false,
        error: 'Schema not found'
      })
    }

    res.json({
      success: true,
      schema: schema
    })
  } catch (error) {
    console.error('Error fetching schema:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to fetch schema'
    })
  }
})

// Create a new schema
router.post('/schemas', async (req, res) => {
  try {
    const { name, description, schema } = req.body

    // Validation
    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Name is required and must be a non-empty string'
      })
    }

    if (!schema || !Array.isArray(schema) || schema.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Schema is required and must be a non-empty array'
      })
    }

    // Validate schema structure
    for (let i = 0; i < schema.length; i++) {
      const component = schema[i]
      if (!component.type || !['form', 'text', 'image'].includes(component.type)) {
        return res.status(400).json({
          success: false,
          error: `Invalid component type at index ${i}: ${component.type}`
        })
      }
    }

    // Check if name already exists
    const existingSchema = await UISchema.findOne({ name: name.trim() })
    if (existingSchema) {
      return res.status(409).json({
        success: false,
        error: 'A schema with this name already exists'
      })
    }

    const newSchema = new UISchema({
      name: name.trim(),
      description: description ? description.trim() : '',
      schema: schema
    })

    const savedSchema = await newSchema.save()

    res.status(201).json({
      success: true,
      schema: savedSchema,
      message: 'Schema created successfully'
    })
  } catch (error) {
    console.error('Error creating schema:', error)
    
    if (error.name === 'ValidationError') {
      return res.status(400).json({
        success: false,
        error: 'Validation error',
        details: Object.values(error.errors).map(err => err.message)
      })
    }

    res.status(500).json({
      success: false,
      error: 'Failed to create schema'
    })
  }
})

// Update a schema
router.put('/schemas/:id', async (req, res) => {
  try {
    const { id } = req.params
    const { name, description, schema } = req.body

    if (!id.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid schema ID format'
      })
    }

    // Validation
    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Name is required and must be a non-empty string'
      })
    }

    if (!schema || !Array.isArray(schema) || schema.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Schema is required and must be a non-empty array'
      })
    }

    // Check if name already exists (excluding current schema)
    const existingSchema = await UISchema.findOne({ 
      name: name.trim(),
      _id: { $ne: id }
    })
    if (existingSchema) {
      return res.status(409).json({
        success: false,
        error: 'A schema with this name already exists'
      })
    }

    const updatedSchema = await UISchema.findByIdAndUpdate(
      id,
      {
        name: name.trim(),
        description: description ? description.trim() : '',
        schema: schema
      },
      { new: true, runValidators: true }
    )

    if (!updatedSchema) {
      return res.status(404).json({
        success: false,
        error: 'Schema not found'
      })
    }

    res.json({
      success: true,
      schema: updatedSchema,
      message: 'Schema updated successfully'
    })
  } catch (error) {
    console.error('Error updating schema:', error)
    
    if (error.name === 'ValidationError') {
      return res.status(400).json({
        success: false,
        error: 'Validation error',
        details: Object.values(error.errors).map(err => err.message)
      })
    }

    res.status(500).json({
      success: false,
      error: 'Failed to update schema'
    })
  }
})

// Delete a schema
router.delete('/schemas/:id', async (req, res) => {
  try {
    const { id } = req.params

    if (!id.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid schema ID format'
      })
    }

    const deletedSchema = await UISchema.findByIdAndDelete(id)

    if (!deletedSchema) {
      return res.status(404).json({
        success: false,
        error: 'Schema not found'
      })
    }

    res.json({
      success: true,
      message: 'Schema deleted successfully'
    })
  } catch (error) {
    console.error('Error deleting schema:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to delete schema'
    })
  }
})

module.exports = router
