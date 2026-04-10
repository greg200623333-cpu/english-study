import 'server-only'
import axios from 'axios'

export interface GeneratedImage {
  dataUrl: string
}

const MAX_IMAGE_BYTES = 8 * 1024 * 1024 // 8 MB hard limit

export async function generateArchitectureImage(term: string): Promise<GeneratedImage> {
  const apiKey = process.env.DOUBAO_API_KEY
  const endpointId = process.env.DOUBAO_ENDPOINT_ID

  if (!apiKey || !endpointId) {
    throw new Error('Doubao API credentials are not configured.')
  }

  const prompt = `A photorealistic architectural photograph showcasing "${term}".
High-resolution professional architecture photography, dramatic lighting,
detailed structural elements visible, award-winning composition.`

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

  const imageUrl: string = response.data?.data?.[0]?.url
  if (!imageUrl) {
    throw new Error('No image URL returned from Doubao API.')
  }

  const imgResponse = await axios.get(imageUrl, {
    responseType: 'arraybuffer',
    timeout: 30000,
    maxContentLength: MAX_IMAGE_BYTES,
    maxBodyLength: MAX_IMAGE_BYTES,
  })

  const base64 = Buffer.from(imgResponse.data as ArrayBuffer).toString('base64')
  const contentType: string = (imgResponse.headers['content-type'] as string) || 'image/png'

  return { dataUrl: `data:${contentType};base64,${base64}` }
}
