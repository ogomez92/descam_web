export interface OpenAIError {
  message: string;
  type?: string;
  code?: string;
}

export interface ImageDescriptionResult {
  description: string;
  error?: OpenAIError;
}

/**
 * Describes an image using OpenAI's GPT-4 Vision API
 * @param apiKey - The OpenAI API key
 * @param imageDataUrl - The image data URL (base64)
 * @param prompt - The prompt to use for image description
 * @returns The description or error
 */
export async function describeImage(
  apiKey: string,
  imageDataUrl: string,
  prompt: string
): Promise<ImageDescriptionResult> {
  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: prompt,
              },
              {
                type: 'image_url',
                image_url: {
                  url: imageDataUrl,
                },
              },
            ],
          },
        ],
        max_tokens: 500,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const errorMessage =
        errorData.error?.message || `HTTP error! status: ${response.status}`;
      return {
        description: '',
        error: {
          message: errorMessage,
          type: errorData.error?.type,
          code: errorData.error?.code,
        },
      };
    }

    const data = await response.json();
    const description = data.choices?.[0]?.message?.content || 'No description available.';

    return { description };
  } catch (error) {
    return {
      description: '',
      error: {
        message: error instanceof Error ? error.message : 'Unknown error occurred',
      },
    };
  }
}
