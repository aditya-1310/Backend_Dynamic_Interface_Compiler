const express = require('express')
const mongoose = require('mongoose')
const cors = require('cors')
require('dotenv').config()

const geminiRoutes = require('./routes/gemini')
const schemaRoutes = require('./routes/schemas')

const app = express()
const PORT = process.env.PORT || 3001

// Middleware
app.use(cors())
app.use(express.json({ limit: '10mb' }))

// MongoDB connection
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://bhadadeaditya1310:aditya1310@cluster0.a7opswp.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0'

mongoose.connect(MONGODB_URI)
  .then(() => {
    console.log('Connected to MongoDB')
  })
  .catch((error) => {
    console.error('MongoDB connection error:', error)
  })

// Routes
app.use('/api', geminiRoutes)
app.use('/api', schemaRoutes)

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'OK', message: 'Dynamic Interface Compiler API is running' })
})

// Error handling middleware
app.use((error, req, res, next) => {
  console.error('Error:', error)
  res.status(500).json({
    success: false,
    error: 'Internal server error'
  })
})

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    error: 'Route not found'
  })
})

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`)
  console.log(`Health check: http://localhost:${PORT}/health`)
})
