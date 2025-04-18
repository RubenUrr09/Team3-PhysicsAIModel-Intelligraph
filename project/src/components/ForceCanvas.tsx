import React, { useEffect, useRef } from 'react';

interface Force {
  magnitude: number;
  angle: number;
  color: string;
  label: string;
}

interface ForceCanvasProps {
  forces: Force[];
  width: number;
  height: number;
}

const ForceCanvas: React.FC<ForceCanvasProps> = ({ forces, width, height }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // IMPORTANT: Reset transformation matrix before clearing
    // This ensures we're working with a clean canvas each time
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, width, height);

    // Set origin to center of canvas
    const centerX = width / 2;
    const centerY = height / 2;
    ctx.translate(centerX, centerY);

    // Draw coordinate system
    drawCoordinateSystem(ctx, width, height);

    // Calculate max force for scaling
    const maxForce = Math.max(...forces.map(f => f.magnitude), 10);
    
    // Scale factor for forces (pixels per Newton)
    // Using a more conservative scale to ensure forces fit nicely
    const scale = Math.min(width, height) * 0.35 / maxForce;

    // Draw all forces
    forces.forEach((force) => {
      drawForce(ctx, force, scale);
    });
    
    // Draw resultant force if there are multiple forces
    if (forces.length > 1) {
      drawResultantForce(ctx, forces, scale);
    }
    
    // Draw central object
    drawCentralObject(ctx);
    
    // Draw legend
    drawLegend(ctx, forces, width, height);

    // Return a cleanup function that resets the canvas when component unmounts or forces change
    return () => {
      if (ctx && canvas) {
        ctx.setTransform(1, 0, 0, 1, 0, 0);
        ctx.clearRect(0, 0, canvas.width, canvas.height);
      }
    };
  }, [forces, width, height]);

  // Draw coordinate system with axes and labels
  const drawCoordinateSystem = (ctx: CanvasRenderingContext2D, width: number, height: number) => {
    const axisLength = Math.min(width, height) * 0.4;
    
    // Draw axes
    ctx.beginPath();
    ctx.strokeStyle = '#CCCCCC';
    ctx.lineWidth = 1;
    
    // X-axis
    ctx.moveTo(-axisLength, 0);
    ctx.lineTo(axisLength, 0);
    
    // Y-axis
    ctx.moveTo(0, -axisLength);
    ctx.lineTo(0, axisLength);
    
    // Draw tick marks
    const tickSize = 5;
    const tickInterval = axisLength / 5;
    
    for (let i = 1; i <= 5; i++) {
      // X-axis ticks
      ctx.moveTo(i * tickInterval, -tickSize);
      ctx.lineTo(i * tickInterval, tickSize);
      ctx.moveTo(-i * tickInterval, -tickSize);
      ctx.lineTo(-i * tickInterval, tickSize);
      
      // Y-axis ticks
      ctx.moveTo(-tickSize, i * tickInterval);
      ctx.lineTo(tickSize, i * tickInterval);
      ctx.moveTo(-tickSize, -i * tickInterval);
      ctx.lineTo(tickSize, -i * tickInterval);
    }
    
    ctx.stroke();
    
    // Draw axis labels
    ctx.fillStyle = '#666666';
    ctx.font = '12px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('+x', axisLength + 15, 15);
    ctx.fillText('+y', 15, -axisLength - 10);
  };

  // Draw a central object representing the point of application
  const drawCentralObject = (ctx: CanvasRenderingContext2D) => {
    ctx.beginPath();
    ctx.arc(0, 0, 10, 0, Math.PI * 2);
    ctx.fillStyle = '#666666';
    ctx.fill();
    ctx.strokeStyle = '#444444';
    ctx.lineWidth = 2;
    ctx.stroke();
  };

  // Draw a single force vector
  const drawForce = (ctx: CanvasRenderingContext2D, force: Force, scale: number) => {
    // Convert angle to radians (assuming input is in degrees)
    const angleRad = (force.angle * Math.PI) / 180;

    // Calculate end point
    const endX = force.magnitude * scale * Math.cos(angleRad);
    const endY = -force.magnitude * scale * Math.sin(angleRad); // Negative because canvas Y is inverted

    // Draw arrow shaft with improved style
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(endX, endY);
    ctx.strokeStyle = force.color;
    ctx.lineWidth = 3;
    ctx.stroke();

    // Draw arrowhead
    const headLength = 12;
    const headWidth = 8;
    const angle = Math.atan2(endY, endX);
    
    // Calculate arrow head coordinates
    const x1 = endX - headLength * Math.cos(angle - Math.PI / 8);
    const y1 = endY - headLength * Math.sin(angle - Math.PI / 8);
    const x2 = endX - headLength * Math.cos(angle + Math.PI / 8);
    const y2 = endY - headLength * Math.sin(angle + Math.PI / 8);
    
    // Draw filled arrowhead
    ctx.beginPath();
    ctx.moveTo(endX, endY);
    ctx.lineTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.closePath();
    ctx.fillStyle = force.color;
    ctx.fill();

    // Add label with magnitude and angle
    const labelDistance = force.magnitude * scale * 1.15;
    const labelX = labelDistance * Math.cos(angleRad);
    const labelY = -labelDistance * Math.sin(angleRad);
    
    ctx.font = 'bold 12px Arial';
    ctx.fillStyle = force.color;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    
    // Add background to make text more readable
    const labelText = `${force.label} (${force.magnitude}N, ${force.angle}°)`;
    const metrics = ctx.measureText(labelText);
    const labelWidth = metrics.width + 8;
    const labelHeight = 20;
    
    ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
    ctx.fillRect(
      labelX - labelWidth / 2,
      labelY - labelHeight / 2,
      labelWidth,
      labelHeight
    );
    
    ctx.fillStyle = force.color;
    ctx.fillText(labelText, labelX, labelY);
  };

  // Calculate and draw the resultant force
  const drawResultantForce = (ctx: CanvasRenderingContext2D, forces: Force[], scale: number) => {
    // Calculate resultant force components
    let resultantX = 0;
    let resultantY = 0;
    
    forces.forEach(force => {
      const angleRad = (force.angle * Math.PI) / 180;
      resultantX += force.magnitude * Math.cos(angleRad);
      resultantY += force.magnitude * Math.sin(angleRad);
    });
    
    // Calculate resultant magnitude and angle
    const resultantMagnitude = Math.sqrt(resultantX * resultantX + resultantY * resultantY);
    let resultantAngle = Math.atan2(resultantY, resultantX) * 180 / Math.PI;
    
    // Make sure angle is between 0 and 360
    if (resultantAngle < 0) {
      resultantAngle += 360;
    }
    
    // Draw resultant force with dashed line
    const resultantForce = {
      magnitude: resultantMagnitude,
      angle: resultantAngle,
      color: '#FF00FF', // Magenta
      label: 'Resultant'
    };
    
    // Set dashed line pattern
    ctx.setLineDash([5, 3]);
    drawForce(ctx, resultantForce, scale);
    ctx.setLineDash([]);
  };

  // Draw a legend showing all forces
  const drawLegend = (ctx: CanvasRenderingContext2D, forces: Force[], width: number, height: number) => {
    // Reset transformation to draw in screen coordinates
    const currentTransform = ctx.getTransform();
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    
    const padding = 10;
    const lineHeight = 20;
    const legendWidth = 200;
    const legendHeight = (forces.length + 1) * lineHeight + padding * 2;
    
    // Draw legend background
    ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
    ctx.fillRect(
      width - legendWidth - padding,
      padding,
      legendWidth,
      legendHeight
    );
    
    ctx.strokeStyle = '#CCCCCC';
    ctx.lineWidth = 1;
    ctx.strokeRect(
      width - legendWidth - padding,
      padding,
      legendWidth,
      legendHeight
    );
    
    // Draw legend title
    ctx.font = 'bold 14px Arial';
    ctx.fillStyle = '#333333';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    ctx.fillText('Forces', width - legendWidth - padding + 10, padding + 10);
    
    // Draw force entries
    ctx.font = '12px Arial';
    forces.forEach((force, index) => {
      const y = padding + (index + 1) * lineHeight + 10;
      
      // Draw color box
      ctx.fillStyle = force.color;
      ctx.fillRect(width - legendWidth - padding + 10, y, 15, 15);
      
      // Draw label
      ctx.fillStyle = '#333333';
      ctx.fillText(
        `${force.label} (${force.magnitude.toFixed(2)}N, ${force.angle.toFixed(1)}°)`,
        width - legendWidth - padding + 35,
        y + 2
      );
    });
    
    // If there are multiple forces, add resultant force to legend
    if (forces.length > 1) {
      const index = forces.length;
      const y = padding + (index + 1) * lineHeight + 10;
      
      // Calculate resultant
      let resultantX = 0;
      let resultantY = 0;
      
      forces.forEach(force => {
        const angleRad = (force.angle * Math.PI) / 180;
        resultantX += force.magnitude * Math.cos(angleRad);
        resultantY += force.magnitude * Math.sin(angleRad);
      });
      
      const resultantMagnitude = Math.sqrt(resultantX * resultantX + resultantY * resultantY);
      let resultantAngle = Math.atan2(resultantY, resultantX) * 180 / Math.PI;
      if (resultantAngle < 0) resultantAngle += 360;
      
      // Draw resultant in legend
      ctx.fillStyle = '#FF00FF';
      ctx.fillRect(width - legendWidth - padding + 10, y, 15, 15);
      
      ctx.fillStyle = '#333333';
      ctx.fillText(
        `Resultant (${resultantMagnitude.toFixed(2)}N, ${resultantAngle.toFixed(1)}°)`,
        width - legendWidth - padding + 35,
        y + 2
      );
    }
    
    // Restore the previous transformation
    ctx.setTransform(currentTransform);
  };

  return (
    <canvas
      ref={canvasRef}
      width={width}
      height={height}
      className="border border-gray-200 rounded-lg shadow-inner bg-gray-50"
    />
  );
};

export default ForceCanvas;