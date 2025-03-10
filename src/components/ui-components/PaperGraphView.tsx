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
  refBy?: string[];  // IDs of the nodes that reference *this* node
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
        <p className="text-xs text-gray-500">
          {data.type === 'user' ? 'Your paper' : 'Referenced paper'}
        </p>
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

  // Generate fake related papers and references, then remove unconnected nodes
  useEffect(() => {
    // 1) Build all nodes (user papers and references).
    const nodes: PaperNode[] = [];

    // --- (A) Add user papers as large blue nodes ---
    papers.forEach((paper, index) => {
      nodes.push({
        x: index * 400 + 200, // spacing on the X axis
        y: 100,              // top row
        z: 600,              // big bubble
        id: paper.id,
        title: paper.title,
        type: 'user'
      });
    });

    // --- (B) For each user paper, generate references at 3 levels ---
    papers.forEach((paper, paperIndex) => {
      // Level 1 references
      const level1Count = Math.floor(Math.random() * 5) + 3; // 3-7 references
      for (let i = 0; i < level1Count; i++) {
        const refId = `ref-${paper.id}-l1-${i}`;
        const xOffset = i % 2 === 0 ? -100 : 100; // left/right of user paper

        nodes.push({
          x: paperIndex * 400 + 200 + xOffset + i * 80,
          y: 250,
          z: 400,
          id: refId,
          title: `Reference to "${paper.title.substring(0, 15)}..." (L1-${i})`,
          type: 'reference',
          // This node is referenced by the user paper. In the lines below,
          // we draw lines from the user paper → L1 node, so userPaperId ∈ L1.refBy
          refBy: [paper.id]
        });

        // Level 2 references
        const level2Count = Math.floor(Math.random() * 4) + 2; // 2-5
        for (let j = 0; j < level2Count; j++) {
          const refId2 = `ref-${paper.id}-l2-${i}-${j}`;
          nodes.push({
            x: paperIndex * 400 +
               200 +
               xOffset +
               i * 80 +
               (j % 2 === 0 ? -60 : 60),
            y: 400,
            z: 300,
            id: refId2,
            title: `Secondary reference (L2-${j})`,
            type: 'reference',
            // This node is referenced by the L1 node
            refBy: [refId]
          });

          // Level 3 references
          if (Math.random() > 0.3) { // ~70% chance
            const level3Count = Math.floor(Math.random() * 3) + 1; // 1-3
            for (let k = 0; k < level3Count; k++) {
              const refId3 = `ref-${paper.id}-l3-${i}-${j}-${k}`;
              nodes.push({
                x: paperIndex * 400 +
                   200 +
                   xOffset +
                   i * 80 +
                   (j % 2 === 0 ? -60 : 60) +
                   k * 30,
                y: 550,
                z: 200,
                id: refId3,
                title: `Tertiary reference (L3-${k})`,
                type: 'reference',
                // This node is referenced by the L2 node
                refBy: [refId2]
              });
            }
          }
        }

        // (C) Cross-paper reference: connect each paper’s first L1 node
        // to the previous paper’s first L1 node
        if (paperIndex > 0 && i === 0) {
          const prevPaperRefId = `ref-${papers[paperIndex - 1].id}-l1-0`;
          // The new node is referenced by the old node
          // so we add the new node's ID to the old node's refBy:
          const prevNode = nodes.find(n => n.id === prevPaperRefId);
          if (prevNode?.refBy) {
            prevNode.refBy.push(refId);
          }
        }
      }
    });

    // --- (D) Common reference across multiple papers ---
    if (papers.length >= 2) {
      const commonRefId = 'common-ref-1';
      const firstFewPaperIDs = papers
        .slice(0, Math.min(papers.length, 3))
        .map(p => p.id);

      nodes.push({
        x: papers.length * 200, // somewhere in the middle
        y: 300,
        z: 400,
        id: commonRefId,
        title: 'Common Reference Paper',
        type: 'reference',
        // This node is referenced by up to the first 3 user papers
        refBy: firstFewPaperIDs
      });

      // Some second-level references off that "common" reference
      for (let i = 0; i < 3; i++) {
        nodes.push({
          x: papers.length * 200 + i * 100 - 100,
          y: 450,
          z: 250,
          id: `common-ref-1-child-${i}`,
          title: `Reference cited by common paper (${i})`,
          type: 'reference',
          refBy: [commonRefId]
        });
      }
    }

    // 2) Build an adjacency map so we can do BFS from each user paper
    // in the direction of userPaper → child → grandchild, etc.
    const adjacency: Record<string, string[]> = {};
    nodes.forEach(n => {
      adjacency[n.id] = [];
    });
    nodes.forEach(child => {
      child.refBy?.forEach(parentId => {
        if (adjacency[parentId]) {
          adjacency[parentId].push(child.id);
        }
      });
    });

    // 3) BFS from each user paper to find all reachable nodes
    const visited = new Set<string>();
    const queue: string[] = [];

    // Enqueue all user‐paper IDs
    papers.forEach(p => {
      visited.add(p.id);
      queue.push(p.id);
    });

    while (queue.length > 0) {
      const current = queue.shift()!;
      adjacency[current].forEach(childId => {
        if (!visited.has(childId)) {
          visited.add(childId);
          queue.push(childId);
        }
      });
    }

    // 4) Filter out anything that wasn’t reachable
    const connectedNodes = nodes.filter(n => visited.has(n.id));

    setGraphData(connectedNodes);
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
    const walk = (x - startX) * 2; // speed multiplier
    containerRef.current.scrollLeft = scrollLeft - walk;
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleNodeClick = (data: PaperNode) => {
    if (data.type === 'user') {
      // Navigate to the paper’s detail page (replace with your route)
      navigate(`/papers/${data.id}`);
    }
  };

  // Make the chart wide enough so we can scroll around
  const graphWidth = Math.max(
    papers.length * 400 + 600,
    1200
  );

  return (
    <div
      className={cn(
        "bg-white rounded-xl shadow-md border border-gray-100 overflow-x-auto",
        className
      )}
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
            <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
              <XAxis type="number" dataKey="x" hide domain={['dataMin', 'dataMax']} />
              <YAxis type="number" dataKey="y" hide domain={['dataMin', 'dataMax']} />
              <ZAxis type="number" dataKey="z" range={[200, 600]} />
              <Tooltip content={<CustomTooltip />} cursor={{ strokeDasharray: '3 3' }} />

              {/* Draw “edges” as lines from parent → child */}
              {graphData.map(child => {
                if (child.refBy) {
                  return child.refBy.map(parentId => {
                    const parentNode = graphData.find(n => n.id === parentId);
                    if (!parentNode) return null;
                    return (
                      <line
                        key={`line-${child.id}-${parentNode.id}`}
                        x1={parentNode.x}
                        y1={parentNode.y}
                        x2={child.x}
                        y2={child.y}
                        stroke="#ccc"
                        strokeWidth={3}
                        style={{ pointerEvents: 'none' }}
                      />
                    );
                  });
                }
                return null;
              })}

              <Scatter
                name="Papers Graph"
                data={graphData}
                onClick={handleNodeClick}
              >
                {graphData.map((node, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={node.type === 'user' ? '#3b82f6' : '#9ca3af'}
                    style={{ cursor: node.type === 'user' ? 'pointer' : 'default' }}
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
            <span className="inline-block h-4 w-4 bg-blue-500 rounded-full mr-1" />
            Your papers
            <span className="inline-block h-4 w-4 bg-gray-400 rounded-full ml-4 mr-1" />
            Referenced papers
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
