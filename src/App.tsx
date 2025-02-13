import { useState, useRef, useEffect } from 'react'
import './App.css'

function App() {
  const [imageFile, setImageFile] = useState<File | null>(null);
  const canvasRef = useRef<HTMLDivElement>(null);
  const [pixelSize] = useState(1); // 每个像素点的大小
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
            // 清空之前的内容
            while (canvasRef.current?.firstChild) {
              canvasRef.current.removeChild(canvasRef.current.firstChild);
            }

            // 创建临时 canvas 来读取像素数据
            const tempCanvas = document.createElement('canvas');
            const tempCtx = tempCanvas.getContext('2d');
            if (!tempCtx) return;

            // 设置临时画布大小
            tempCanvas.width = img.width;
            tempCanvas.height = img.height;

            // 绘制图片到临时画布
            tempCtx.drawImage(img, 0, 0);

            // 获取像素数据
            const imageData = tempCtx.getImageData(0, 0, img.width, img.height);
            const pixels = imageData.data;

            // 设置容器样式
            if (canvasRef.current) {
              canvasRef.current.style.width = `${img.width}px`;
              canvasRef.current.style.height = `${img.height}px`;
              canvasRef.current.style.position = 'relative';
            }

            // 创建像素点
            for (let y = 0; y < img.height; y += 5) {
              for (let x = 0; x < img.width; x += 5) {
                const index = (y * img.width + x) * 4;
                const r = pixels[index];
                const g = pixels[index + 1];
                const b = pixels[index + 2];
                // 使用自定义权重计算灰度值
                const grayscale = weights.r * r + weights.g * g + weights.b * b;
                const color = grayscale > 128 ? 'white' : 'black';

                const pixel = document.createElement('div');
                pixel.style.position = 'absolute';
                pixel.style.left = `${x * pixelSize}px`;
                pixel.style.top = `${y * pixelSize}px`;
                pixel.style.width = `${pixelSize}px`;
                pixel.style.height = `${pixelSize}px`;
                pixel.style.backgroundColor = color;

                canvasRef.current?.appendChild(pixel);
              }
            }
          } finally {
            setIsLoading(false);
          }
        };
      }
    };

    reader.readAsDataURL(imageFile);
  }, [imageFile, pixelSize, weights]);

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
      <div ref={canvasRef} className="pixel-canvas"></div>
    </div>
  )
}

export default App
