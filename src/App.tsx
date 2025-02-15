import { useState, useRef, useEffect } from 'react'
import { Label } from "@/components/ui/label"
import { Slider } from "@/components/ui/slider"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Upload, Download } from 'lucide-react'
import { Switch } from "@/components/ui/switch"

import './App.css'

function App() {
  const [imageFile, setImageFile] = useState<File | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isColorMode, setIsColorMode] = useState(false);
  const [weights, setWeights] = useState({
    r: 0.299,
    g: 0.587,
    b: 0.114
  });

  const handleWeightChange = (color: 'r' | 'g' | 'b', value: number[]) => {
    setWeights(prev => ({
      ...prev,
      [color]: value[0]
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
                const grayscale = weights.r * r + weights.g * g + weights.b * b;
                if (grayscale > 128) {
                  if (isColorMode) {
                    // 彩色模式
                    const step = Math.floor((grayscale - 128) / 50);
                    switch (step) {
                      case 0:
                        ctx.fillStyle = 'rgb(255, 0, 0)';
                        break;
                      case 1:
                        ctx.fillStyle = 'rgb(0, 255, 0)';
                        break;
                      case 2:
                        ctx.fillStyle = 'rgb(0, 0, 255)';
                        break;
                      default:
                        ctx.fillStyle = 'rgb(255, 255, 255)';
                    }
                  } else {
                    // 黑白模式
                    ctx.fillStyle = 'white';
                  }
                } else {
                  ctx.fillStyle = 'black';
                }
                ctx.fillRect(x, y, 3, 3);
              }
            }
          } finally {
            setIsLoading(false);
          }
        };
      }
    };

    reader.readAsDataURL(imageFile);
  }, [imageFile, weights, isColorMode]);

  const handleExportImage = () => {
    const canvas = canvasRef.current;
    if (!canvas || !imageFile) return;

    // 创建临时链接
    const link = document.createElement('a');
    link.download = `pixel-${imageFile.name}`;
    link.href = canvas.toDataURL('image/png');

    // 触发下载
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="min-h-screen p-4 md:p-8">
      <span className='md:rounded-full bg-gradient-to-t md:bg-gradient-to-r from-sky-400 to-teal-300 opacity-40 aspect-square blur-3xl absolute -z-10 w-[150%] md:w-full bottom-[calc(100%-120px)] left-1/2 -translate-x-1/2 md:left-0 md:translate-x-0'></span>
      <div className="container max-w-2xl mx-auto space-y-6">
        <div>Pixel Picture</div>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>R 通道权重</Label>
            <Slider
              value={[weights.r]}
              onValueChange={(value) => handleWeightChange('r', value)}
              min={0}
              max={1}
              step={0.001}
              disabled={isLoading}
            />
            <div className="text-sm text-muted-foreground">
              当前值: {weights.r.toFixed(3)}
            </div>
          </div>
          <div className="space-y-2">
            <Label>G 通道权重</Label>
            <Slider
              value={[weights.g]}
              onValueChange={(value) => handleWeightChange('g', value)}
              min={0}
              max={1}
              step={0.001}
              disabled={isLoading}
            />
            <div className="text-sm text-muted-foreground">
              当前值: {weights.g.toFixed(3)}
            </div>
          </div>
          <div className="space-y-2">
            <Label>B 通道权重</Label>
            <Slider
              value={[weights.b]}
              onValueChange={(value) => handleWeightChange('b', value)}
              min={0}
              max={1}
              step={0.001}
              disabled={isLoading}
            />
            <div className="text-sm text-muted-foreground">
              当前值: {weights.b.toFixed(3)}
            </div>
          </div>
        </div>
        <div className="flex items-center justify-between px-2">
          <Label htmlFor="color-mode">彩色模式</Label>
          <Switch
            id="color-mode"
            checked={isColorMode}
            onCheckedChange={setIsColorMode}
            disabled={isLoading}
          />
        </div>

        <div className="grid place-items-center">
          <Label
            htmlFor="file-upload"
            className="cursor-pointer w-full max-w-[300px]"
          >
            <div className="flex flex-col items-center gap-2 p-6 border-2 border-dashed rounded-lg hover:border-primary transition-colors">
              <Upload className="w-8 h-8 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">
                {imageFile ? imageFile.name : '点击选择图片'}
              </span>
            </div>
            <input
              id="file-upload"
              type="file"
              accept="image/*"
              onChange={handleImageUpload}
              className="hidden"
              disabled={isLoading}
            />
          </Label>
        </div>

        {isLoading && (
          <div className="flex items-center justify-center text-muted-foreground">
            处理中...
          </div>
        )}

        <Card>
          <CardContent className="p-4">
            <div className="space-y-4">
              <div className="relative aspect-square w-full overflow-hidden rounded-lg border bg-background">
                <canvas
                  ref={canvasRef}
                  className="absolute inset-0 w-full h-full object-contain"
                />
              </div>
              {imageFile && !isLoading && (
                <div className="flex justify-center">
                  <Button
                    onClick={handleExportImage}
                    className="flex items-center gap-2"
                  >
                    <Download className="w-4 h-4" />
                    导出图片
                  </Button>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export default App
