import { useState, useRef, useEffect } from 'react'
import './App.css'

function App() {
  const [imageFile, setImageFile] = useState<File | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [weights, setWeights] = useState({
    r: 0.299,
    g: 0.587,
    b: 0.114
  });

  const handleWeightChange = (color: 'r' | 'g' | 'b', value: string) => {
    const numValue = parseFloat(value) || 0;
    setWeights(prev => ({
      ...prev,
      [color]: numValue
    }));
  };

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setImageFile(file);
      setIsLoading(true);
    }
  };

  useEffect(() => {
    if (!imageFile || !canvasRef.current) return;

    const img = new Image();
    const reader = new FileReader();

    reader.onload = (e) => {
      if (typeof e.target?.result === 'string') {
        img.src = e.target.result;
        img.onload = () => {
          try {
            const canvas = canvasRef.current;
            const ctx = canvas?.getContext('2d');
            if (!ctx || !canvas) return;

            // 设置画布大小
            canvas.width = img.width;
            canvas.height = img.height;

            // 创建临时 canvas 来读取像素数据
            const tempCanvas = document.createElement('canvas');
            const tempCtx = tempCanvas.getContext('2d');
            if (!tempCtx) return;

            tempCanvas.width = img.width;
            tempCanvas.height = img.height;
            tempCtx.drawImage(img, 0, 0);

            const imageData = tempCtx.getImageData(0, 0, img.width, img.height);
            const pixels = imageData.data;

            // 清空画布
            ctx.fillStyle = 'black';
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            // 绘制像素点
            for (let y = 0; y < img.height; y += 5) {
              for (let x = 0; x < img.width; x += 5) {
                const index = (y * img.width + x) * 4;
                const r = pixels[index];
                const g = pixels[index + 1];
                const b = pixels[index + 2];
                // 使用自定义权重计算灰度值
                const grayscale = weights.r * r + weights.g * g + weights.b * b;
                ctx.fillStyle = grayscale > 128 ? 'white' : 'black';
                // 绘制像素点
                ctx.fillRect(x, y, 2, 2);
              }
            }
          } finally {
            setIsLoading(false);
          }
        };
      }
    };

    reader.readAsDataURL(imageFile);
  }, [imageFile, weights]);

  return (
    <div className="app-container">
      <div className="controls">
        <div className="weight-inputs">
          <label>
            R权重:
            <input
              type="number"
              step="0.001"
              value={weights.r}
              onChange={(e) => handleWeightChange('r', e.target.value)}
              disabled={isLoading}
            />
          </label>
          <label>
            G权重:
            <input
              type="number"
              step="0.001"
              value={weights.g}
              onChange={(e) => handleWeightChange('g', e.target.value)}
              disabled={isLoading}
            />
          </label>
          <label>
            B权重:
            <input
              type="number"
              step="0.001"
              value={weights.b}
              onChange={(e) => handleWeightChange('b', e.target.value)}
              disabled={isLoading}
            />
          </label>
        </div>
        <input
          type="file"
          accept="image/*"
          onChange={handleImageUpload}
          className="file-input"
          disabled={isLoading}
        />
      </div>
      {isLoading && <div className="loading">Processing image...</div>}
      <canvas ref={canvasRef} className="pixel-canvas"></canvas>
    </div>
  )
}

export default App
