import React, { useEffect, useRef } from "react";

const Background3D = () => {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    let animationFrameId;

    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resizeCanvas();
    window.addEventListener("resize", resizeCanvas);

    // Dynamic Mobile Floating Food Particles
    const particles = Array.from({ length: 40 }, () => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      radius: Math.random() * 3.5 + 1.5,
      color: ["#dc2626", "#f59e0b", "#fbbf24", "#ef4444"][Math.floor(Math.random() * 4)],
      speedY: Math.random() * 0.6 + 0.2,
      angle: Math.random() * Math.PI * 2,
    }));

    let rotationAngle = 0;

    const render = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // 1. Render Floating Glowing Particles
      particles.forEach((p) => {
        p.y -= p.speedY;
        p.angle += 0.02;
        p.x += Math.sin(p.angle) * 0.4;

        if (p.y < -10) {
          p.y = canvas.height + 10;
          p.x = Math.random() * canvas.width;
        }

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fillStyle = p.color;
        ctx.globalAlpha = 0.5; // Increased visibility
        ctx.fill();
      });

      // 2. Render 3D Spinning Rice Bowl in Screen Center
      const centerX = canvas.width / 2;
      const centerY = canvas.height * 0.45;
      const radius = Math.min(canvas.width * 0.4, 180); // Responsive size
      rotationAngle += 0.006;

      ctx.save();
      ctx.translate(centerX, centerY);
      ctx.rotate(rotationAngle);
      ctx.globalAlpha = 0.22; // Visible 3D lines through cards
      ctx.strokeStyle = "#dc2626";
      ctx.lineWidth = 1.5;

      // 3D Bowl Ellipses
      for (let i = -3; i <= 3; i++) {
        ctx.beginPath();
        ctx.ellipse(0, i * 16, radius, radius * 0.45, (i * Math.PI) / 12, 0, Math.PI * 2);
        ctx.stroke();
      }

      ctx.restore();
      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener("resize", resizeCanvas);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return <canvas ref={canvasRef} className="bg-3d-canvas" />;
};

export default Background3D;