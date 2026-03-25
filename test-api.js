const Anthropic = require("@anthropic-ai/sdk").default;
require("dotenv").config();

const apiKey = process.env.ANTHROPIC_API_KEY;
console.log("API Key loaded:", apiKey ? "✓ present" : "✗ missing");
console.log("API Key preview:", apiKey ? apiKey.slice(0, 20) + "..." : "none");

const client = new Anthropic({ apiKey });

client.messages
  .create({
    model: "claude-3-5-sonnet-20241022",
    max_tokens: 100,
    messages: [
      {
        role: "user",
        content: "Say hello in one word",
      },
    ],
  })
  .then((response) => {
    console.log("✓ API call successful!");
    console.log("Response:", response.content[0].text);
  })
  .catch((error) => {
    console.error("✗ API Error:");
    console.error("Status:", error.status);
    console.error("Message:", error.message);
    if (error.error) {
      console.error("Details:", JSON.stringify(error.error, null, 2));
    }
  });
