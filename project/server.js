import { fileURLToPath } from 'url';
import { dirname } from 'path';

// Setup __dirname for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

import express from 'express';
import cors from 'cors';
import OpenAI from 'openai';
import { OPENAI_API_KEY } from './config.js';
import multer from 'multer';
import pdfjsLib from 'pdfjs-dist';
import path from 'path';

// Set worker path
pdfjsLib.GlobalWorkerOptions.workerSrc = path.join(
  __dirname,
  'node_modules/pdfjs-dist/build/pdf.worker.min.js'
);

// Setup dirname for ES modules

const app = express();
const port = 5000;

// Configure OpenAI
const openai = new OpenAI({apiKey: OPENAI_API_KEY});

// Middleware
app.use(cors());
app.use(express.json());
const upload = multer();

// Helper function for PDF text extraction
const getTextFromPDFBuffer = async (buffer) => {
  try {
    // Load document - this is the updated way to load a PDF
    const loadingTask = pdfjsLib.getDocument({ data: buffer });
    const pdf = await loadingTask.promise;
    
    const maxPages = pdf.numPages;
    const textChunks = [];

    for (let pageNum = 1; pageNum <= maxPages; pageNum++) {
      const page = await pdf.getPage(pageNum);
      const content = await page.getTextContent();
      const strings = content.items.map(item => item.str).join(' ');
      textChunks.push(strings);
    }

    return textChunks.join('\n\n');
  } catch (error) {
    console.error('Error extracting text from PDF:', error);
    throw new Error('Failed to extract text from PDF: ' + error.message);
  }
};
// Test endpoint
app.get('/test', (req, res) => {
  res.json({ status: 'API is running', version: '1.0' });
});

// Prediction endpoint
app.post('/predict', async (req, res) => {
  try {
    const { question } = req.body;

    if (!question) {
      return res.status(400).json({ error: 'Question is required' });
    }

    // First, get the explanation - no JSON in this one
    const explanationResult = await generateExplanation(question);
    
    // Second, get the forces data separately
    const forcesResult = await generateForces(question);
    
    // Send both pieces to the client as separate properties
    res.json({
      answer: explanationResult,
      forces: forcesResult,
      success: true
    });

  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({
      error: true,
      message: 'Failed to process the request',
      details: error.message
    });
  }
});

/**
 * Generates only the explanation part of the physics solution
 * @param {string} question - The physics question to analyze
 * @returns {string} - The formatted explanation text
 */
async function generateExplanation(question) {
  const systemPrompt = `
You are an expert physics tutor designed to assist high school and college students with any physics problem. Your goal is to provide clear, precise, and educational explanations that help students understand both the conceptual foundations and the mathematical applications of physics principles.

### Approach to Physics Problems:

#### **Analysis Phase:**
1. Identify and clearly explain the key physics concepts and principles involved in the problem.
2. Define all relevant variables and constants.
3. Describe and visualize any physical scenarios or systems, including key forces and motion.
4. Clearly state any assumptions being made in the solution.

#### **Solution Phase:**
1. Break down complex problems into manageable components and steps.
2. Provide a clear, logical, and **step-by-step solution**.
3. **Always plug in the given numbers and calculate final numerical values with proper units**.
4. Show all mathematical work and algebraic manipulations, **rounding every operation to 3 decimal places**.
5. Use **LaTeX formatting** for all equations and mathematical expressions:
   - Do NOT USE the asterisks like ** text ** anywhere.
   - Inline math: \\( ... \\).
   - Block math: \\[ ... \\].
6. Explain the physics reasoning behind each step and how it connects to the broader principles.
7. Use **proper vector notation** where applicable and apply appropriate units throughout the solution.

### Educational Elements:
- Explain key concepts **intuitively** using analogies when helpful.
- Address common misconceptions related to the topic.
- Connect the problem to **broader physics principles** and explain real-world applications.
- Pose brief **conceptual questions** to test understanding after the explanation.

### Response Structure:
Your response should follow this structure:
1. **Restate** the problem in your own words.
2. Provide a **conceptual explanation** of the physics principles involved.
3. Provide a **step-by-step solution**. Round every operation to **3 decimal places**.
4. Provide the **final numeric answer**, rounded to **3 decimal places**.

### Final Notes:
- DO NOT include any JSON, code blocks, or force diagrams in your response.
- Ensure that the explanation level is appropriate for **high school or college students**, focusing on **building intuition** alongside mathematical rigor.
- Always strive for **clarity**, **consistency**, and **accuracy** in both the explanation and calculations.
`;

  const completion = await openai.chat.completions.create({
    model: "gpt-4o",
    messages: [
      {
        role: "system",
        content: systemPrompt
      },
      {
        role: "user",
        content: `Analyze this physics problem and provide a detailed explanation: ${question}`
      }
    ],
    temperature: 0.7,
    max_tokens: 1500
  });

  return completion.choices[0].message.content || "Unable to generate explanation.";
}

/**
 * Generates only the forces data for the force diagram
 * @param {string} question - The physics question to analyze
 * @returns {Array} - Array of force objects
 */
async function generateForces(question) {
  const systemPrompt = `
You are an expert physics tutor tasked with generating accurate force diagram data for physics problems. You will analyze the physics problem and provide ONLY a JSON array of forces involved.

### Force Diagram Requirements:
- Provide a JSON array representation of all forces in the problem.
- The response should be ONLY a JSON object with a "forces" property containing the array.

### **Force Color Conventions:**
- **Applied/External Forces**: "#FF0000" (Red)
- **Weight/Gravitational Force**: "#000000" (Black)
- **Normal Force**: "#0000FF" (Blue)
- **Friction**: "#8B4513" (Brown)
- **Tension**: "#800080" (Purple)
- **Spring Force**: "#008000" (Green)
- **Electric Force**: "#FFD700" (Gold)
- **Magnetic Force**: "#4B0082" (Indigo)
- **Component Forces (x)**: "#228B22" (Forest Green)
- **Component Forces (y)**: "#FF8C00" (Dark Orange)
- **Net/Resultant Force**: "#FF00FF" (Magenta)

### Force Object Format:
Each force must include these properties:
- "magnitude": numeric value in Newtons (required)
- "angle": degrees, using standard physics convention:
  - 0° = right (positive x-axis)
  - 90° = up (positive y-axis)
  - 180° = left (negative x-axis)
  - 270° = down (negative y-axis)
- "color": hex color code based on the conventions above
- "label": descriptive label for the force

### IMPORTANT:
Return a JSON object with exactly this structure:
{
  "forces": [
    {
      "magnitude": 10.0,
      "angle": 30.0,
      "color": "#FF0000",
      "label": "Applied Force"
    },
    {
      "magnitude": 9.8,
      "angle": 270.0,
      "color": "#000000",
      "label": "Weight"
    }
  ]
}

- If the problem doesn't involve forces, return { "forces": [] }
- Always include both the original forces and their components if vector decomposition is used.
- Make sure all forces that would appear in a proper free-body diagram are included.
`;

  try {
    console.log("Generating forces for question:", question);
    
    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: systemPrompt
        },
        {
          role: "user",
          content: `Generate only the force diagram data for this physics problem: ${question}`
        }
      ],
      temperature: 0.7,
      max_tokens: 1000,
      response_format: { type: "json_object" }
    });

    const content = completion.choices[0].message.content;
    console.log('Raw force data from API:', content);
    
    try {
      // Attempt to parse the JSON response
      const parsedContent = JSON.parse(content);
      
      // Check if it has the forces property
      if (parsedContent.forces && Array.isArray(parsedContent.forces)) {
        console.log(`Found forces array with ${parsedContent.forces.length} forces`);
        
        // Validate each force object
        const validForces = parsedContent.forces.filter(force => 
          force && 
          typeof force.magnitude === 'number' && 
          typeof force.angle === 'number' && 
          typeof force.color === 'string' && 
          typeof force.label === 'string'
        );
        
        console.log(`${validForces.length} valid forces after filtering`);
        return validForces;
      }
      
      // If it's directly an array (not wrapped in a forces property)
      if (Array.isArray(parsedContent)) {
        console.log(`Found direct array with ${parsedContent.length} items`);
        
        // Validate each force object
        const validForces = parsedContent.filter(force => 
          force && 
          typeof force.magnitude === 'number' && 
          typeof force.angle === 'number' && 
          typeof force.color === 'string' && 
          typeof force.label === 'string'
        );
        
        console.log(`${validForces.length} valid forces after filtering`);
        return validForces;
      }
      
      // If we get here, we couldn't find a valid forces array
      console.warn('No valid forces array found in the response');
      return [];
      
    } catch (error) {
      console.error('JSON parsing error for forces:', error);
      return [];
    }
  } catch (error) {
    console.error('OpenAI API error in generateForces:', error);
    return [];
  }
}

// Formula Interpretation Endpoint
// Text-based Formula Interpretation Endpoint
app.post('/interpret-formula-text', express.json(), async (req, res) => {
  try {
    const { text } = req.body;
    
    if (!text || typeof text !== 'string' || text.trim().length === 0) {
      return res.status(400).json({ 
        error: 'No formula text provided',
        formulas: [] 
      });
    }
    
    console.log("Formula text received. Length:", text.length);
    
    // Trim the text if it's too long for the API
    const trimmedText = text.length > 50000 
      ? text.substring(0, 50000) + "... [text truncated for API limits]" 
      : text;

    console.log("Sending to OpenAI");
    
    // Process the text with OpenAI
    const completion = await openai.chat.completions.create({
      model: "gpt-4o", // More stable for JSON output
      messages: [
        {
          role: "system",
          content: `You are a physics formula interpreter. Your task is to extract **all physics formulas** from the provided text and return them in a **strictly valid JSON** format.

          Your output must strictly follow this structure:
          {
            "formulas": [
              {
                "equation": "\\[ F = m \\cdot a \\]",
                "variables": [
                  {
                    "symbol": "F",
                    "name": "Force",
                    "units": "N",
                    "description": "Force acting on the object"
                  },
                  {
                    "symbol": "m",
                    "name": "Mass",
                    "units": "kg",
                    "description": "Mass of the object"
                  },
                  {
                    "symbol": "a",
                    "name": "Acceleration",
                    "units": "m/s^2",
                    "description": "Rate of change of velocity"
                  }
                ],
                "usage": "Newton's Second Law, relating force, mass, and acceleration."
              }
            ]
          }
          
          REQUIREMENTS:
          - Wrap **every equation** in **block-level MathJax delimiters**: use **\\[ ... \\]**
          - DO NOT include any text outside the JSON structure
          - If the input text contains multiple formulas, include each in its own JSON object within the array
          - If **no physics formulas** are found, return:
            { "formulas": [] }
          
          Ensure the output is suitable for LaTeX rendering with MathJax and contains no extra commentary.`
        },
        {
          role: "user",
          content: `Extract and explain the physics formulas from this text:\n\n${trimmedText}`
        }
      ],
      temperature: 0.1,
      max_tokens: 1500,
      response_format: { type: "json_object" }
    });

    console.log("OpenAI response received");
    const content = completion.choices[0].message.content;
    
    try {
      // Try parsing the content as JSON
      const parsedData = JSON.parse(content);
      
      // Make sure we have a formulas array
      if (!parsedData.formulas || !Array.isArray(parsedData.formulas)) {
        console.warn("No formulas array found in response");
        // Create a default structure
        parsedData.formulas = [];
        
        // Check if the response itself is an array
        if (Array.isArray(parsedData)) {
          parsedData.formulas = parsedData;
        }
        // Check if it's a single formula object
        else if (parsedData.equation && parsedData.variables) {
          parsedData.formulas = [parsedData];
        }
      }
      
      // Validate each formula has the required fields
      const validFormulas = parsedData.formulas.filter(formula => {
        return formula && 
               typeof formula.equation === 'string' && 
               Array.isArray(formula.variables) &&
               typeof formula.usage === 'string';
      });
      
      console.log(`Found ${validFormulas.length} valid formulas`);
      
      return res.json({ 
        formulas: validFormulas,
        success: true
      });
      
    } catch (err) {
      console.error("JSON parse failed:", err.message);
      console.error("Raw content that failed to parse (first 200 chars):", content.substring(0, 200));
      
      // Try a recovery approach with a simplified prompt
      try {
        console.log("Attempting recovery with simplified prompt...");
        
        const recoveryCompletion = await openai.chat.completions.create({
          model: "gpt-3.5-turbo-0125",
          messages: [
            {
              role: "system",
              content: "Extract physics formulas and return as JSON. Format: {\"formulas\": [{\"equation\": \"F = ma\", \"variables\": [{\"symbol\": \"F\", \"name\": \"Force\", \"units\": \"N\", \"description\": \"Force\"}], \"usage\": \"Newton's law\" }]}"
            },
            {
              role: "user",
              content: `Extract physics formulas from this text: ${trimmedText.substring(0, 20000)}`
            }
          ],
          temperature: 0,
          max_tokens: 1000,
          response_format: { type: "json_object" }
        });
        
        const recoveryContent = recoveryCompletion.choices[0].message.content;
        const recoveryData = JSON.parse(recoveryContent);
        
        if (recoveryData.formulas && Array.isArray(recoveryData.formulas)) {
          console.log(`Recovery succeeded! Found ${recoveryData.formulas.length} formulas`);
          return res.json({
            formulas: recoveryData.formulas,
            success: true,
            note: "Used recovery method due to parsing issues with primary response"
          });
        } else {
          throw new Error("Recovery data format invalid");
        }
        
      } catch (recoveryErr) {
        console.error("Recovery attempt also failed:", recoveryErr);
        return res.status(500).json({
          error: 'Failed to parse formulas from the provided text.',
          formulas: []
        });
      }
    }
  } catch (error) {
    console.error("Formula text interpretation failed:", error);
    return res.status(500).json({
      error: error?.message || 'Failed to process formula text.',
      formulas: []
    });
  }
});

app.post('/interpret-formulas', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }
    
    console.log("File received:", req.file.originalname, "Size:", req.file.size);
    const pdfBuffer = req.file.buffer;

    // Extract text from PDF
    console.log("Starting PDF text extraction");
    const extractedText = await getTextFromPDFBuffer(pdfBuffer);
    console.log("PDF text extraction complete. Length:", extractedText.length);
    
    // If text extraction returned empty or very little text
    if (!extractedText || extractedText.length < 10) {
      console.log("WARNING: Extracted PDF text is empty or very short");
      return res.status(400).json({ 
        error: 'Could not extract meaningful text from the PDF',
        formulas: [] 
      });
    }

    console.log("Sending to OpenAI");
    // Send to OpenAI for formula interpretation
    const completion = await openai.chat.completions.create({
      model: "gpt-4o", // Using a more capable model for formula extraction
      messages: [
        {
          role: "system",
          content: `You are a physics formula sheet parser. Your task is to scan through the provided text and extract ALL physics formulas, returning them in a JSON array.

IMPORTANT REQUIREMENTS:
1. Scan the ENTIRE text from top to bottom - don't stop after the first few formulas.
2. Return ALL formulas you can identify, not just the most common ones.
3. Use **LaTeX formatting** for all equations and mathematical expressions:
   - Do NOT USE the asterisks like ** text ** anywhere.
   - Inline math: \\( ... \\).
   - Block math: \\[ ... \\].
4. Identify all variables used in each formula.

Each formula object in the array must have this structure:
{
  "equation": "\\[F = m \\cdot a\\]",
  "variables": [
    { "symbol": "F", "name": "Force", "units": "N", "description": "Net force" },
    { "symbol": "m", "name": "Mass", "units": "kg", "description": "Mass of object" },
    { "symbol": "a", "name": "Acceleration", "units": "m/s^2", "description": "Rate of change of velocity" }
  ],
  "usage": "Calculates force using Newton's second law."
}

YOUR RESPONSE MUST:
1. Be ONLY a JSON object with a "formulas" property containing the array of formula objects.
2. Include ALL formulas found in the document.
3. Format LaTeX properly for complex equations.
4. Have no explanatory text outside the JSON structure.

Example response format:
{
  "formulas": [
    { "equation": "...", "variables": [...], "usage": "..." },
    { "equation": "...", "variables": [...], "usage": "..." }
  ]
}`
        },
        {
          role: "user",
          content: `Extract ALL physics formulas from this text, scanning from start to finish:\n\n${extractedText}`
        }
      ],
      temperature: 0.1, // Lower temperature for more consistent responses
      max_tokens: 4000, // Increased token limit to handle more formulas
      response_format: { type: "json_object" }
    });

    console.log("OpenAI response received");
    const content = completion.choices[0].message.content;
    
    try {
      const parsedData = JSON.parse(content);
      console.log("JSON parsing successful");
      
      let formulas = [];
      
      // Handle different response formats
      if (parsedData.formulas && Array.isArray(parsedData.formulas)) {
        console.log(`Found ${parsedData.formulas.length} formulas in response`);
        formulas = parsedData.formulas;
      } else if (Array.isArray(parsedData)) {
        console.log(`Found ${parsedData.length} formulas in direct array`);
        formulas = parsedData;
      } else {
        console.log("Unexpected response format - looking for formula objects");
        // Try to find any formula objects in the response
        const keys = Object.keys(parsedData);
        for (const key of keys) {
          if (parsedData[key] && typeof parsedData[key] === 'object' && parsedData[key].equation) {
            formulas.push(parsedData[key]);
          }
        }
        
        if (formulas.length === 0 && parsedData.equation) {
          // Single formula object at root
          formulas = [parsedData];
        }
      }
      
      // Validate each formula
      formulas = formulas.filter(formula => 
        formula && 
        typeof formula.equation === 'string' && 
        Array.isArray(formula.variables)
      );
      
      console.log(`Sending ${formulas.length} validated formulas to client`);
      return res.json({ 
        formulas,
        success: true
      });
      
    } catch (err) {
      console.error("JSON parse failed:", err.message);
      return res.status(500).json({
        error: 'Failed to parse OpenAI response as valid JSON.',
        formulas: []
      });
    }
  } catch (error) {
    console.error("Formula interpretation failed:", error);
    return res.status(500).json({
      error: error?.message || 'Formula interpretation failed unexpectedly.',
      formulas: []
    });
  }
});

// NEW ENDPOINT: Generate Physics Mindmap
app.post('/mindmap', express.json(), async (req, res) => {
  try {
    const { concept } = req.body;
    
    if (!concept || typeof concept !== 'string' || concept.trim().length === 0) {
      return res.status(400).json({ 
        error: 'No physics concept provided',
        success: false
      });
    }
    
    console.log("Generating mindmap for physics concept:", concept);
    
    // Call OpenAI to generate the mindmap structure
    const mindmapData = await generateMindmapData(concept);
    
    return res.json({
      success: true,
      mindmap: mindmapData
    });
    
  } catch (error) {
    console.error("Mindmap generation failed:", error);
    return res.status(500).json({
      error: error?.message || 'Failed to generate physics mindmap.',
      success: false
    });
  }
});

/**
 * Generate mindmap data structure for a physics concept
 * @param {string} concept - The physics concept to create a mindmap for
 * @returns {Object} - Hierarchical mindmap data
 */
async function generateMindmapData(concept) {
  const systemPrompt = `
You are a physics education expert specializing in creating comprehensive mindmaps that help students understand physics concepts. Your task is to generate a hierarchical mindmap structure for a given physics concept.

### Requirements:
1. Create a JSON structure representing a mindmap with nodes and connections
2. The central node should be the main concept provided by the user
3. Include relevant subcategories, formulas, applications, history, and related concepts
4. Organize information hierarchically with appropriate depth (usually 2-3 levels)
5. Include brief but informative descriptions for each node
6. Assign appropriate colors to different categories of nodes

### Output Format:
Your response must be valid JSON with exactly this structure:
{
  "nodes": [
    {
      "id": "root",
      "label": "Main Concept",
      "description": "Brief description of the concept",
      "type": "main",
      "color": "#1E88E5"
    },
    {
      "id": "subcategory1",
      "label": "Subcategory Name",
      "description": "Brief description",
      "type": "category",
      "color": "#43A047"
    },
    {
      "id": "formula1",
      "label": "Formula Name",
      "description": "E = mc²",
      "type": "formula",
      "color": "#FBC02D"
    }
    // More nodes...
  ],
  "links": [
    {
      "source": "root",
      "target": "subcategory1"
    },
    {
      "source": "subcategory1",
      "target": "formula1"
    }
    // More links...
  ]
}

### Node Types and Colors:
- Main concept: "#1E88E5" (Blue)
- Categories: "#43A047" (Green)
- Formulas: "#FBC02D" (Yellow)
- Applications: "#E53935" (Red)
- Historical context: "#8E24AA" (Purple)
- Related concepts: "#FB8C00" (Orange)
- Examples: "#00ACC1" (Teal)

Each node must have:
1. A unique ID (simple string with no spaces)
2. A descriptive label (concise but clear)
3. A brief description (1-2 sentences)
4. A type (from the list above)
5. A color (from the color scheme above)

Links should establish a clear hierarchy and show relationships between concepts.
`;

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: systemPrompt
        },
        {
          role: "user",
          content: `Create a physics mindmap for this concept: ${concept}`
        }
      ],
      temperature: 0.7,
      max_tokens: 2000,
      response_format: { type: "json_object" }
    });

    const content = completion.choices[0].message.content;
    
    try {
      // Parse and validate the JSON response
      const parsedData = JSON.parse(content);
      
      // Validate required structure
      if (!parsedData.nodes || !Array.isArray(parsedData.nodes) || 
          !parsedData.links || !Array.isArray(parsedData.links)) {
        throw new Error("Invalid mindmap structure: missing nodes or links arrays");
      }
      
      // Validate each node has required properties
      parsedData.nodes.forEach((node, index) => {
        if (!node.id || !node.label || !node.description || !node.type || !node.color) {
          throw new Error(`Node at index ${index} is missing required properties`);
        }
      });
      
      // Validate each link has source and target
      parsedData.links.forEach((link, index) => {
        if (!link.source || !link.target) {
          throw new Error(`Link at index ${index} is missing source or target`);
        }
      });
      
      console.log(`Successfully generated mindmap with ${parsedData.nodes.length} nodes and ${parsedData.links.length} links`);
      return parsedData;
      
    } catch (parseErr) {
      console.error("Failed to parse or validate mindmap data:", parseErr);
      throw new Error("Could not generate a valid mindmap structure");
    }
  } catch (apiErr) {
    console.error("OpenAI API error in generateMindmapData:", apiErr);
    throw new Error("Failed to generate mindmap data from API");
  }
}

// NEW FILE UPLOAD ENDPOINT for mindmap generation from PDF
app.post('/api/mindmap-from-file', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded', success: false });
    }
    
    console.log("File received for mindmap generation:", req.file.originalname, "Size:", req.file.size);
    const pdfBuffer = req.file.buffer;

    // Extract text from PDF
    console.log("Starting PDF text extraction for mindmap");
    const extractedText = await getTextFromPDFBuffer(pdfBuffer);
    console.log("PDF text extraction complete. Length:", extractedText.length);
    
    // If text extraction returned empty or very little text
    if (!extractedText || extractedText.length < 10) {
      console.log("WARNING: Extracted PDF text is empty or very short");
      return res.status(400).json({ 
        error: 'Could not extract meaningful text from the PDF',
        success: false
      });
    }

    // Determine main concept from the PDF
    const mainConcept = await extractMainConceptFromText(extractedText);
    console.log("Extracted main concept:", mainConcept);
    
    // Generate mindmap based on the extracted concept
    const mindmapData = await generateMindmapData(mainConcept);
    
    return res.json({
      success: true,
      mindmap: mindmapData,
      concept: mainConcept
    });
    
  } catch (error) {
    console.error("Mindmap generation from file failed:", error);
    return res.status(500).json({
      error: error?.message || 'Failed to generate mindmap from file.',
      success: false
    });
  }
});

/**
 * Extract the main physics concept from text
 * @param {string} text - Text extracted from PDF
 * @returns {string} - Main physics concept
 */
async function extractMainConceptFromText(text) {
  try {
    // Limit text length to avoid token limits
    const trimmedText = text.length > 10000 
      ? text.substring(0, 10000) + "... [text truncated]" 
      : text;
    
    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content: "You are a physics topic analyzer. Extract the main physics concept from the provided text. Return ONLY the name of the concept without explanation or additional text."
        },
        {
          role: "user",
          content: `Analyze this physics text and identify the main concept or topic it discusses:\n\n${trimmedText}`
        }
      ],
      temperature: 0.3,
      max_tokens: 50
    });

    // Get just the concept name, stripped of any extra text
    let concept = completion.choices[0].message.content.trim();
    
    // Further clean up by removing any explanatory phrases
    concept = concept.replace(/^(the concept of|the topic of|the main concept is|the physics concept is|the main topic is|this text discusses|this is about|the text is about)/i, '').trim();
    
    return concept || "Physics Concept";
  } catch (error) {
    console.error("Failed to extract main concept:", error);
    return "Physics Concept";
  }
}


// Start server
app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});