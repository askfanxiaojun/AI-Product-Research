import { ApiConfig } from '../types';

const chatCompletion = async (config: ApiConfig, prompt: string): Promise<string> => {
  const baseURL = config.baseURL.replace(/\/$/, '');
  const response = await fetch(`${baseURL}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${config.apiKey}`,
    },
    body: JSON.stringify({
      model: config.model,
      messages: [{ role: 'user', content: prompt }],
      stream: false,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`API Error ${response.status}: ${errorText}`);
  }

  const data = await response.json();
  const content = data.choices?.[0]?.message?.content;
  if (!content) throw new Error('API returned empty response.');
  return content;
};

export const performGeneralSearch = async (
  productName: string,
  language: string,
  config: ApiConfig
): Promise<{ text: string; sources: string[] }> => {
  const prompt = `请对产品"${productName}"进行全面调研分析。
涵盖以下内容：核心功能、目标用户群体、主要特性与亮点、市场声誉与用户评价、整体定位。
提供详尽的产品概述，尽可能引用具体数据或事实支撑。

重要：输出必须使用 ${language}。`;

  try {
    const text = await chatCompletion(config, prompt);
    return { text, sources: [] };
  } catch (error) {
    console.error('Custom API Search Error:', error);
    throw new Error(`调研失败：${(error as Error).message}`);
  }
};

export const analyzeProvidedUrls = async (
  productName: string,
  urls: string[],
  language: string,
  config: ApiConfig
): Promise<string> => {
  if (urls.length === 0) return '';

  const urlList = urls.map((u, i) => `${i + 1}. ${u}`).join('\n');
  const prompt = `针对产品"${productName}"，用户提供了以下参考链接：
${urlList}

请根据这些链接的域名、路径及已知信息，分析这些页面可能涉及的内容，并提取可能的定价、技术规格、差异化卖点或用户反馈等关键细节。
如无法访问具体页面，请基于对这些来源的了解给出推断性分析，并注明是推断。

重要：输出必须使用 ${language}。`;

  try {
    return await chatCompletion(config, prompt);
  } catch (error) {
    console.error('Custom API URL Analysis Error:', error);
    throw new Error(`URL 分析失败：${(error as Error).message}`);
  }
};

export const generateFinalReport = async (
  productName: string,
  searchData: string,
  urlData: string,
  language: string,
  config: ApiConfig
): Promise<string> => {
  const prompt = `你是一位资深产品研究员。请为产品"${productName}"撰写一份完整的产品调研报告。

请综合以下情报：

--- 来源 1：综合调研 ---
${searchData}

--- 来源 2：参考链接分析 ---
${urlData || '用户未提供具体链接。'}

--- 要求 ---
用 Markdown 格式撰写专业报告，报告必须使用 ${language}。

报告须包含以下章节（标题翻译为 ${language}）：
1. 执行摘要：产品概览
2. 核心功能：产品实际用途
3. 主要特性：功能亮点列表
4. 市场分析：竞品、定位及市场反应
5. 链接洞察：从参考链接提取的具体细节
6. 结论：综合评价

使用加粗、列表、标题使报告清晰易读。不要包含推理过程，只输出最终报告。`;

  try {
    return await chatCompletion(config, prompt);
  } catch (error) {
    console.error('Custom API Report Error:', error);
    throw new Error(`报告生成失败：${(error as Error).message}`);
  }
};
