if (typeof registerPaint === 'function') {
  registerPaint('foil-shine', class {
    static get inputProperties() {
      return ['--foil-accent'];
    }

    paint(ctx, size, props) {
      const accent = props.get('--foil-accent').toString().trim() || '#8be9fd';
      const gradient = ctx.createLinearGradient(0, 0, size.width, size.height);
      gradient.addColorStop(0, 'rgba(255,255,255,0)');
      gradient.addColorStop(0.22, accent);
      gradient.addColorStop(0.45, 'rgba(255,255,255,0.82)');
      gradient.addColorStop(0.68, '#7df7ff');
      gradient.addColorStop(1, 'rgba(255,255,255,0)');

      ctx.globalAlpha = 0.28;
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, size.width, size.height);

      ctx.globalAlpha = 0.24;
      ctx.strokeStyle = 'rgba(255,255,255,0.72)';
      ctx.lineWidth = 1;
      for (let y = -size.height; y < size.height * 2; y += 14) {
        ctx.beginPath();
        ctx.moveTo(-20, y);
        ctx.bezierCurveTo(size.width * 0.28, y + 24, size.width * 0.66, y - 24, size.width + 20, y + 18);
        ctx.stroke();
      }
    }
  });
}

