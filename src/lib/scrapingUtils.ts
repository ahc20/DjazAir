export const sleep = (ms: number): Promise<void> => {
  return new Promise(resolve => setTimeout(resolve, ms));
};

export const generateRandomDelay = (min: number, max: number): number => {
  return Math.floor(Math.random() * (max - min + 1)) + min;
};

export const sanitizeText = (text: string): string => {
  return text
    .replace(/\s+/g, ' ')
    .replace(/[^\w\s\-.,€$£¥]/g, '')
    .trim();
};

export const extractNumber = (text: string): number | null => {
  const match = text.match(/(\d+(?:[.,]\d{2})?)/);
  return match ? parseFloat(match[1].replace(',', '.')) : null;
};

export const extractCurrency = (text: string): string => {
  const currencyMatch = text.match(/([A-Z]{3})/);
  if (currencyMatch) return currencyMatch[1];
  
  // Détection par symbole
  if (text.includes('€')) return 'EUR';
  if (text.includes('$')) return 'USD';
  if (text.includes('£')) return 'GBP';
  if (text.includes('¥')) return 'JPY';
  
  return 'EUR'; // Par défaut
};

export const parseDuration = (durationText: string): number => {
  // Convertit "2h 30m" en minutes
  const hours = durationText.match(/(\d+)h/);
  const minutes = durationText.match(/(\d+)m/);
  
  const h = hours ? parseInt(hours[1]) : 0;
  const m = minutes ? parseInt(minutes[1]) : 0;
  
  return h * 60 + m;
};

export const formatDuration = (minutes: number): string => {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${h}h ${m}m`;
};

export const retryOperation = async <T>(
  operation: () => Promise<T>,
  maxRetries: number = 3,
  delay: number = 1000
): Promise<T> => {
  let lastError: Error;
  
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error as Error;
      
      if (attempt === maxRetries) {
        break;
      }
      
      await sleep(delay * Math.pow(2, attempt));
    }
  }
  
  throw lastError!;
};

export const chunkArray = <T>(array: T[], size: number): T[][] => {
  const chunks: T[][] = [];
  for (let i = 0; i < array.length; i += size) {
    chunks.push(array.slice(i, i + size));
  }
  return chunks;
};

export const isValidAirportCode = (code: string): boolean => {
  return /^[A-Z]{3}$/.test(code);
};

export const normalizeAirportCode = (code: string): string => {
  return code.toUpperCase().trim();
};

export const createUserAgent = (): string => {
  const userAgents = [
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.1 Safari/605.1.15'
  ];
  
  return userAgents[Math.floor(Math.random() * userAgents.length)];
};
