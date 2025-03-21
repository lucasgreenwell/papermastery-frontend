# PDF Highlighter: Frontend-Backend Integration Summary

## Component Overview
The PDF Highlighter component enables users to view PDF documents, highlight text sections, and request AI-powered summaries or explanations of the highlighted text. The component uses `react-pdf-highlighter-extended` but requires custom implementations for certain UI elements.

## API Endpoints & Data Flow

### 1. PDF Document Retrieval
- **Source:** PaperDetails component determines PDF source
- **URL Priority:**
  1. Supabase storage URL (preferred to avoid CORS)
  2. ArXiv or other external sources (fallback)
- **Implementation:** 
  ```typescript
  // In PaperDetails.tsx
  const pdfSource = useMemo(() => {
    // Priority 1: Use cached content if available
    if (cachedContent?.pdfUrl) {
      console.log("Using cached PDF URL:", cachedContent.pdfUrl);
      return cachedContent.pdfUrl;
    }
    
    // Priority 2: Use Supabase URL if available
    if (paper?.pdf_url && paper.pdf_url.includes('supabase')) {
      console.log("Using Supabase PDF URL:", paper.pdf_url);
      return paper.pdf_url;
    }
    
    // Priority 3: Use any valid URL from paper
    if (paper?.pdf_url) {
      console.log("Using paper PDF URL:", paper.pdf_url);
      return paper.pdf_url;
    }
    
    // No valid URL
    console.log("No valid PDF URL found");
    return null;
  }, [paper, cachedContent]);
  ```

### 2. Highlight Retrieval
- **Endpoint:** `/api/highlights/{paper_id}`
- **Method:** GET
- **Response:**
  ```json
  [
    {
      "id": "string",
      "text": "string",
      "position": "JSON string with coordinates",
      "page_number": 1,
      "summary": "string or null",
      "explanation": "string or null"
    }
  ]
  ```
- **Implementation:**
  ```typescript
  // In highlightAPI.ts
  export const getHighlights = async (paperId: string): Promise<HighlightResponse[]> => {
    try {
      const response = await fetch(`/api/highlights/${paperId}`);
      if (!response.ok) throw new Error('Failed to fetch highlights');
      return await response.json();
    } catch (error) {
      console.error('Error fetching highlights:', error);
      return [];
    }
  };
  ```

### 3. Save Highlight
- **Endpoint:** `/api/highlights`
- **Method:** POST
- **Request:**
  ```json
  {
    "paper_id": "string",
    "text": "string",
    "page_number": 1,
    "position": "JSON string with coordinates"
  }
  ```
- **Response:** The created highlight with ID
  ```json
  {
    "id": "generated-uuid",
    "text": "string",
    "position": "JSON string with coordinates",
    "page_number": 1,
    "summary": null,
    "explanation": null
  }
  ```
- **Implementation:**
  ```typescript
  // In highlightAPI.ts
  export const saveHighlight = async (data: HighlightRequest): Promise<HighlightResponse> => {
    const response = await fetch('/api/highlights', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    
    if (!response.ok) throw new Error('Failed to save highlight');
    return await response.json();
  };
  ```

### 4. Generate Summary
- **Endpoint:** `/api/highlights/{paper_id}/summarize`
- **Method:** POST
- **Request:**
  ```json
  {
    "text": "text to summarize"
  }
  ```
- **Response:**
  ```json
  {
    "summary": "AI-generated summary"
  }
  ```
- **Implementation:**
  ```typescript
  // In highlightAPI.ts
  export const summarizeHighlight = async (
    paperId: string, 
    text: string
  ): Promise<{ summary: string }> => {
    const response = await fetch(`/api/highlights/${paperId}/summarize`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text })
    });
    
    if (!response.ok) throw new Error('Failed to generate summary');
    return await response.json();
  };
  ```

### 5. Generate Explanation
- **Endpoint:** `/api/highlights/{paper_id}/explain`
- **Method:** POST
- **Request:**
  ```json
  {
    "text": "text to explain"
  }
  ```
- **Response:**
  ```json
  {
    "explanation": "AI-generated explanation"
  }
  ```
- **Implementation:**
  ```typescript
  // In highlightAPI.ts
  export const explainHighlight = async (
    paperId: string, 
    text: string
  ): Promise<{ explanation: string }> => {
    const response = await fetch(`/api/highlights/${paperId}/explain`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text })
    });
    
    if (!response.ok) throw new Error('Failed to generate explanation');
    return await response.json();
  };
  ```

## Data Type Definitions

```typescript
// Highlight data types
export interface HighlightRequest {
  paper_id: string;
  text: string;
  page_number: number;
  position: string; // JSON string of position data
}

export interface HighlightResponse {
  id: string;
  text: string;
  position: string;
  page_number: number;
  summary?: string;
  explanation?: string;
}
```

## Key Frontend Components

### 1. Custom Tooltip Component
Since the library doesn't export a `Tip` component, we implement our own:

```typescript
{showTip && tipPosition && (
  <div 
    style={{
      position: "absolute",
      left: tipPosition.left,
      top: tipPosition.top,
    }}
    className="bg-white p-2 rounded shadow-lg border border-gray-200 z-50"
  >
    <p className="text-sm mb-2">Add this highlight?</p>
    <div className="flex space-x-2">
      <Button 
        size="sm" 
        onClick={() => {
          if (currentHighlight) {
            addHighlight(currentHighlight);
          }
        }}
      >
        Highlight
      </Button>
      <Button 
        variant="outline"
        size="sm" 
        onClick={() => {
          setShowTip(false);
          setTipPosition(null);
          setCurrentHighlight(null);
        }}
      >
        Cancel
      </Button>
    </div>
  </div>
)}
```

### 2. PDF Loading Configuration
PDF.js configuration to ensure consistent worker version and better compatibility:

```typescript
// In pdfjs-config.ts
const pdfJsVersion = pdfjs.version;
console.log(`Using PDF.js version: ${pdfJsVersion}`);

// Important: Use the EXACT same version for both API and worker
const workerSrc = `https://unpkg.com/pdfjs-dist@${pdfJsVersion}/build/pdf.worker.min.js`;
GlobalWorkerOptions.workerSrc = workerSrc;

// Disable streaming for better compatibility
const loadingOptions: DocumentInitParameters = {
  url,
  withCredentials: url.includes("supabase"),
  disableRange: true,
  disableStream: true,
  cMapUrl: `https://unpkg.com/pdfjs-dist@${pdfJsVersion}/cmaps/`,
  cMapPacked: true,
};
```

### 3. Highlight Management
Handling highlights within the component:

```typescript
// Handle selection of text
onSelectionFinished={(position, content, hideTipAndSelection, transformSelection) => {
  console.log("Selection finished:", position, content);
  
  // Create the highlight object
  const highlight = {
    content,
    position,
    comment: "",
    id: Math.random().toString(16).slice(2)
  };
  
  // Update state for the tip
  setCurrentHighlight(highlight);
  setTipPosition({
    left: position.boundingRect.x1,
    top: position.boundingRect.y1,
  });
  setShowTip(true);
}}
```

## Error Handling Strategy

1. **PDF URL Validation**
   - Check for null/undefined URLs
   - Validate URL format
   - Proper logging for debugging
   
2. **API Error Handling**
   - Try/catch blocks around all API calls
   - User-friendly error messages
   - Detailed console logging

3. **Component Fallbacks**
   - Display fallback UI when PDF can't be loaded
   - Show loading indicators during API calls
   - Prevent UI from breaking during errors

## Testing Guidance

1. Verify PDF loading from different sources (Supabase, ArXiv)
2. Test text highlighting functionality
3. Verify highlight persistence (create and retrieve)
4. Test summary and explanation generation
5. Verify error handling with invalid inputs

By implementing the frontend according to this specification, the PDF Highlighter component will properly integrate with the backend and provide a seamless experience for highlighting and analyzing PDF content.
