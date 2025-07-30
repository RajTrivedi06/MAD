interface RateLimitEntry {
  count: number;
  resetTime: number;
}

const rateLimitMap = new Map<string, RateLimitEntry>();

export function rateLimit(
  identifier: string,
  maxRequests: number = 10,
  windowMs: number = 60000
): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(identifier) || {
    count: 0,
    resetTime: now + windowMs,
  };

  // Reset if window has passed
  if (now > entry.resetTime) {
    entry.count = 0;
    entry.resetTime = now + windowMs;
  }

  // Check if limit exceeded
  if (entry.count >= maxRequests) {
    return false; // Rate limit exceeded
  }

  // Increment count
  entry.count++;
  rateLimitMap.set(identifier, entry);
  return true; // Request allowed
}

export function clearRateLimit(identifier: string): void {
  rateLimitMap.delete(identifier);
}

export function getRateLimitInfo(identifier: string): RateLimitEntry | null {
  return rateLimitMap.get(identifier) || null;
}

// Rate limit wrapper for async functions
export function withRateLimit<T extends any[], R>(
  fn: (...args: T) => Promise<R>,
  identifier: string,
  maxRequests: number = 10,
  windowMs: number = 60000
) {
  return async (...args: T): Promise<R> => {
    if (!rateLimit(identifier, maxRequests, windowMs)) {
      throw new Error("Rate limit exceeded. Please try again later.");
    }
    return fn(...args);
  };
}

// Rate limit for user-specific actions
export function getUserRateLimit(userId: string, action: string): boolean {
  return rateLimit(`${userId}:${action}`, 5, 60000); // 5 requests per minute per user per action
}

// Rate limit for IP-based actions
export function getIPRateLimit(ip: string, action: string): boolean {
  return rateLimit(`${ip}:${action}`, 20, 60000); // 20 requests per minute per IP per action
}
