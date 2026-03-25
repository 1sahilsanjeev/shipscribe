import { anthropic, CLAUDE_MODEL } from './claude.js';
import dotenv from 'dotenv';

dotenv.config();

/**
 * Generate a daily summary.
 */
export async function generateSummary(data: {
  activities: any[];
  completedTasks: any[];
  pendingTasks: any[];
}) {
  const prompt = `
Here is my developer activity from the last 24 hours:

ACTIVITIES:
${data.activities.map(a => `- [${a.source}] ${a.note} (${a.timestamp})`).join('\n')}

COMPLETED TASKS TODAY:
${data.completedTasks.map(t => `- ${t.title} (${t.project})`).join('\n')}

PENDING TASKS:
${data.pendingTasks.map(t => `- ${t.title} (${t.project}, priority: ${t.priority})`).join('\n')}

Please provide:
1. A short summary (5 bullet points of what was accomplished).
2. A single default casual X/Twitter post.

Format the response as JSON:
{
  "summary": ["bullet 1", "bullet 2", ...],
  "post": "the twitter post content"
}
`;

  const response = await anthropic.messages.create({
    model: CLAUDE_MODEL,
    max_tokens: 1000,
    system: "You are a professional scribe. Summarize activity concisely.",
    messages: [{ role: "user", content: prompt }],
  });

  const content = (response.content[0] as any).text;
  return JSON.parse(content);
}

/**
 * Generate 3 social post variants for a specific platform.
 */
export async function generatePostVariants(data: {
  summary: string[];
  platform: 'twitter' | 'linkedin';
}) {
  const charLimit = data.platform === 'twitter' ? 280 : 3000;
  
  const prompt = `
Based on these daily accomplishments:
${data.summary.map(s => `- ${s}`).join('\n')}

Generate 3 unique social media posts for ${data.platform.toUpperCase()}.
Constraints:
- Max characters: ${charLimit}
- Tone 1: Casual & punchy
- Tone 2: Technical & detailed
- Tone 3: Storytelling & reflective

Format the response strictly as JSON:
{
  "casual": "Post text...",
  "technical": "Post text...",
  "storytelling": "Post text..."
}
`;

  const response = await anthropic.messages.create({
    model: CLAUDE_MODEL,
    max_tokens: 1500,
    system: "You are a social media expert for developers. Write high-engagement posts.",
    messages: [{ role: "user", content: prompt }],
  });

  const content = (response.content[0] as any).text;
  return JSON.parse(content);
}
