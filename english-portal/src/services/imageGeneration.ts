import axios from 'axios'

/**
 * 豆包（火山引擎）图像生成 API 配置
 *
 * 使用火山方舟的文生图接口，返回图片 URL 后转换为 Base64。
 *
 * 生产部署到阿里云后，API_KEY 和 ENDPOINT_ID 通过 .env.production 注入，
 * 构建时 Vite 会将 import.meta.env.VITE_* 替换为字面量。
 * 如需更安全的方案，可将调用移到 Node.js 后端服务。
 */
const DOUBAO_CONFIG = {
  apiKey: import.meta.env.VITE_DOUBAO_API_KEY as string,
  endpointId: import.meta.env.VITE_DOUBAO_ENDPOINT_ID as string,
  baseURL: 'https://ark.cn-beijing.volces.com/api/v3/images/generations',
}

export interface GeneratedImage {
  /** Base64 编码的 PNG/JPEG 图像数据（含 data URL 前缀） */
  dataUrl: string
  /** 模型实际使用的 prompt（经过改写/增强后） */
  revisedPrompt?: string
}

/**
 * generateArchitectureImage()
 * ============================
 * 调用豆包（火山引擎）图像生成接口，返回 Base64 图像数据。
 *
 * @param term  建筑术语（如 "Flying Buttress"），将被嵌入 prompt
 * @returns     包含 dataUrl 和 revisedPrompt 的对象
 *
 * 错误处理策略：
 *  - 网络/API 错误 → 抛出 Error，调用方负责展示友好提示
 *  - 若 API 返回错误状态码 → 抛出包含错误信息的 Error
 *
 * 流程：
 *  1. 调用豆包 API 生成图片，获取图片 URL
 *  2. 下载图片并转换为 Base64 格式
 *  3. 返回 data URL 供前端直接渲染
 */
export async function generateArchitectureImage(term: string): Promise<GeneratedImage> {
  const prompt =
    `A photorealistic, high-resolution architectural photograph of "${term}". ` +
    `Shot with professional camera, natural daylight, detailed texture, ` +
    `award-winning architectural photography, 4K quality.`

  // Step 1: 调用豆包图像生成 API
  const response = await axios.post(
    DOUBAO_CONFIG.baseURL,
    {
      model: DOUBAO_CONFIG.endpointId,
      prompt,
      size: '1024x1024',
      n: 1,
    },
    {
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${DOUBAO_CONFIG.apiKey}`,
      },
    }
  )

  if (response.status !== 200) {
    const errorMsg = response.data?.error?.message || 'Image generation failed'
    throw new Error(`Doubao API Error: ${errorMsg}`)
  }

  const imageUrl = response.data.data?.[0]?.url
  if (!imageUrl) {
    throw new Error('API did not return image URL.')
  }

  // Step 2: 下载图片并转换为 Base64
  const imageResponse = await axios.get(imageUrl, { responseType: 'arraybuffer' })
  const base64 = btoa(
    new Uint8Array(imageResponse.data).reduce((data, byte) => data + String.fromCharCode(byte), '')
  )

  return {
    dataUrl: `data:image/png;base64,${base64}`,
    revisedPrompt: prompt, // 豆包 API 不返回 revised_prompt，使用原始 prompt
  }
}

