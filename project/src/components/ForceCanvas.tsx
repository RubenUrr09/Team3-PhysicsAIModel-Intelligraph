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

    // Clear canvas
    ctx.clearRect(0, 0, width, height);

    // Set origin to center of canvas
    const centerX = width / 2;
    const centerY = height / 2;
    ctx.translate(centerX, centerY);

    // Scale factor for forces (pixels per Newton)
    const scale = Math.min(width, height) / 4 / Math.max(...forces.map(f => f.magnitude), 1);

    forces.forEach((force) => {
      // Convert angle to radians (assuming input is in degrees)
      const angleRad = (force.angle * Math.PI) / 180;

      // Calculate end point
      const endX = force.magnitude * scale * Math.cos(angleRad);
      const endY = -force.magnitude * scale * Math.sin(angleRad); // Negative because canvas Y is inverted

      // Draw arrow
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(endX, endY);
      ctx.strokeStyle = force.color;
      ctx.lineWidth = 2;
      ctx.stroke();

      // Draw arrowhead
      const headLength = 10;
      const angle = Math.atan2(endY, endX);
      ctx.beginPath();
      ctx.moveTo(endX, endY);
      ctx.lineTo(
        endX - headLength * Math.cos(angle - Math.PI / 6),
        endY - headLength * Math.sin(angle - Math.PI / 6)
      );
      ctx.moveTo(endX, endY);
      ctx.lineTo(
        endX - headLength * Math.cos(angle + Math.PI / 6),
        endY - headLength * Math.sin(angle + Math.PI / 6)
      );
      ctx.stroke();

      // Add label
      ctx.fillStyle = force.color;
      ctx.font = '14px Arial';
      ctx.textAlign = 'center';
      ctx.fillText(
        `${force.label} (${force.magnitude}N)`,
        endX * 1.2,
        endY * 1.2
      );
    });

    // Reset transformation
    ctx.setTransform(1, 0, 0, 1, 0, 0);
  }, [forces, width, height]);

  return (
    <canvas
      ref={canvasRef}
      width={width}
      height={height}
      className="border border-gray-200 rounded-lg"
    />
  );
};

export default ForceCanvas;