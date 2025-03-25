/**
 * PDF Proxy Endpoint Example
 * 
 * This file demonstrates how to implement a server-side proxy for PDFs
 * to avoid CORS issues when loading PDFs from external sources.
 * 
 * You can adapt this to your backend framework (Express, FastAPI, etc.)
 */

// Express.js example
// const express = require('express');
// const axios = require('axios');
// const { v4: uuidv4 } = require('uuid');
// const fs = require('fs');
// const path = require('path');
// const router = express.Router();

/**
 * PDF Proxy Endpoint
 * 
 * This endpoint fetches a PDF from an external source and serves it from your domain,
 * avoiding CORS issues completely.
 * 
 * Two implementation approaches:
 * 1. Stream approach: Fetch and stream the PDF directly to the client (no storage needed)
 * 2. Store-and-serve approach: Fetch, store on your server, and serve the stored version
 * 
 * The second approach is better for performance and reliability, especially with arXiv PDFs.
 */

// Example using Express.js and the store-and-serve approach:

/**
 * @route POST /api/papers/proxy-pdf
 * @description Proxy a PDF from an external source
 * @access Private (requires authentication)
 * @body {url: string, paper_id?: string}
 * @returns {url: string} - URL to the proxied PDF
 */
/* 
router.post('/proxy-pdf', async (req, res) => {
  try {
    const { url, paper_id } = req.body;
    
    if (!url) {
      return res.status(400).json({ error: 'URL is required' });
    }
    
    // Validate URL
    try {
      new URL(url);
    } catch (e) {
      return res.status(400).json({ error: 'Invalid URL' });
    }
    
    // Create a unique filename for the PDF
    const filename = paper_id ? 
      `${paper_id}.pdf` : 
      `${uuidv4()}.pdf`;
    
    // Define path where the PDF will be stored
    const pdfPath = path.join(__dirname, '../uploads/pdfs', filename);
    const pdfPublicUrl = `${process.env.API_URL}/pdfs/${filename}`;
    
    // Check if the file already exists
    if (fs.existsSync(pdfPath)) {
      console.log(`PDF already proxied: ${filename}`);
      return res.json({ url: pdfPublicUrl });
    }
    
    // Fetch the PDF
    console.log(`Fetching PDF from: ${url}`);
    const response = await axios({
      method: 'get',
      url: url,
      responseType: 'stream',
      headers: {
        // Some PDFs require a User-Agent
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        // For arXiv specifically
        'Accept': 'application/pdf'
      },
      // Longer timeout for large PDFs
      timeout: 30000
    });
    
    // Ensure the directory exists
    const dir = path.dirname(pdfPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    
    // Stream the PDF to a file
    const writer = fs.createWriteStream(pdfPath);
    response.data.pipe(writer);
    
    // Return a promise that resolves when the file is written
    await new Promise((resolve, reject) => {
      writer.on('finish', resolve);
      writer.on('error', reject);
    });
    
    console.log(`PDF proxied successfully: ${filename}`);
    
    // Return the URL to the proxied PDF
    return res.json({ url: pdfPublicUrl });
  } catch (error) {
    console.error('Error proxying PDF:', error);
    return res.status(500).json({ error: 'Failed to proxy PDF' });
  }
});
*/

// Example using FastAPI and Python

/**
 * FastAPI Python Example
 * 
 * from fastapi import FastAPI, HTTPException, Depends, Body
 * from pydantic import BaseModel, HttpUrl
 * import httpx
 * import uuid
 * import os
 * from typing import Optional
 * 
 * app = FastAPI()
 * 
 * class ProxyPdfRequest(BaseModel):
 *     url: HttpUrl
 *     paper_id: Optional[str] = None
 * 
 * class ProxyPdfResponse(BaseModel):
 *     url: str
 * 
 * @app.post("/api/papers/proxy-pdf", response_model=ProxyPdfResponse)
 * async def proxy_pdf(request: ProxyPdfRequest):
 *     try:
 *         # Create a unique filename for the PDF
 *         filename = f"{request.paper_id}.pdf" if request.paper_id else f"{uuid.uuid4()}.pdf"
 *         
 *         # Define path where the PDF will be stored
 *         pdf_dir = os.path.join("uploads", "pdfs")
 *         os.makedirs(pdf_dir, exist_ok=True)
 *         pdf_path = os.path.join(pdf_dir, filename)
 *         pdf_public_url = f"{os.getenv('API_URL')}/pdfs/{filename}"
 *         
 *         # Check if the file already exists
 *         if os.path.exists(pdf_path):
 *             print(f"PDF already proxied: {filename}")
 *             return {"url": pdf_public_url}
 *         
 *         # Fetch the PDF
 *         print(f"Fetching PDF from: {request.url}")
 *         async with httpx.AsyncClient() as client:
 *             response = await client.get(
 *                 str(request.url),
 *                 headers={
 *                     "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
 *                     "Accept": "application/pdf"
 *                 },
 *                 timeout=30.0
 *             )
 *             
 *             response.raise_for_status()
 *             
 *             # Save the PDF
 *             with open(pdf_path, "wb") as f:
 *                 f.write(response.content)
 *             
 *         print(f"PDF proxied successfully: {filename}")
 *         
 *         # Return the URL to the proxied PDF
 *         return {"url": pdf_public_url}
 *     except Exception as e:
 *         print(f"Error proxying PDF: {e}")
 *         raise HTTPException(status_code=500, detail=f"Failed to proxy PDF: {str(e)}")
 */

// Serving Static PDFs
// To serve the downloaded PDFs, you need to set up a static file server:

// Express.js example:
// app.use('/pdfs', express.static(path.join(__dirname, '../uploads/pdfs')));

// FastAPI example:
// from fastapi.staticfiles import StaticFiles
// app.mount("/pdfs", StaticFiles(directory="uploads/pdfs"), name="pdfs")

module.exports = {
  // This is just a placeholder - implement the actual proxy endpoint in your backend
  proxyPdfDescription: "PDF Proxy Endpoint implementation guide"
}; 