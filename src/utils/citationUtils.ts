import { PaperResponse } from '@/services/types';
import { format } from 'date-fns';

/**
 * Formats a paper citation based on its details.
 * 
 * @param paper - The paper object containing title, authors, publication date, etc.
 * @returns Formatted citation text
 */
export function formatCitation(paper: PaperResponse): string {
  if (!paper) return '';
  
  // Extract paper details
  const { title, authors, publication_date, arxiv_id, id } = paper;
  
  // Format the authors list: Last Name, First Initial.
  const formattedAuthors = authors.map(author => {
    if (typeof author === 'string') {
      return author;
    }
    
    const authorName = author.name;
    const nameParts = authorName.split(' ');
    
    if (nameParts.length < 2) {
      return authorName;
    }
    
    const lastName = nameParts[nameParts.length - 1];
    const firstInitials = nameParts
      .slice(0, nameParts.length - 1)
      .map(part => part.charAt(0) + '.')
      .join(' ');
    
    return `${lastName}, ${firstInitials}`;
  }).join(', ');
  
  // Format publication date
  const formattedDate = publication_date ? 
    format(new Date(publication_date), 'yyyy') : 
    'n.d.'; // n.d. = no date
  
  // Determine URL to use (arXiv preferred if available)
  let url = '';
  if (arxiv_id) {
    url = `https://arxiv.org/abs/${arxiv_id}`;
  } else {
    // Fallback to Supabase direct link
    url = `${window.location.origin}/papers/${id}`;
  }
  
  // Format citation (approximating APA style)
  return `${formattedAuthors} (${formattedDate}). ${title}. Retrieved from ${url}`;
} 