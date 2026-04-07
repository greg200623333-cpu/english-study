import axios from 'axios'

export interface GeneratedImage {
  dataUrl: string
}

export async function generateArchitectureImage(term: string): Promise<GeneratedImage> {
  const apiKey = process.env.DOUBAO_API_KEY
  const endpointId = process.env.DOUBAO_ENDPOINT_ID

  if (!apiKey || !endpointId) {
    throw new Error('Doubao API credentials are not configured.')
  }

  const prompt = `A photorealistic architectural photograph showcasing "${term}".
High-resolution professional architecture photography, dramatic lighting,
detailed structural elements visible, award-winning composition.`

  try {
    const response = await axios.post(
      'https://ark.cn-beijing.volces.com/api/v3/images/generations',
      {
        model: endpointId,
        prompt,
        sequential_image_generation: 'disabled',
        response_format: 'url',
        size: '2K',
        stream: false,
        watermark: true,
      },
      {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
        },
        timeout: 60000,
      }
    )

    // 打印响应以便调试
    console.log('Doubao API Response:', JSON.stringify(response.data, null, 2))

    // images/generations 接口返回格式: { data: [{ url: "..." }] }
    const imageUrl: string = response.data?.data?.[0]?.url
    if (!imageUrl) {
      throw new Error('No image URL returned from Doubao API.')
    }

    // Download image and convert to base64 data URL
    const imgResponse = await axios.get(imageUrl, {
      responseType: 'arraybuffer',
      timeout: 30000,
    })

    const base64 = Buffer.from(imgResponse.data).toString('base64')
    const contentType: string = imgResponse.headers['content-type'] || 'image/png'

    return { dataUrl: `data:${contentType};base64,${base64}` }
  } catch (error) {
    if (axios.isAxiosError(error)) {
      console.error('Doubao API Error:', {
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        headers: error.response?.headers,
      })
      throw new Error(
        `Doubao API request failed: ${error.response?.status} - ${JSON.stringify(error.response?.data)}`
      )
    }
    throw error
  }
}
