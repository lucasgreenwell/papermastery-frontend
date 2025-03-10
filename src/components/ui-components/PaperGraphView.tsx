
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
  
  // Generate fake related papers and references
  useEffect(() => {
    const nodes: PaperNode[] = [];
    
    // Add user papers as blue nodes
    papers.forEach((paper, index) => {
      nodes.push({
        x: index * 200 + 100,
        y: 100,
        z: 60, // Large size for user papers
        id: paper.id,
        title: paper.title,
        type: 'user'
      });
    });
    
    // Generate up to 3 levels of related papers for each user paper
    papers.forEach((paper, paperIndex) => {
      // Level 1 references (direct)
      const level1Count = Math.floor(Math.random() * 3) + 1;
      for (let i = 0; i < level1Count; i++) {
        const refId = `ref-${paper.id}-l1-${i}`;
        nodes.push({
          x: paperIndex * 200 + 70 + (i * 50),
          y: 200,
          z: 30, // Medium size for level 1 references
          id: refId,
          title: `Reference to "${paper.title.substring(0, 15)}..." (L1-${i})`,
          type: 'reference',
          refBy: [paper.id]
        });
        
        // Level 2 references (referenced by level 1)
        if (Math.random() > 0.3) {
          const level2Count = Math.floor(Math.random() * 2) + 1;
          for (let j = 0; j < level2Count; j++) {
            const refId2 = `ref-${paper.id}-l2-${i}-${j}`;
            nodes.push({
              x: paperIndex * 200 + 60 + (i * 50) + (j * 20),
              y: 300,
              z: 20, // Smaller size for level 2 references
              id: refId2,
              title: `Secondary reference (L2-${j})`,
              type: 'reference',
              refBy: [refId]
            });
            
            // Level 3 references (referenced by level 2)
            if (Math.random() > 0.5) {
              const refId3 = `ref-${paper.id}-l3-${i}-${j}`;
              nodes.push({
                x: paperIndex * 200 + 50 + (i * 50) + (j * 20),
                y: 400,
                z: 10, // Smallest size for level 3 references
                id: refId3,
                title: `Tertiary reference (L3)`,
                type: 'reference',
                refBy: [refId2]
              });
            }
          }
        }
      }
    });
    
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

  // Calculate the required width based on the data
  const graphWidth = Math.max(
    papers.length * 200 + 200, // Base width from user papers
    800 // Minimum width
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
      <div className="min-h-[500px] min-w-full relative">
        {graphData.length > 0 ? (
          <ResponsiveContainer width="100%" height={500}>
            <ScatterChart 
              margin={{ top: 20, right: 20, bottom: 20, left: 20 }}
            >
              <XAxis type="number" dataKey="x" hide domain={['dataMin', 'dataMax']} />
              <YAxis type="number" dataKey="y" hide domain={['dataMin', 'dataMax']} />
              <ZAxis type="number" dataKey="z" range={[20, 60]} />
              <Tooltip content={<CustomTooltip />} cursor={{ strokeDasharray: '3 3' }} />
              
              {/* Lines connecting referenced papers */}
              {graphData.map((node) => {
                if (node.refBy) {
                  const parentNode = graphData.find(n => n.id === node.refBy![0]);
                  if (parentNode) {
                    return (
                      <line
                        key={`line-${node.id}-${parentNode.id}`}
                        x1={parentNode.x}
                        y1={parentNode.y}
                        x2={node.x}
                        y2={node.y}
                        stroke="#ccc"
                        strokeWidth={1}
                        style={{ pointerEvents: 'none' }}
                      />
                    );
                  }
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
