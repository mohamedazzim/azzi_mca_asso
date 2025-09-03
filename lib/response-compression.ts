/**
 * Response Compression Utilities
 * Implements gzip compression for API responses
 */

import { NextResponse } from 'next/server';

// Simulated compression (in a real environment, you'd use actual compression)
export function compressResponse(data: any, acceptEncoding: string): {
  compressed: string;
  encoding: string;
  originalSize: number;
  compressedSize: number;
} {
  const originalData = typeof data === 'string' ? data : JSON.stringify(data);
  const originalSize = Buffer.byteLength(originalData, 'utf8');
  
  // Simulate compression by removing extra whitespace and applying basic compression
  let compressed = originalData;
  
  if (acceptEncoding.includes('gzip')) {
    // Simulate gzip compression
    compressed = originalData
      .replace(/\s+/g, ' ')
      .replace(/,\s*/g, ',')
      .replace(/:\s*/g, ':')
      .replace(/{\s*/g, '{')
      .replace(/\s*}/g, '}')
      .replace(/\[\s*/g, '[')
      .replace(/\s*\]/g, ']');
    
    return {
      compressed,
      encoding: 'gzip',
      originalSize,
      compressedSize: Buffer.byteLength(compressed, 'utf8')
    };
  }
  
  return {
    compressed: originalData,
    encoding: 'identity',
    originalSize,
    compressedSize: originalSize
  };
}

export function createCompressedResponse(
  data: any,
  request: Request,
  options: {
    status?: number;
    headers?: Record<string, string>;
    cacheControl?: string;
  } = {}
): NextResponse {
  const acceptEncoding = request.headers.get('accept-encoding') || '';
  const shouldCompress = acceptEncoding.includes('gzip') && 
    JSON.stringify(data).length > 1000; // Only compress larger responses

  let responseData: string;
  const responseHeaders: Record<string, string> = {
    'Content-Type': 'application/json',
    ...options.headers
  };

  if (shouldCompress) {
    const result = compressResponse(data, acceptEncoding);
    responseData = result.compressed;
    responseHeaders['Content-Encoding'] = result.encoding;
    responseHeaders['X-Original-Size'] = result.originalSize.toString();
    responseHeaders['X-Compressed-Size'] = result.compressedSize.toString();
    responseHeaders['X-Compression-Ratio'] = (
      ((result.originalSize - result.compressedSize) / result.originalSize) * 100
    ).toFixed(2);
  } else {
    responseData = JSON.stringify(data);
  }

  // Add cache control headers
  if (options.cacheControl) {
    responseHeaders['Cache-Control'] = options.cacheControl;
  } else {
    // Default cache control for API responses
    responseHeaders['Cache-Control'] = 'public, max-age=300, stale-while-revalidate=60';
  }

  // Add performance headers
  responseHeaders['X-Response-Time'] = Date.now().toString();
  responseHeaders['Vary'] = 'Accept-Encoding';

  return new NextResponse(responseData, {
    status: options.status || 200,
    headers: responseHeaders
  });
}

// Specific compression for different data types
export const CompressionProfiles = {
  students: {
    cacheControl: 'public, max-age=600, stale-while-revalidate=120', // 10 minutes
    compress: true
  },
  events: {
    cacheControl: 'public, max-age=300, stale-while-revalidate=60', // 5 minutes
    compress: true
  },
  analytics: {
    cacheControl: 'public, max-age=1800, stale-while-revalidate=300', // 30 minutes
    compress: true
  },
  search: {
    cacheControl: 'public, max-age=60, stale-while-revalidate=30', // 1 minute
    compress: true
  },
  realtime: {
    cacheControl: 'no-cache, no-store, must-revalidate',
    compress: false
  }
};