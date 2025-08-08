const express = require('express')
const { GoogleGenerativeAI } = require('@google/generative-ai')
const router = express.Router()

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY)

const SYSTEM_PROMPT = `You are a UI schema generator for a dynamic interface compiler. Convert natural language descriptions into JSON schemas for React components.

Supported component types:
1. "form" - Interactive forms with validation
2. "text" - Text content (headings, paragraphs)
3. "image" - Images with various properties

Component Schemas:

FORM:
{
  "type": "form",
  "fields": [
    {
      "label": "Field Label",
      "type": "text|email|number|textarea|select",
      "required": true|false,
      "placeholder": "Optional placeholder",
      "min": number (for number/date fields),
      "max": number (for number/date fields),
      "rows": number (for textarea),
      "options": [{"label": "Option 1", "value": "value1"}] (for select)
    }
  ],
  "submitText": "Submit Button Text",
  "onSubmit": "if (values.age < 18) return 'Must be 18+'; return 'Success!';" (optional logic)
}

TEXT:
{
  "type": "text",
  "content": "Text content here",
  "variant": "h1|h2|h3|h4|h5|h6|p|lead|caption",
  "className": "additional-css-classes" (optional)
}

IMAGE:
{
  "type": "image",
  "src": "https://example.com/image.jpg",
  "alt": "Image description",
  "width": "400px" (optional),
  "height": "300px" (optional),
  "rounded": true|false (optional),
  "shadow": true|false (optional)
}

Rules:
- Always return a valid JSON array
- Use realistic placeholder images (https://via.placeholder.com/ or https://picsum.photos/)
- Include proper validation logic when requested
- Make forms user-friendly with good labels and placeholders
- Use appropriate text variants for hierarchy

Examples:

Input: "Create a contact form with name, email, and message"
Output: [
  {"type": "text", "content": "Contact Us", "variant": "h1"},
  {"type": "form", "fields": [
    {"label": "Name", "type": "text", "required": true, "placeholder": "Enter your full name"},
    {"label": "Email", "type": "email", "required": true, "placeholder": "your@email.com"},
    {"label": "Message", "type": "textarea", "required": true, "placeholder": "Your message here...", "rows": 4}
  ], "submitText": "Send Message"}
]

Input: "Build a product showcase with image and details"
Output: [
  {"type": "text", "content": "Featured Product", "variant": "h2"},
  {"type": "image", "src": "https://picsum.photos/400/300", "alt": "Product image", "width": "400px", "rounded": true, "shadow": true},
  {"type": "text", "content": "Premium Wireless Headphones", "variant": "h3"},
  {"type": "text", "content": "Experience crystal-clear audio with our latest wireless headphones featuring noise cancellation and 30-hour battery life.", "variant": "p"}
]

Now convert the user's request into a JSON schema:`

router.post('/generate-schema', async (req, res) => {
  try {
    const { prompt } = req.body

    if (!prompt || typeof prompt !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'Prompt is required and must be a string'
      })
    }

    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' })
    
    const fullPrompt = `${SYSTEM_PROMPT}\n\nUser Request: "${prompt}"\n\nJSON Schema:`
    
    const result = await model.generateContent(fullPrompt)
    const response = await result.response
    let generatedText = response.text()

    // Clean up the response to extract JSON
    generatedText = generatedText.trim()
    
    // Remove markdown code blocks if present
    if (generatedText.startsWith('```json')) {
      generatedText = generatedText.replace(/^```json\s*/, '').replace(/\s*```$/, '')
    } else if (generatedText.startsWith('```')) {
      generatedText = generatedText.replace(/^```\s*/, '').replace(/\s*```$/, '')
    }

    // Try to parse the JSON
    let schema
    try {
      schema = JSON.parse(generatedText)
    } catch (parseError) {
      // If parsing fails, try to extract JSON from the text
      const jsonMatch = generatedText.match(/\[[\s\S]*\]/)
      if (jsonMatch) {
        schema = JSON.parse(jsonMatch[0])
      } else {
        throw new Error('Could not extract valid JSON from AI response')
      }
    }

    // Validate that it's an array
    if (!Array.isArray(schema)) {
      throw new Error('Schema must be an array')
    }

    // Basic validation of schema structure
    for (const component of schema) {
      if (!component.type || !['form', 'text', 'image'].includes(component.type)) {
        throw new Error(`Invalid component type: ${component.type}`)
      }
    }

    res.json({
      success: true,
      schema: schema,
      prompt: prompt
    })

  } catch (error) {
    console.error('Gemini API Error:', error)
    
    let errorMessage = 'Failed to generate schema'
    if (error.message.includes('API key')) {
      errorMessage = 'Invalid API key configuration'
    } else if (error.message.includes('quota')) {
      errorMessage = 'API quota exceeded'
    } else if (error.message.includes('JSON')) {
      errorMessage = 'AI generated invalid response format'
    }

    res.status(500).json({
      success: false,
      error: errorMessage,
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    })
  }
})

module.exports = router
