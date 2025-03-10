
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Graph from 'react-graph-vis';
import { cn } from '@/lib/utils';

interface Paper {
  id: string;
  title: string;
  authors: string[];
  date: string;
  skillLevel: number;
}

interface PaperGraphViewProps {
  papers: Paper[];
  className?: string;
}

const PaperGraphView = ({ papers, className }: PaperGraphViewProps) => {
  const navigate = useNavigate();
  const [graphData, setGraphData] = useState({ nodes: [], edges: [] });

  useEffect(() => {
    if (!papers || papers.length === 0) return;

    // Create graph data structure
    const nodes = [];
    const edges = [];

    // Add user papers as primary nodes
    papers.forEach((paper) => {
      nodes.push({
        id: paper.id,
        label: paper.title.length > 20 ? paper.title.substring(0, 20) + '...' : paper.title,
        shape: 'dot',
        size: 30, // Large size for user papers
        color: {
          background: '#3b82f6',
          border: '#2563eb',
          highlight: {
            background: '#60a5fa',
            border: '#3b82f6'
          }
        },
        font: { color: '#ffffff', size: 16, face: 'Arial' },
        type: 'user',
        title: paper.title
      });
    });

    // Generate reference papers and connections for each user paper
    papers.forEach((paper, paperIndex) => {
      // Add references (papers that this paper cites)
      const refCount = Math.min(paperIndex + 2, 3); // Fewer references for cleaner graph
      
      for (let i = 0; i < refCount; i++) {
        const refId = `ref-${paper.id}-${i}`;
        nodes.push({
          id: refId,
          label: `Reference ${i+1}`,
          shape: 'dot',
          size: 20, // Medium size for reference papers
          color: {
            background: '#9ca3af',
            border: '#6b7280',
            highlight: {
              background: '#d1d5db',
              border: '#9ca3af'
            }
          },
          font: { size: 12 },
          type: 'reference',
          title: `Reference to "${paper.title}"`
        });
        
        // Add an edge from the user paper to this reference
        edges.push({
          from: paper.id,
          to: refId,
          color: { color: '#6b7280', highlight: '#4b5563' },
          width: 2,
          arrows: { to: { enabled: true, scaleFactor: 0.5 } }
        });
      }
      
      // Add citations (papers that cite this paper)
      if (paperIndex < papers.length - 1) {
        const citationId = `cite-${paper.id}`;
        nodes.push({
          id: citationId,
          label: 'Citation',
          shape: 'dot',
          size: 20,
          color: {
            background: '#9ca3af',
            border: '#6b7280',
            highlight: {
              background: '#d1d5db',
              border: '#9ca3af'
            }
          },
          font: { size: 12 },
          type: 'citation',
          title: `Paper citing "${paper.title}"`
        });
        
        // Add an edge from this citation to the user paper
        edges.push({
          from: citationId,
          to: paper.id,
          color: { color: '#6b7280', highlight: '#4b5563' },
          width: 2,
          arrows: { to: { enabled: true, scaleFactor: 0.5 } }
        });
      }
    });
    
    // Add connections between user papers to create a more interconnected graph
    if (papers.length > 1) {
      for (let i = 0; i < papers.length - 1; i++) {
        // Connect papers via shared references
        const sharedRefId = `shared-ref-${papers[i].id}-${papers[i+1].id}`;
        nodes.push({
          id: sharedRefId,
          label: 'Shared Reference',
          shape: 'dot',
          size: 15,
          color: {
            background: '#9ca3af',
            border: '#6b7280',
            highlight: {
              background: '#d1d5db',
              border: '#9ca3af'
            }
          },
          font: { size: 10 },
          type: 'shared',
          title: `Reference shared by multiple papers`
        });
        
        // Add edges to connect both papers to this shared reference
        edges.push({
          from: papers[i].id,
          to: sharedRefId,
          color: { color: '#6b7280', highlight: '#4b5563' },
          width: 1.5
        });
        edges.push({
          from: papers[i+1].id,
          to: sharedRefId,
          color: { color: '#6b7280', highlight: '#4b5563' },
          width: 1.5
        });
      }
    }

    setGraphData({ nodes, edges });
  }, [papers]);

  // Vis.js network options
  const options = {
    layout: {
      hierarchical: false
    },
    nodes: {
      shape: 'dot',
      scaling: {
        min: 10,
        max: 30,
        label: {
          enabled: true,
          min: 14,
          max: 30
        }
      },
      font: {
        size: 12,
        face: 'Roboto'
      }
    },
    edges: {
      width: 2,
      smooth: {
        type: 'continuous'
      }
    },
    interaction: {
      hover: true,
      tooltipDelay: 200,
      zoomView: true,
      dragView: true,
      hoverConnectedEdges: true,
      hideEdgesOnDrag: false,
      hideEdgesOnZoom: false
    },
    physics: {
      stabilization: {
        iterations: 250
      },
      barnesHut: {
        gravitationalConstant: -10000,
        centralGravity: 0.3,
        springLength: 150,
        springConstant: 0.04,
        damping: 0.09
      }
    },
    height: '500px',
    width: '100%'
  };

  const events = {
    select: function(event) {
      const { nodes } = event;
      if (nodes.length > 0) {
        const selectedNode = graphData.nodes.find(node => node.id === nodes[0]);
        if (selectedNode && selectedNode.type === 'user') {
          navigate(`/papers/${selectedNode.id}`);
        }
      }
    }
  };

  return (
    <div className={cn("bg-white rounded-xl shadow-md border border-gray-100 overflow-hidden", className)}>
      {graphData.nodes.length > 0 ? (
        <div className="relative">
          <Graph
            graph={graphData}
            options={options}
            events={events}
            getNetwork={network => {
              // Save and use the network reference if needed for interactions
              // Optional: can be used to force a redraw or other manipulations
              if (network) {
                console.log("Graph network initialized");
                // Force redraw after a slight delay to ensure proper initialization
                setTimeout(() => {
                  network.redraw();
                }, 100);
              }
            }}
          />
        </div>
      ) : (
        <div className="flex items-center justify-center h-[500px]">
          <p className="text-gray-500">Loading graph data...</p>
        </div>
      )}
      
      <div className="text-center p-4 border-t border-gray-100">
        <p className="text-xs text-gray-500">
          <span className="inline-block h-3 w-3 bg-blue-500 rounded-full mr-1"></span> Your papers
          <span className="inline-block h-3 w-3 bg-gray-400 rounded-full ml-4 mr-1"></span> Referenced papers
        </p>
        <p className="text-xs text-gray-400 mt-1">
          Click on blue nodes to view paper details.
        </p>
      </div>
    </div>
  );
};

export default PaperGraphView;
