const Groq = require("groq-sdk");
require("dotenv").config();

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

groq.chat.completions.create({
  model: "llama-3.1-8b-instant",
  max_tokens: 100,
  messages: [
    {
      role: "user",
      content: "Say hello in one word"
    }
  ]
}).then(response => {
  console.log("✓ Groq API working!");
  console.log("Response:", response.choices[0].message.content);
}).catch(error => {
  console.error("✗ Groq API Error:");
  console.error(error.message);
});
