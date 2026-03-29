import Anthropic from '@anthropic-ai/sdk';
export const anthropic = new Anthropic({
    apiKey: process.env.ANTHROPIC_API_KEY
});
// Single model constant used everywhere
export const CLAUDE_MODEL = process.env.CLAUDE_MODEL || 'claude-sonnet-4-20250514';
if (!process.env.ANTHROPIC_API_KEY) {
    console.error('[claude] ERROR: ANTHROPIC_API_KEY is not set');
    console.error('[claude] Add it to your .env file');
}
else {
    console.error('[claude] Anthropic client initialized ✓');
    console.error('[claude] Model:', CLAUDE_MODEL);
    console.error('[claude] Key prefix:', process.env.ANTHROPIC_API_KEY.slice(0, 12) + '...');
}
// Reusable function for simple text generation
export async function generateText(systemPrompt, userPrompt, maxTokens = 1000) {
    const message = await anthropic.messages.create({
        model: CLAUDE_MODEL,
        max_tokens: maxTokens,
        system: systemPrompt,
        messages: [{ role: 'user', content: userPrompt }]
    });
    const content = message.content[0];
    if (content.type !== 'text')
        throw new Error('Unexpected response type');
    return content.text;
}
// Reusable function for JSON generation
export async function generateJSON(systemPrompt, userPrompt, maxTokens = 1000) {
    const text = await generateText(systemPrompt + '\n\nRespond ONLY with valid JSON. No markdown, no backticks.', userPrompt, maxTokens);
    const clean = text
        .replace(/```json/g, '')
        .replace(/```/g, '')
        .trim();
    return JSON.parse(clean);
}
