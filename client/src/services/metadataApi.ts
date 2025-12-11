import { postJson } from './emailApi';

export interface ModelMetadata {
  name: string;
  image: string;
  images?: string[];
  description?: string;
  age?: number | null;
  country?: string | null;
  height?: string | null;
  weight?: string | null;
  measurements?: string | null;
  bio?: string | null;
  aliases?: string[];
  tags?: string[];
  socialLinks?: Record<string, string>;
}

export interface ScrapeModelMetadataResponse {
  success: boolean;
  metadata?: ModelMetadata;
  message?: string;
}

/**
 * Scrape metadata for a model name
 * Fetches model information from external sources
 */
export const scrapeModelMetadata = async (modelName: string): Promise<ModelMetadata> => {
  try {
    const response = await postJson<{ modelName: string }, ScrapeModelMetadataResponse>(
      '/api/metadata/scrape-model',
      { modelName }
    );

    if (!response.success || !response.metadata) {
      throw new Error(response.message || 'Failed to fetch model metadata');
    }

    return response.metadata;
  } catch (error) {
    console.error('Failed to scrape model metadata:', error);
    throw error;
  }
};

export const metadataApi = {
  scrapeModelMetadata,
};




