
import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { ScatterChart, Scatter, XAxis, YAxis, ZAxis, Tooltip, Cell, ResponsiveContainer } from 'recharts';
import { cn } from '@/lib/utils';

// Define types for our graph data
interface PaperNode {
  id: string;
  title: string;
  x: number;
  y: number;
  z: number; // For node size
  isUserPaper: boolean;
}

interface PapersGraphProps {
  className?: string;
}

// Custom tooltip component to show paper title on hover
const CustomTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white p-2 border border-gray-200 rounded shadow-md text-sm">
        <p className="font-medium">{payload[0].payload.title}</p>
      </div>
    );
  }
  return null;
};

const PapersGraph = ({ className }: PapersGraphProps) => {
  const navigate = useNavigate();
  const [isDragging, setIsDragging] = useState(false);
  const [viewBox, setViewBox] = useState({ x: 0, y: 0, width: 800, height: 600 });
  const startPanRef = useRef<{ x: number; y: number } | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Generate mock data for the graph
  const generateGraphData = (): PaperNode[] => {
    // Sample papers that the user has uploaded (blue nodes)
    const userPapers = [
      { id: '1', title: 'Attention Is All You Need', x: 100, y: 300, z: 80, isUserPaper: true },
      { id: '2', title: 'BERT: Pre-training of Deep Bidirectional Transformers', x: 300, y: 200, z: 80, isUserPaper: true },
      { id: '3', title: 'GPT-3: Language Models are Few-Shot Learners', x: 400, y: 400, z: 80, isUserPaper: true },
      { id: '4', title: 'An Image is Worth 16x16 Words: Transformers for Image Recognition', x: 250, y: 500, z: 80, isUserPaper: true },
    ];
    
    // Related papers that the user hasn't uploaded (gray nodes)
    const relatedPapers = [
      { id: '101', title: 'Transformer-XL: Attentive Language Models Beyond a Fixed-Length Context', x: 150, y: 350, z: 40, isUserPaper: false },
      { id: '102', title: 'RoBERTa: A Robustly Optimized BERT Pretraining Approach', x: 350, y: 250, z: 40, isUserPaper: false },
      { id: '103', title: 'T5: Exploring the Limits of Transfer Learning', x: 450, y: 300, z: 40, isUserPaper: false },
      { id: '104', title: 'CLIP: Learning Transferable Visual Models', x: 200, y: 450, z: 40, isUserPaper: false },
      { id: '105', title: 'DALL-E: Creating Images from Text', x: 300, y: 450, z: 40, isUserPaper: false },
      { id: '106', title: 'LaMDA: Language Models for Dialog Applications', x: 500, y: 350, z: 40, isUserPaper: false },
      { id: '107', title: 'ERNIE: Enhanced Representation through Knowledge Integration', x: 250, y: 300, z: 40, isUserPaper: false },
      { id: '108', title: 'MuZero: Mastering Atari, Go, Chess and Shogi', x: 150, y: 200, z: 40, isUserPaper: false },
      { id: '109', title: 'AlphaFold: Protein Structure Prediction with Deep Learning', x: 400, y: 150, z: 40, isUserPaper: false },
      { id: '110', title: 'DETR: End-to-End Object Detection with Transformers', x: 350, y: 400, z: 40, isUserPaper: false },
    ];
    
    return [...userPapers, ...relatedPapers];
  };
  
  const graphData = generateGraphData();

  // Handle node click - navigate to paper details if it's a user paper
  const handleNodeClick = (data: PaperNode) => {
    if (data.isUserPaper) {
      navigate(`/papers/${data.id}`);
    }
  };

  // Pan/drag functionality
  const handleMouseDown = (e: React.MouseEvent) => {
    if (containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      startPanRef.current = { x: e.clientX - rect.left, y: e.clientY - rect.top };
      setIsDragging(true);
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging && startPanRef.current && containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      
      const dx = (startPanRef.current.x - x) * 2;
      const dy = (startPanRef.current.y - y) * 2;
      
      setViewBox(prev => ({
        ...prev,
        x: prev.x + dx,
        y: prev.y + dy
      }));
      
      startPanRef.current = { x, y };
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
    startPanRef.current = null;
  };

  return (
    <div 
      className={cn("w-full h-[600px] relative border border-gray-100 rounded-lg bg-white", 
        className,
        isDragging ? "cursor-grabbing" : "cursor-grab")}
      ref={containerRef}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
    >
      <ResponsiveContainer width="100%" height="100%">
        <ScatterChart
          margin={{ top: 20, right: 20, bottom: 20, left: 20 }}
          onClick={(e: any) => e?.payload && handleNodeClick(e.payload)}
        >
          <XAxis type="number" dataKey="x" domain={[0, 600]} hide />
          <YAxis type="number" dataKey="y" domain={[0, 600]} hide />
          <ZAxis type="number" dataKey="z" range={[40, 80]} />
          <Tooltip content={<CustomTooltip />} />
          <Scatter name="Papers" data={graphData}>
            {graphData.map((entry, index) => (
              <Cell
                key={`cell-${index}`}
                fill={entry.isUserPaper ? "#2563eb" : "#d1d5db"}
                style={{ cursor: entry.isUserPaper ? "pointer" : "default" }}
              />
            ))}
          </Scatter>
        </ScatterChart>
      </ResponsiveContainer>
      <div className="absolute bottom-2 left-2 text-xs text-gray-500">
        <p>Drag to navigate • Click on blue nodes to view paper details</p>
      </div>
    </div>
  );
};

export default PapersGraph;
