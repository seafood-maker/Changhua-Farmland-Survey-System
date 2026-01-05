
import { GoogleGenAI } from "@google/genai";

export const analyzeCropImage = async (base64Image: string, cropType: string) => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  const prompt = `你是一位專業的農業專家。請分析這張${cropType || '作物'}的照片。
  1. 辨識照片中的作物狀態。
  2. 檢查是否有病蟲害或缺水的跡象。
  3. 提供 3-5 句專業的現勘建議。
  請用繁體中文回答，語氣要專業且易懂。`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: {
        parts: [
          { inlineData: { mimeType: 'image/jpeg', data: base64Image.split(',')[1] } },
          { text: prompt }
        ]
      }
    });

    return response.text;
  } catch (error) {
    console.error("AI Analysis failed:", error);
    return "無法完成 AI 分析，請手動輸入觀察結果。";
  }
};
