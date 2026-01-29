import OpenAI from 'openai';
import { Settings, AIResponseTask, AIResponseNote } from '../types';
import { SYSTEM_PROMPTS } from '../constants';

const createClient = (settings: Settings) => {
  return new OpenAI({
    apiKey: settings.apiKey,
    baseURL: settings.baseUrl,
    dangerouslyAllowBrowser: true 
  });
};

export const processTaskInput = async (input: string, settings: Settings): Promise<AIResponseTask> => {
  if (!settings.apiKey) throw new Error('请先在设置中配置 API Key');

  const client = createClient(settings);
  const today = new Date().toISOString().split('T')[0];
  
  const completion = await client.chat.completions.create({
    model: settings.model,
    messages: [
      { role: 'system', content: SYSTEM_PROMPTS.TASK + today },
      { role: 'user', content: input }
    ],
    response_format: { type: 'json_object' }
  });

  const content = completion.choices[0].message.content;
  if (!content) throw new Error('AI 未返回内容');
  
  return JSON.parse(content) as AIResponseTask;
};

export const processNoteInput = async (input: string, settings: Settings): Promise<AIResponseNote> => {
  if (!settings.apiKey) throw new Error('请先在设置中配置 API Key');

  const client = createClient(settings);
  
  const completion = await client.chat.completions.create({
    model: settings.model,
    messages: [
      { role: 'system', content: SYSTEM_PROMPTS.NOTE },
      { role: 'user', content: input }
    ],
    response_format: { type: 'json_object' }
  });

  const content = completion.choices[0].message.content;
  if (!content) throw new Error('AI 未返回内容');
  
  return JSON.parse(content) as AIResponseNote;
};