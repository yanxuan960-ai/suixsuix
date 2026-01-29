import { Settings } from './types';

// Try to get API key from Vite environment variables (created in .env file)
const ENV_API_KEY = (import.meta as any).env?.VITE_DASHSCOPE_API_KEY || '';

export const DEFAULT_SETTINGS: Settings = {
  apiKey: ENV_API_KEY,
  baseUrl: 'https://dashscope.aliyuncs.com/compatible-mode/v1',
  model: 'qwen-plus',
};

export const STORAGE_KEYS = {
  TASKS: 'sxj_tasks',
  NOTES: 'sxj_notes',
  SETTINGS: 'sxj_settings',
};

export const SYSTEM_PROMPTS = {
  TASK: `你是一个日程提取助手。
  
  请基于文末提供的【当前基准日期】(Reference Date) 来计算任务的具体日期。
  
  提取规则：
  1. **Task**: 提取核心事项，去除"帮我记"、"打算"等冗余词。
  2. **Date**: 必须基于【当前基准日期】进行推算。
     - "明天" = 基准日期 + 1天
     - "后天" = 基准日期 + 2天
     - "周五" = 基准日期之后的最近一个周五
     - 若未提及日期，默认为【当前基准日期】。
     - 格式: YYYY-MM-DD
  3. **Time**: 提取具体时刻 (HH:mm)。
     - "下午3点" -> "15:00"
     - 若只有模糊时间词(如"下午")，Time字段留空，并将"下午"保留在 Task 内容中。
  4. **Location**: 提取地点信息。若文中包含地点（如“在会议室”、“去上海”），提取该地点；否则留空。

  返回 JSON: { "task": "string", "date": "string", "time": "string", "location": "string" }
  
  【当前基准日期】: `,
  
  NOTE: `你是一个专业的口播文案编辑。用户的输入是一段口语化的灵感或日记。
  请完成两件事：
  1. 将内容改写为一段通顺、口语化、适合朗读的口播文案，自动分段排版。
  2. 提炼一个简短吸引人的标题。
  返回 JSON 格式：{ "title": "标题", "content": "改写后的正文" }。`
};