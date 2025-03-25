# Server-Side PDF Proxy Solution

## Overview

We've implemented a robust solution for loading PDFs from external sources (especially arXiv) by using a server-side proxy approach. This approach completely avoids CORS issues because the PDFs are served from your own domain rather than directly from arXiv or other external sources.

## How It Works

1. **Client-Side Request**: 
   - Instead of trying to load PDFs directly from arXiv, the client requests a proxied URL from the server
   - This is handled by the `getServerProxyPdfUrl` method in `papersAPI.ts`

2. **Server-Side Proxy**:
   - The server fetches the PDF from the external source
   - It stores the PDF on your server (or cloud storage)
   - It returns a URL to your own hosted copy of the PDF

3. **Client-Side Rendering**:
   - The client loads the PDF from your server, avoiding CORS issues
   - Since the PDF is served from your domain, no CORS issues will occur

## Implementation Steps

### 1. Backend Implementation

1. Create a new endpoint in your backend API:
   - Route: `POST /papers/proxy-pdf`
   - Request body: `{ url: string, paper_id?: string }`
   - Response: `{ url: string }`

2. The endpoint should:
   - Validate the incoming URL
   - Create a unique filename (using the paper_id if provided)
   - Check if the file already exists
   - If not, fetch the PDF from the external source
   - Store the PDF in your file system or cloud storage
   - Return a URL to your hosted copy of the PDF

3. Set up a static file server to serve the stored PDFs:
   - Express.js: `app.use('/pdfs', express.static(path.join(__dirname, '../uploads/pdfs')));`
   - FastAPI: `app.mount("/pdfs", StaticFiles(directory="uploads/pdfs"), name="pdfs")`

### 2. Frontend Implementation (Already Done)

We've already implemented the frontend part:

1. Added a `getServerProxyPdfUrl` method to `papersAPI.ts`
2. Updated the PDF loading process in `EnhancedPdfHighlighter.tsx` to use this method
3. Implemented error handling and multiple fallbacks
4. Added temporary client-side fallbacks until the server-side proxy is implemented

## Benefits

1. **No CORS Issues**: Since PDFs are served from your domain, no CORS issues will occur
2. **Better Performance**: PDFs are cached on your server, so subsequent requests are faster
3. **Better Reliability**: No dependency on external CORS proxies that may be rate-limited or unreliable
4. **Better User Experience**: Faster loading, fewer errors, and consistent behavior

## Example Implementations

See the accompanying `pdf-proxy-endpoint.js` file for example implementations:
- Express.js implementation
- FastAPI (Python) implementation

## Current Status

The frontend is ready and will use the server-side proxy when implemented. Until then, it will use a client-side fallback approach for backward compatibility.

To enable the full server-side implementation:
1. Implement the `/papers/proxy-pdf` endpoint in your backend
2. Set `isServerEndpointImplemented = true` in the `getServerProxyPdfUrl` method in `papersAPI.ts`

## Testing

Once implemented, you can test the solution by:
1. Uploading or opening a paper with an arXiv URL
2. Checking if the PDF loads correctly
3. Examining the network requests to confirm the PDF is loaded from your domain 