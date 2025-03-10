
import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  ZAxis,
  Tooltip,
  ResponsiveContainer,
  Cell
} from 'recharts';
import { cn } from '@/lib/utils';

interface Paper {
  id: string;
  title: string;
  authors: string[];
  date: string;
  skillLevel: number;
}

interface PaperNode {
  x: number;
  y: number;
  z: number;
  id: string;
  title: string;
  type: 'user' | 'reference';
  refBy?: string[];
}

interface PaperGraphViewProps {
  papers: Paper[];
  className?: string;
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: any[];
}

const CustomTooltip = ({ active, payload }: CustomTooltipProps) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="bg-white p-2 shadow-md rounded-md border border-gray-200 text-sm z-50">
        <p className="font-medium">{data.title}</p>
        <p className="text-xs text-gray-500">{data.type === 'user' ? 'Your paper' : 'Referenced paper'}</p>
      </div>
    );
  }
  return null;
};

const PaperGraphView = ({ papers, className }: PaperGraphViewProps) => {
  const navigate = useNavigate();
  const containerRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [scrollLeft, setScrollLeft] = useState(0);
  const [graphData, setGraphData] = useState<PaperNode[]>([]);
  
  // Generate fake related papers and references with more connections
  useEffect(() => {
    const nodes: PaperNode[] = [];
    
    // Add user papers as blue nodes with more spacing between them
   useEffect(() => {
  const nodes: PaperNode[] = [];
  const edges: { source: string; target: string }[] = [];
  
  // Add user papers as blue nodes with more spacing between them
  papers.forEach((paper, index) => {
    nodes.push({
      x: index * 400 + 200,
      y: 100,
      z: 600,
      id: paper.id,
      title: paper.title,
      type: 'user'
    });
  });
  
  // Generate more densely connected references for each user paper
  // Generate fake related papers and references with more connections
  useEffect(() => {
    const nodes: PaperNode[] = [];
    
    // Add user papers as blue nodes with more spacing between them
    papers.forEach((paper, index) => {
      nodes.push({
        x: index * 400 + 200, // Increase spacing between user papers
        y: 100,
        z: 600, // Much larger size for user papers (5x increase)
        id: paper.id,
        title: paper.title,
        type: 'user'
      });
    });
    
    // Generate more densely connected references for each user paper
    papers.forEach((paper, paperIndex) => {
      // Level 1 references (direct) - more of them
      const level1Count = Math.floor(Math.random() * 5) + 3; // 3-7 references per paper
      for (let i = 0; i < level1Count; i++) {
        const refId = `ref-${paper.id}-l1-${i}`;
        const xOffset = i % 2 === 0 ? -100 : 100; // Alternate left and right of the main paper
        
        nodes.push({
          x: paperIndex * 400 + 200 + xOffset + (i * 80), 
          y: 250,
          z: 400, // Larger size for level 1 references (5x increase)
          id: refId,
          title: `Reference to "${paper.title.substring(0, 15)}..." (L1-${i})`,
          type: 'reference',
          refBy: [paper.id]
        });
        
        // Level 2 references (referenced by level 1) - more of them and more connected
        const level2Count = Math.floor(Math.random() * 4) + 2; // 2-5 level 2 references
        for (let j = 0; j < level2Count; j++) {
          const refId2 = `ref-${paper.id}-l2-${i}-${j}`;
          nodes.push({
            x: paperIndex * 400 + 200 + xOffset + (i * 80) + (j % 2 === 0 ? -60 : 60),
            y: 400,
            z: 300, // Larger size for level 2 references (5x increase)
            id: refId2,
            title: `Secondary reference (L2-${j})`,
            type: 'reference',
            refBy: [refId]
          });
          
          // Level 3 references (referenced by level 2) - more of them
          if (Math.random() > 0.3) { // 70% chance of having level 3 references
            const level3Count = Math.floor(Math.random() * 3) + 1; // 1-3 level 3 references
            for (let k = 0; k < level3Count; k++) {
              const refId3 = `ref-${paper.id}-l3-${i}-${j}-${k}`;
              nodes.push({
                x: paperIndex * 400 + 200 + xOffset + (i * 80) + (j % 2 === 0 ? -60 : 60) + (k * 30),
                y: 550,
                z: 200, // Larger size for level 3 references (5x increase)
                id: refId3,
                title: `Tertiary reference (L3-${k})`,
                type: 'reference',
                refBy: [refId2]
              });
            }
          }
        }
        
        // Create some cross-paper connections for a more realistic network
        if (paperIndex > 0 && i === 0) {
          // Connect to a previous paper's reference
          const prevPaperRefId = `ref-${papers[paperIndex-1].id}-l1-0`;
          nodes.find(n => n.id === prevPaperRefId)?.refBy?.push(refId);
        }
      }
    });
    
    // Add some common references between papers (papers that cite the same sources)
    if (papers.length >= 2) {
      const commonRefId = 'common-ref-1';
      nodes.push({
        x: papers.length * 200, // Position in the middle
        y: 300,
        z: 400, // Larger size for common references (5x increase)
        id: commonRefId,
        title: 'Common Reference Paper',
        type: 'reference',
        refBy: papers.slice(0, Math.min(papers.length, 3)).map(p => p.id) // Referenced by up to first 3 papers
      });
      
      // Add some second-level connections to this common reference
      for (let i = 0; i < 3; i++) {
        nodes.push({
          x: papers.length * 200 + (i * 100) - 100,
          y: 450,
          z: 250, // Medium-large size (5x increase)
          id: `common-ref-1-child-${i}`,
          title: `Reference cited by common paper (${i})`,
          type: 'reference',
          refBy: [commonRefId]
        });
      }
    }
    
    setGraphData(nodes);
  }, [papers]);

  // Handle mouse dragging for horizontal scrolling
  const handleMouseDown = (e: React.MouseEvent) => {
    if (!containerRef.current) return;
    setIsDragging(true);
    setStartX(e.pageX - containerRef.current.offsetLeft);
    setScrollLeft(containerRef.current.scrollLeft);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || !containerRef.current) return;
    e.preventDefault();
    const x = e.pageX - containerRef.current.offsetLeft;
    const walk = (x - startX) * 2; // Scroll faster
    containerRef.current.scrollLeft = scrollLeft - walk;
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleNodeClick = (data: PaperNode) => {
    if (data.type === 'user') {
      navigate(`/papers/${data.id}`);
    }
  };

  // Calculate the required width based on the data - much wider to ensure scrolling is needed
  const graphWidth = Math.max(
    papers.length * 400 + 600, // Wider base width
    1200 // Increased minimum width
  );

  return (
    <div 
      className={cn("bg-white rounded-xl shadow-md border border-gray-100 overflow-x-auto", className)}
      ref={containerRef}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      style={{ cursor: isDragging ? 'grabbing' : 'grab' }}
    >
      <div className="min-h-[600px] min-w-full relative" style={{ width: graphWidth }}>
        {graphData.length > 0 ? (
          <ResponsiveContainer width="100%" height={600}>
            <ScatterChart 
              margin={{ top: 20, right: 20, bottom: 20, left: 20 }}
            >
              <XAxis type="number" dataKey="x" hide domain={['dataMin', 'dataMax']} />
              <YAxis type="number" dataKey="y" hide domain={['dataMin', 'dataMax']} />
              <ZAxis type="number" dataKey="z" range={[200, 600]} /> {/* Increased size range by 5x */}
              <Tooltip content={<CustomTooltip />} cursor={{ strokeDasharray: '3 3' }} />
              
              {/* Lines connecting referenced papers */}
              {graphData.map((node) => {
                if (node.refBy) {
                  return node.refBy.map(refId => {
                    const parentNode = graphData.find(n => n.id === refId);
                    if (parentNode) {
                      return (
                        <line
                          key={`line-${node.id}-${parentNode.id}`}
                          x1={parentNode.x}
                          y1={parentNode.y}
                          x2={node.x}
                          y2={node.y}
                          stroke="#ccc"
                          strokeWidth={3} // Thicker lines (doubled)
                          style={{ pointerEvents: 'none' }}
                        />
                      );
                    }
                    return null;
                  });
                }
                return null;
              })}
              
              <Scatter 
                name="Papers Graph" 
                data={graphData} 
                fill="#8884d8"
                onClick={handleNodeClick}
              >
                {graphData.map((node, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={node.type === 'user' ? '#3b82f6' : '#9ca3af'}
                    style={{ 
                      cursor: node.type === 'user' ? 'pointer' : 'default',
                    }}
                  />
                ))}
              </Scatter>
            </ScatterChart>
          </ResponsiveContainer>
        ) : (
          <div className="flex items-center justify-center h-full">
            <p className="text-gray-500">Loading graph data...</p>
          </div>
        )}
        
        <div className="text-center p-4 border-t border-gray-100">
          <p className="text-xs text-gray-500">
            <span className="inline-block h-4 w-4 bg-blue-500 rounded-full mr-1"></span> Your papers
            <span className="inline-block h-4 w-4 bg-gray-400 rounded-full ml-4 mr-1"></span> Referenced papers
          </p>
          <p className="text-xs text-gray-400 mt-1">
            Click and drag to explore the graph. Click on blue nodes to view paper details.
          </p>
        </div>
      </div>
    </div>
  );
};

export default PaperGraphView;
