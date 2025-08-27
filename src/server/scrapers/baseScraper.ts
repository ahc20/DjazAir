import { ScrapingConfig, ScrapingResult, FlightSearchParams } from './types';
import { sleep, generateRandomDelay } from '@/lib/scrapingUtils';

export abstract class BaseScraper {
  protected config: ScrapingConfig;
  public name: string;
  public baseUrl: string;

  constructor(name: string, baseUrl: string, config?: Partial<ScrapingConfig>) {
    this.name = name;
    this.baseUrl = baseUrl;
    this.config = {
      userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      timeout: 30000,
      retries: 3,
      delay: 1000,
      maxConcurrent: 2,
      ...config
    };
  }

  protected async makeRequest(url: string, options: RequestInit = {}): Promise<Response> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.config.timeout);

    try {
      const response = await fetch(url, {
        ...options,
        headers: {
          'User-Agent': this.config.userAgent,
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
          'Accept-Language': 'fr-FR,fr;q=0.9,en;q=0.8',
          'Accept-Encoding': 'gzip, deflate, br',
          'DNT': '1',
          'Connection': 'keep-alive',
          'Upgrade-Insecure-Requests': '1',
          'Sec-Fetch-Dest': 'document',
          'Sec-Fetch-Mode': 'navigate',
          'Sec-Fetch-Site': 'none',
          'Cache-Control': 'max-age=0',
          ...options.headers
        },
        signal: controller.signal
      });

      clearTimeout(timeoutId);
      return response;
    } catch (error) {
      clearTimeout(timeoutId);
      throw error;
    }
  }

  protected async retryWithBackoff<T>(
    operation: () => Promise<T>,
    maxRetries: number = this.config.retries
  ): Promise<T> {
    let lastError: Error;
    
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error as Error;
        
        if (attempt === maxRetries) {
          break;
        }

        const delay = Math.pow(2, attempt) * this.config.delay + generateRandomDelay(100, 500);
        console.log(`Tentative ${attempt + 1} échouée pour ${this.name}, nouvelle tentative dans ${delay}ms`);
        await sleep(delay);
      }
    }

    throw lastError!;
  }

  protected async scrapeWithRateLimit<T>(
    operations: (() => Promise<T>)[],
    maxConcurrent: number = this.config.maxConcurrent
  ): Promise<T[]> {
    const results: T[] = [];
    const chunks = this.chunkArray(operations, maxConcurrent);

    for (const chunk of chunks) {
      const chunkResults = await Promise.allSettled(chunk.map(op => op()));
      
      for (const result of chunkResults) {
        if (result.status === 'fulfilled') {
          results.push(result.value);
        } else {
          console.error(`Erreur dans le chunk: ${result.reason}`);
        }
      }

      if (chunks.indexOf(chunk) < chunks.length - 1) {
        await sleep(this.config.delay);
      }
    }

    return results;
  }

  private chunkArray<T>(array: T[], size: number): T[][] {
    const chunks: T[][] = [];
    for (let i = 0; i < array.length; i += size) {
      chunks.push(array.slice(i, i + size));
    }
    return chunks;
  }

  protected createErrorResult(error: string): ScrapingResult {
    return {
      success: false,
      error,
      provider: this.name,
      timestamp: new Date()
    };
  }

  protected createSuccessResult(data: any[]): ScrapingResult {
    return {
      success: true,
      data,
      provider: this.name,
      timestamp: new Date()
    };
  }

  protected async waitForElement(page: any, selector: string, timeout: number = 10000): Promise<any> {
    const startTime = Date.now();
    
    while (Date.now() - startTime < timeout) {
      const element = await page.$(selector);
      if (element) return element;
      await sleep(100);
    }
    
    throw new Error(`Élément ${selector} non trouvé dans le délai imparti`);
  }

  protected async extractText(page: any, selector: string): Promise<string> {
    try {
      const element = await page.$(selector);
      if (!element) return '';
      return await element.evaluate((el: any) => el.textContent?.trim() || '');
    } catch {
      return '';
    }
  }

  protected async extractAttribute(page: any, selector: string, attribute: string): Promise<string> {
    try {
      const element = await page.$(selector);
      if (!element) return '';
      return await element.evaluate((el: any, attr: string) => el.getAttribute(attr) || '', attribute);
    } catch {
      return '';
    }
  }

  protected parsePrice(priceText: string): { amount: number; currency: string } {
    const priceMatch = priceText.match(/(\d+(?:[.,]\d{2})?)\s*([A-Z]{3})/);
    if (priceMatch) {
      return {
        amount: parseFloat(priceMatch[1].replace(',', '.')),
        currency: priceMatch[2]
      };
    }
    
    // Fallback pour différents formats
    const numberMatch = priceText.match(/(\d+(?:[.,]\d{2})?)/);
    if (numberMatch) {
      return {
        amount: parseFloat(numberMatch[1].replace(',', '.')),
        currency: 'EUR' // Par défaut
      };
    }
    
    return { amount: 0, currency: 'EUR' };
  }

  protected parseDuration(durationText: string): string {
    // Normalise les formats de durée
    const cleanDuration = durationText.replace(/\s+/g, ' ').trim();
    return cleanDuration;
  }

  protected parseDateTime(dateText: string, timeText: string): string {
    // Combine date et heure en format ISO
    try {
      const [day, month, year] = dateText.split('/');
      const [hour, minute] = timeText.split(':');
      return new Date(parseInt(year), parseInt(month) - 1, parseInt(day), parseInt(hour), parseInt(minute)).toISOString();
    } catch {
      return new Date().toISOString();
    }
  }
}
