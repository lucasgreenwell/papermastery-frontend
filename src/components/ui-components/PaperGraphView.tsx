import React, { useState, useRef, MouseEvent } from 'react';
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
  /**
   * IDs of the nodes that reference *this* node.
   * Example: if node B has `refBy: ["A"]`, that means
   * "A cites B" (so the edge is A → B in your chart).
   */
  refBy?: string[];
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: any[];
}

/** Simple tooltip for Recharts */
const CustomTooltip = ({ active, payload }: CustomTooltipProps) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="bg-white p-2 shadow-md rounded-md border border-gray-200 text-sm">
        <p className="font-medium">{data.title}</p>
        <p className="text-xs text-gray-500">
          {data.type === 'user' ? 'Your paper' : 'Referenced paper'}
        </p>
      </div>
    );
  }
  return null;
};

const PaperGraphView: React.FC = () => {
  const navigate = useNavigate();
  const containerRef = useRef<HTMLDivElement>(null);

  // For click-and-drag horizontal scrolling:
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [scrollLeft, setScrollLeft] = useState(0);

  // --- 1) Hard-coded list of "user" papers ---
  const mockPapers: Paper[] = [
    {
      id: 'paper-1',
      title: 'My First Fake Paper',
      authors: ['Alice', 'Bob'],
      date: '2024-01-01',
      skillLevel: 1
    },
    {
      id: 'paper-2',
      title: 'Another Made-Up Paper',
      authors: ['Charlie'],
      date: '2025-02-15',
      skillLevel: 2
    },
    {
      id: 'paper-3',
      title: 'Yet Another Totally Real Paper',
      authors: ['Alice', 'Eve'],
      date: '2025-09-30',
      skillLevel: 3
    }
  ];

  // --- 2) Hard-coded "graphData" (Papers + references) ---
  // Each reference node includes `refBy: [...]` listing the IDs that cite it.
  // Edges get drawn from those "parent" IDs → this child node.
  const graphData: PaperNode[] = [
    // User papers (blue)
    {
      x: 100,
      y: 100,
      z: 600,
      id: 'paper-1',
      title: 'My First Fake Paper',
      type: 'user'
    },
    {
      x: 500,
      y: 100,
      z: 600,
      id: 'paper-2',
      title: 'Another Made-Up Paper',
      type: 'user'
    },
    {
      x: 900,
      y: 100,
      z: 600,
      id: 'paper-3',
      title: 'Yet Another Totally Real Paper',
      type: 'user'
    },

    // Level 1 references for paper-1
    {
      x: 100,
      y: 250,
      z: 400,
      id: 'ref-paper-1-l1-0',
      title: 'Reference A (paper-1)',
      type: 'reference',
      refBy: ['paper-1'] // paper-1 cites this
    },
    {
      x: 180,
      y: 250,
      z: 400,
      id: 'ref-paper-1-l1-1',
      title: 'Reference B (paper-1)',
      type: 'reference',
      refBy: ['paper-1']
    },

    // Level 1 references for paper-2
    {
      x: 500,
      y: 250,
      z: 400,
      id: 'ref-paper-2-l1-0',
      title: 'Reference X (paper-2)',
      type: 'reference',
      refBy: ['paper-2']
    },

    // Level 2 reference for the first reference of paper-2
    {
      x: 520,
      y: 400,
      z: 300,
      id: 'ref-paper-2-l2-0-0',
      title: 'Secondary ref off X',
      type: 'reference',
      refBy: ['ref-paper-2-l1-0'] 
    },

    // Level 1 references for paper-3
    {
      x: 900,
      y: 250,
      z: 400,
      id: 'ref-paper-3-l1-0',
      title: 'Reference Y (paper-3)',
      type: 'reference',
      refBy: ['paper-3']
    },
    {
      x: 950,
      y: 250,
      z: 400,
      id: 'ref-paper-3-l1-1',
      title: 'Reference Z (paper-3)',
      type: 'reference',
      refBy: ['paper-3']
    },

    // Common reference that is cited by all 3 user papers
    {
      x: 500,
      y: 300,
      z: 400,
      id: 'common-ref-1',
      title: 'Common Reference Paper',
      type: 'reference',
      refBy: ['paper-1', 'paper-2', 'paper-3']
    }
  ];

  // --- 3) Horizontal scroll via mouse drag ---
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

  // --- 4) On node click, if it's a user paper, go to a detail page (example) ---
  const handleNodeClick = (data: PaperNode) => {
    if (data.type === 'user') {
      // If you have a route like /papers/:id
      navigate(`/papers/${data.id}`);
    }
  };

  // --- 5) Chart width to allow scrolling horizontally ---
  const graphWidth = 1200; // or more, as needed

  return (
    <div
      className={cn("bg-white rounded-xl shadow-md border border-gray-100 overflow-x-auto")}
      ref={containerRef}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      style={{ cursor: isDragging ? 'grabbing' : 'grab' }}
    >
      <div className="min-h-[600px] relative" style={{ width: graphWidth }}>
        <ResponsiveContainer width="100%" height={600}>
          <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
            <XAxis type="number" dataKey="x" hide domain={['dataMin', 'dataMax']} />
            <YAxis type="number" dataKey="y" hide domain={['dataMin', 'dataMax']} />
            <ZAxis type="number" dataKey="z" range={[200, 600]} />
            <Tooltip content={<CustomTooltip />} cursor={{ strokeDasharray: '3 3' }} />

            {/* Draw edges as lines: each reference node has "refBy" = [parents].
                So we connect each parent → this child. */}
            {graphData.map((child) => {
              if (!child.refBy) return null;
              return child.refBy.map((parentId) => {
                const parentNode = graphData.find((n) => n.id === parentId);
                if (!parentNode) return null;
                return (
                  <line
                    key={`line-${child.id}-from-${parentId}`}
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
            })}

            <Scatter
              name="Papers Graph"
              data={graphData}
              onClick={handleNodeClick}
            >
              {graphData.map((node, idx) => (
                <Cell
                  key={`cell-${idx}`}
                  fill={node.type === 'user' ? '#3b82f6' : '#9ca3af'}
                  style={{ cursor: node.type === 'user' ? 'pointer' : 'default' }}
                />
              ))}
            </Scatter>
          </ScatterChart>
        </ResponsiveContainer>

        {/* Legend / instructions */}
        <div className="text-center p-4 border-t border-gray-100 absolute bottom-0 left-0 w-full bg-white">
          <p className="text-xs text-gray-500">
            <span className="inline-block h-4 w-4 bg-blue-500 rounded-full mr-1" />
            Your papers
            <span className="inline-block h-4 w-4 bg-gray-400 rounded-full ml-4 mr-1" />
            Referenced papers
          </p>
          <p className="text-xs text-gray-400 mt-1">
            Click and drag to explore the graph. Click on blue nodes to view details.
          </p>
        </div>
      </div>
    </div>
  );
};

export default PaperGraphView;
