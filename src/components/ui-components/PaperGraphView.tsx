
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

interface Edge {
  source: string;
  target: string;
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
  const [edges, setEdges] = useState<Edge[]>([]);
  
  // Generate paper nodes and their connections
  useEffect(() => {
    const nodes: PaperNode[] = [];
    const connectionEdges: Edge[] = [];
    
    // Add user papers as blue nodes in the center row
    papers.forEach((paper, index) => {
      nodes.push({
        x: index * 300 + 200,
        y: 250,
        z: 300, // Very large size for user papers
        id: paper.id,
        title: paper.title,
        type: 'user'
      });
    });
    
    // Generate connected reference papers for each user paper
    papers.forEach((paper, paperIndex) => {
      // First level references (direct references from user papers)
      const refCount = Math.min(paperIndex + 2, 4); // Ensure some variety but not too many
      for (let i = 0; i < refCount; i++) {
        const refId = `ref-${paper.id}-l1-${i}`;
        nodes.push({
          x: paperIndex * 300 + 200 + ((i % 2 === 0) ? -120 : 120),
          y: 150, // Above the user papers
          z: 150, // Medium-large size for reference papers
          id: refId,
          title: `Reference to "${paper.title.substring(0, 15)}..." (L1-${i})`,
          type: 'reference',
          refBy: [paper.id]
        });
        
        // Add the edge between user paper and this reference
        connectionEdges.push({
          source: paper.id,
          target: refId
        });
        
        // Second level references (referenced by first level)
        if (i < 2) { // Limit second level references for simplicity
          const refId2 = `ref-${paper.id}-l2-${i}`;
          nodes.push({
            x: paperIndex * 300 + 200 + ((i % 2 === 0) ? -160 : 160),
            y: 50, // Above first level
            z: 100, // Medium size
            id: refId2,
            title: `Secondary reference (L2-${i})`,
            type: 'reference',
            refBy: [refId]
          });
          
          // Add the edge between first level reference and second level
          connectionEdges.push({
            source: refId,
            target: refId2
          });
        }
      }
      
      // Add references below user papers as well
      for (let i = 0; i < refCount - 1; i++) {
        const refId = `ref-below-${paper.id}-l1-${i}`;
        nodes.push({
          x: paperIndex * 300 + 200 + ((i % 2 === 0) ? -100 : 100),
          y: 350, // Below the user papers
          z: 150,
          id: refId,
          title: `Citation of "${paper.title.substring(0, 15)}..." (C1-${i})`,
          type: 'reference', 
          refBy: [paper.id]
        });
        
        // Add the edge between user paper and this citation
        connectionEdges.push({
          source: paper.id,
          target: refId
        });
        
        // Add some connections between reference papers horizontally
        if (paperIndex > 0 && i === 0) {
          const prevPaperRefId = `ref-below-${papers[paperIndex-1].id}-l1-0`;
          const existingNode = nodes.find(n => n.id === prevPaperRefId);
          if (existingNode) {
            connectionEdges.push({
              source: prevPaperRefId,
              target: refId
            });
          }
        }
      }
    });
    
    // Add some cross-references between papers to make the graph more connected
    if (papers.length > 1) {
      // Connect first and second user papers
      const ref1 = `cross-ref-1-2`;
      nodes.push({
        x: 350,
        y: 200,
        z: 120,
        id: ref1,
        title: "Cross-reference between papers",
        type: 'reference',
        refBy: [papers[0].id, papers[1].id]
      });
      
      // Add edges for cross-reference
      connectionEdges.push({
        source: papers[0].id,
        target: ref1
      });
      connectionEdges.push({
        source: papers[1].id,
        target: ref1
      });
      
      // If there's a third paper, connect it too
      if (papers.length > 2) {
        const ref2 = `cross-ref-2-3`;
        nodes.push({
          x: 650,
          y: 200, 
          z: 120,
          id: ref2,
          title: "Another cross-reference",
          type: 'reference',
          refBy: [papers[1].id, papers[2].id]
        });
        
        // Add edges for second cross-reference
        connectionEdges.push({
          source: papers[1].id,
          target: ref2
        });
        connectionEdges.push({
          source: papers[2].id,
          target: ref2
        });
      }
    }
    
    setGraphData(nodes);
    setEdges(connectionEdges);
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

  // Calculate width based on data to ensure scrolling works
  const graphWidth = Math.max(
    papers.length * 300 + 400, // Base width from user papers
    1200 // Minimum width to ensure scrolling is possible
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
      <div className="min-h-[500px]" style={{ width: `${graphWidth}px` }}>
        {graphData.length > 0 ? (
          <ResponsiveContainer width="100%" height={500}>
            <ScatterChart 
              margin={{ top: 20, right: 20, bottom: 20, left: 20 }}
            >
              <XAxis type="number" dataKey="x" hide domain={['dataMin', 'dataMax']} />
              <YAxis type="number" dataKey="y" hide domain={['dataMin', 'dataMax']} />
              <ZAxis type="number" dataKey="z" range={[100, 300]} />
              <Tooltip content={<CustomTooltip />} cursor={{ strokeDasharray: '3 3' }} />
              
              {/* Custom rendering for edges between nodes */}
              <svg>
                {edges.map((edge, index) => {
                  const sourceNode = graphData.find(n => n.id === edge.source);
                  const targetNode = graphData.find(n => n.id === edge.target);
                  
                  if (sourceNode && targetNode) {
                    return (
                      <line
                        key={`edge-${index}`}
                        x1={sourceNode.x}
                        y1={sourceNode.y}
                        x2={targetNode.x}
                        y2={targetNode.y}
                        stroke="#aaa"
                        strokeWidth={2}
                      />
                    );
                  }
                  return null;
                })}
              </svg>
              
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
            <span className="inline-block h-3 w-3 bg-blue-500 rounded-full mr-1"></span> Your papers
            <span className="inline-block h-3 w-3 bg-gray-400 rounded-full ml-4 mr-1"></span> Referenced papers
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
