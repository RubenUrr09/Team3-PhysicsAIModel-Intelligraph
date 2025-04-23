import React, { useEffect, useRef } from 'react';
import * as d3 from 'd3';

interface MindmapNode extends d3.SimulationNodeDatum {
  id: string;
  label: string;
  description: string;
  type: string;
  color: string;
  x?: number;
  y?: number;
}

interface MindmapLink extends d3.SimulationLinkDatum<MindmapNode> {
  source: string | MindmapNode;
  target: string | MindmapNode;
}

interface MindmapData {
  nodes: MindmapNode[];
  links: MindmapLink[];
}

interface PhysicsMindmapProps {
  data: MindmapData;
}

const PhysicsMindmap: React.FC<PhysicsMindmapProps> = ({ data }) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!data || !data.nodes || !data.links || data.nodes.length === 0) {
      return;
    }

    // Clear any existing SVG content
    d3.select(svgRef.current).selectAll("*").remove();

    const width = svgRef.current?.parentElement?.clientWidth || 800;
    const height = svgRef.current?.parentElement?.clientHeight || 600;

    // Create a copy of the data to avoid mutating the original
    const nodes = [...data.nodes];
    
    // Convert links to use objects instead of indices
    const links = data.links.map(link => {
      return {
        source: typeof link.source === 'string' 
          ? nodes.find(n => n.id === link.source) || link.source 
          : link.source,
        target: typeof link.target === 'string' 
          ? nodes.find(n => n.id === link.target) || link.target 
          : link.target
      };
    });

    // Find the root node (typically with id "root")
    const rootNode = nodes.find(n => n.id === "root") || nodes[0];
    if (rootNode) {
      rootNode.fx = width / 2;
      rootNode.fy = height / 2;
    }

    // Create the SVG container
    const svg = d3.select(svgRef.current)
      .attr("width", width)
      .attr("height", height)
      .attr("viewBox", [0, 0, width, height])
      .attr("style", "max-width: 100%; height: auto;");

    // Create a group for the graph
    const g = svg.append("g");

    // Add zoom functionality
    const zoom = d3.zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.1, 4])
      .on("zoom", (event) => {
        g.attr("transform", event.transform);
      });

    if (svgRef.current) {
      const svgSelection = d3.select(svgRef.current);
      svgSelection.call(zoom);
    }

    // Create tooltip
    const tooltip = d3.select(tooltipRef.current)
      .style("position", "absolute")
      .style("visibility", "hidden")
      .style("background-color", "white")
      .style("border", "1px solid #ddd")
      .style("border-radius", "6px")
      .style("padding", "10px")
      .style("box-shadow", "0 4px 8px rgba(0,0,0,0.1)")
      .style("max-width", "300px")
      .style("font-size", "14px")
      .style("z-index", "1000");

    // Create the simulation
    const simulation = d3.forceSimulation<MindmapNode, MindmapLink>(nodes)
      .force("link", d3.forceLink<MindmapNode, MindmapLink>(links)
        .id(d => d.id)
        .distance(100)
        .strength(0.5))
      .force("charge", d3.forceManyBody().strength(-300))
      .force("center", d3.forceCenter(width / 2, height / 2))
      .force("collision", d3.forceCollide().radius(50));

    // Create the links
    const link = g.append("g")
      .attr("stroke", "#999")
      .attr("stroke-opacity", 0.6)
      .selectAll("line")
      .data(links)
      .join("line")
      .attr("stroke-width", 2);

    // Create the nodes
    const nodeGroups = g.append("g")
      .selectAll("g")
      .data(nodes)
      .join("g")
      .call(drag(simulation))
      .on("mouseover", function(event, d) {
        tooltip
          .style("visibility", "visible")
          .html(`
            <div>
              <h3 style="font-weight: bold; margin: 0 0 5px 0;">${d.label}</h3>
              <p style="margin: 0; color: #555;">${d.description}</p>
            </div>
          `);
        
        // Position tooltip near the mouse but avoid edge of screen
        const [x, y] = d3.pointer(event, document.body);
        tooltip
          .style("left", `${x + 15}px`)
          .style("top", `${y}px`);
      })
      .on("mousemove", function(event) {
        const [x, y] = d3.pointer(event, document.body);
        tooltip
          .style("left", `${x + 15}px`)
          .style("top", `${y}px`);
      })
      .on("mouseout", function() {
        tooltip.style("visibility", "hidden");
      });

    // Node circles
    nodeGroups.append("circle")
      .attr("r", d => d.id === "root" ? 25 : 20)
      .attr("fill", d => d.color)
      .attr("stroke", "#fff")
      .attr("stroke-width", 2);

    // Node labels
    nodeGroups.append("text")
      .text(d => d.label)
      .attr("text-anchor", "middle")
      .attr("dy", d => d.id === "root" ? "0.35em" : "2.5em")
      .attr("font-size", d => d.id === "root" ? "14px" : "12px")
      .attr("font-weight", d => d.id === "root" ? "bold" : "normal")
      .attr("fill", "#333")
      .style("pointer-events", "none");

    // Create drag handler
    function drag(simulation: d3.Simulation<MindmapNode, MindmapLink>) {
      function dragstarted(event: any, d: MindmapNode) {
        if (!event.active) simulation.alphaTarget(0.3).restart();
        d.fx = d.x;
        d.fy = d.y;
      }
      
      function dragged(event: any, d: MindmapNode) {
        d.fx = event.x;
        d.fy = event.y;
      }
      
      function dragended(event: any, d: MindmapNode) {
        if (!event.active) simulation.alphaTarget(0);
        if (d.id !== "root") { // Keep root node fixed
          d.fx = null;
          d.fy = null;
        }
      }
      
      return d3.drag<any, MindmapNode>()
        .on("start", dragstarted)
        .on("drag", dragged)
        .on("end", dragended);
    }

    // Update positions
    simulation.on("tick", () => {
      link
        .attr("x1", d => (d.source as MindmapNode).x || 0)
        .attr("y1", d => (d.source as MindmapNode).y || 0)
        .attr("x2", d => (d.target as MindmapNode).x || 0)
        .attr("y2", d => (d.target as MindmapNode).y || 0);

      nodeGroups.attr("transform", d => `translate(${d.x || 0},${d.y || 0})`);
    });

    // Initial zoom to fit
    const initialTransform = d3.zoomIdentity
      .translate(width / 2, height / 2)
      .scale(0.8)
      .translate(-width / 2, -height / 2);
      
    if (svgRef.current) {
      d3.select(svgRef.current).call(zoom.transform, initialTransform);
    }

    // Cleanup function
    return () => {
      simulation.stop();
    };
  }, [data]);

  return (
    <div className="relative w-full h-full">
      <svg ref={svgRef} className="w-full h-full"></svg>
      <div ref={tooltipRef} className="absolute pointer-events-none"></div>
    </div>
  );
};

export default PhysicsMindmap;