/**
 * Utility for caching PDFs using IndexedDB
 */

interface CacheEntry {
  paperId: string;
  contentType: 'url' | 'file';
  content: string; // URL string or filename for File blobs
  lastAccessed: number;
  createdAt: number;
}

// IndexedDB database name and store names
const DB_NAME = 'papermastery_cache';
const PDF_STORE = 'pdf_cache';
const PDF_BLOB_STORE = 'pdf_blobs'; // For storing actual file blobs

// Cache expiration time (7 days)
const CACHE_EXPIRATION = 7 * 24 * 60 * 60 * 1000;

// Open the IndexedDB database
async function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1);
    
    request.onerror = () => reject(new Error('Failed to open cache database'));
    
    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      
      // Create store for cache metadata
      if (!db.objectStoreNames.contains(PDF_STORE)) {
        const store = db.createObjectStore(PDF_STORE, { keyPath: 'paperId' });
        store.createIndex('lastAccessed', 'lastAccessed', { unique: false });
        store.createIndex('createdAt', 'createdAt', { unique: false });
      }
      
      // Create store for PDF blob data
      if (!db.objectStoreNames.contains(PDF_BLOB_STORE)) {
        db.createObjectStore(PDF_BLOB_STORE, { keyPath: 'filename' });
      }
    };
    
    request.onsuccess = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      resolve(db);
    };
  });
}

/**
 * Cache a PDF file or URL
 * @param paperId - The paper ID to associate with the cached content
 * @param contentType - Whether the content is a URL or file
 * @param content - For URLs: the URL string, for files: the File object
 */
export async function cachePdf(paperId: string, contentType: 'url' | 'file', content: string | File): Promise<void> {
  try {
    const db = await openDatabase();
    const transaction = db.transaction([PDF_STORE, PDF_BLOB_STORE], 'readwrite');
    const store = transaction.objectStore(PDF_STORE);
    const blobStore = transaction.objectStore(PDF_BLOB_STORE);
    
    const now = Date.now();
    
    // Process URL content if needed
    let processedContent = content;
    if (contentType === 'url' && typeof content === 'string') {
      // Convert arXiv abstract URLs to PDF URLs
      if (content.includes('arxiv.org/abs/')) {
        const arxivId = content.split('arxiv.org/abs/')[1].split(/[?#]/)[0];
        processedContent = `https://arxiv.org/pdf/${arxivId}.pdf`;
        console.log('Normalized arXiv abstract URL for caching:', processedContent);
      }
      
      // Store relative URLs as-is - they will be converted to absolute when needed
      // This is important for server-proxy URLs
    }
    
    // Prepare cache entry
    const cacheEntry: CacheEntry = {
      paperId,
      contentType,
      content: typeof processedContent === 'string' ? processedContent : processedContent.name,
      lastAccessed: now,
      createdAt: now
    };
    
    // If content is a File, store its blob in the blob store
    if (typeof processedContent !== 'string') {
      const filename = `${paperId}_${processedContent.name}`;
      cacheEntry.content = filename;
      
      blobStore.put({
        filename,
        blob: processedContent
      });
    }
    
    // Store cache entry metadata
    store.put(cacheEntry);
    
    // Clean up old cache entries
    cleanupCache().catch(console.error);
    
    return new Promise((resolve, reject) => {
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(new Error('Failed to cache PDF'));
    });
  } catch (error) {
    console.error('Error caching PDF:', error);
    throw error;
  }
}

/**
 * Retrieve a cached PDF
 * @param paperId - The paper ID to retrieve
 * @returns An object with the content type and content, or null if not found
 */
export async function getCachedPdf(paperId: string): Promise<{ contentType: 'url' | 'file'; content: string | File } | null> {
  try {
    const db = await openDatabase();
    const transaction = db.transaction([PDF_STORE, PDF_BLOB_STORE], 'readwrite');
    const store = transaction.objectStore(PDF_STORE);
    const blobStore = transaction.objectStore(PDF_BLOB_STORE);
    
    // Get cache entry
    const request = store.get(paperId);
    
    const result = await new Promise<CacheEntry | undefined>((resolve, reject) => {
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(new Error('Failed to retrieve from cache'));
    });
    
    if (!result) {
      return null;
    }
    
    // Update last accessed timestamp
    result.lastAccessed = Date.now();
    store.put(result);
    
    // If it's a file, retrieve the blob
    if (result.contentType === 'file') {
      const blobRequest = blobStore.get(result.content);
      
      const blobResult = await new Promise<{ filename: string; blob: File } | undefined>((resolve, reject) => {
        blobRequest.onsuccess = () => resolve(blobRequest.result);
        blobRequest.onerror = () => reject(new Error('Failed to retrieve PDF blob'));
      });
      
      if (!blobResult) {
        return null;
      }
      
      return {
        contentType: 'file',
        content: blobResult.blob
      };
    }
    
    // If it's a URL, just return the string
    return {
      contentType: 'url',
      content: result.content
    };
  } catch (error) {
    console.error('Error retrieving cached PDF:', error);
    return null;
  }
}

/**
 * Clear a specific PDF from the cache
 * @param paperId - The paper ID to clear
 */
export async function clearCachedPdf(paperId: string): Promise<void> {
  try {
    const db = await openDatabase();
    const transaction = db.transaction([PDF_STORE, PDF_BLOB_STORE], 'readwrite');
    const store = transaction.objectStore(PDF_STORE);
    const blobStore = transaction.objectStore(PDF_BLOB_STORE);
    
    // Get the cache entry to find associated blob if needed
    const request = store.get(paperId);
    
    request.onsuccess = () => {
      const entry = request.result as CacheEntry | undefined;
      
      if (entry) {
        // If it's a file, delete the blob too
        if (entry.contentType === 'file') {
          blobStore.delete(entry.content);
        }
        
        // Delete the cache entry
        store.delete(paperId);
      }
    };
    
    return new Promise((resolve, reject) => {
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(new Error('Failed to clear cached PDF'));
    });
  } catch (error) {
    console.error('Error clearing cached PDF:', error);
    throw error;
  }
}

/**
 * Clean up old cache entries (older than CACHE_EXPIRATION)
 */
async function cleanupCache(): Promise<void> {
  try {
    const db = await openDatabase();
    const transaction = db.transaction([PDF_STORE, PDF_BLOB_STORE], 'readwrite');
    const store = transaction.objectStore(PDF_STORE);
    const blobStore = transaction.objectStore(PDF_BLOB_STORE);
    
    const now = Date.now();
    const expirationThreshold = now - CACHE_EXPIRATION;
    
    const index = store.index('lastAccessed');
    const range = IDBKeyRange.upperBound(expirationThreshold);
    
    const request = index.openCursor(range);
    
    request.onsuccess = (event) => {
      const cursor = (event.target as IDBRequest).result as IDBCursorWithValue | null;
      
      if (cursor) {
        const entry = cursor.value as CacheEntry;
        
        // If it's a file, delete the blob too
        if (entry.contentType === 'file') {
          blobStore.delete(entry.content);
        }
        
        // Delete the cache entry
        store.delete(entry.paperId);
        
        cursor.continue();
      }
    };
    
    return new Promise((resolve, reject) => {
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(new Error('Failed to clean up cache'));
    });
  } catch (error) {
    console.error('Error cleaning up cache:', error);
    throw error;
  }
} 