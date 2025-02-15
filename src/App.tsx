import { useState, useRef, useEffect } from 'react'
import { Label } from "@/components/ui/label"
import { Slider } from "@/components/ui/slider"
import { Upload, Download } from 'lucide-react'
import { Switch } from "@/components/ui/switch"
import ReactConfetti from 'react-confetti'
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
  const [isCompleted, setIsCompleted] = useState(false);
  const [windowSize, setWindowSize] = useState({
    width: window.innerWidth,
    height: window.innerHeight,
  });

  const handleWeightChange = (color: 'r' | 'g' | 'b', value: number[]) => {
    setWeights(prev => ({
      ...prev,
      [color]: value[0]
    }));
  };

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    console.log("file", file)
    if (file) {
      setImageFile(file);
      setIsLoading(false);
      console.log("file", file)
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

  useEffect(() => {
    const handleResize = () => {
      setWindowSize({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleExportImage = () => {
    const canvas = canvasRef.current;
    if (!canvas || !imageFile) return;

    const link = document.createElement('a');
    link.download = `pixel-${imageFile.name}`;
    link.href = canvas.toDataURL('image/png');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleComplete = () => {
    setIsCompleted(true);
  };

  const handleReset = () => {
    setImageFile(null);
    setIsLoading(false);
    setIsColorMode(false);
    setWeights({
      r: 0.299,
      g: 0.587,
      b: 0.114
    });
  }

  if (isCompleted && imageFile) {
    return (
      <div className="min-h-screen p-4 md:p-8 relative">
        <ReactConfetti
          width={windowSize.width}
          height={windowSize.height}
          recycle={false}
          numberOfPieces={200}
          gravity={0.2}
        />
        <div className="container max-w-2xl mx-auto space-y-6">
          <div className="text-center space-y-4">
            <h1 className="text-2xl font-bold">🎉 完成啦！</h1>
            <p className="text-muted-foreground">
              你的像素艺术已经准备就绪
            </p>
          </div>

          <div className="relative aspect-square w-full overflow-hidden rounded-lg border bg-background">
            <canvas
              ref={canvasRef}
              className="absolute inset-0 w-full h-full object-contain"
            />
          </div>

          <div className="flex justify-center gap-4">
            <button
              className="button button-ghost"
              onClick={handleReset}
            >
              重新开始
            </button>
            <button
              className="button button-primary flex items-center gap-2"
              onClick={handleExportImage}
            >
              <Download className="w-4 h-4" />
              保存图片
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className='flex flex-col h-full w-full max-w-full max-h-full box-border relative overflow-hidden justify-between'>
      <div className="p-4 md:p-8 overflow-auto w-full max-w-full h-full max-h-full box-border relative">
        <span className='md:rounded-full bg-gradient-to-t md:bg-gradient-to-r from-sky-400 to-teal-300 opacity-40 aspect-square blur-3xl absolute -z-10 w-[100%] md:w-full bottom-[calc(100%-120px)] left-1/2 -translate-x-1/2 md:left-0 md:translate-x-0'></span>
        <div className="container max-w-2xl mx-auto space-y-6">
          <div className="flex items-center justify-between">
            <div className="text-l font-bold">Pixel Picture</div>
          </div>

          {
            !imageFile && <div className="grid place-items-center">
              <Label
                htmlFor="file-upload"
                className="cursor-pointer w-full max-w-[300px]"
              >
                <div className="flex flex-col items-center gap-2 p-6 border-2 border-dashed rounded-lg hover:border-primary transition-colors">
                  <Upload className="w-8 h-8 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">
                    点击选择图片
                  </span>
                </div>
                <input
                  id="file-upload"
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                  disabled={isLoading}
                  aria-label="Upload image"
                />
              </Label>
            </div>
          }


          {isLoading && (
            <div className="flex items-center justify-center text-muted-foreground">
              处理中...
            </div>
          )}

          <div className="space-y-4">
            {imageFile && !isLoading && (
              <>
                <div className="relative aspect-square w-full overflow-hidden rounded-lg">
                  <canvas
                    ref={canvasRef}
                    className="absolute inset-0 w-full h-full object-contain"
                  />
                </div>
                <div className="px-4 space-y-6 pb-[50px]">
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

                  <div className="flex items-center justify-between">
                    <Label htmlFor="color-mode">彩色模式</Label>
                    <Switch
                      id="color-mode"
                      checked={isColorMode}
                      onCheckedChange={setIsColorMode}
                      disabled={isLoading}
                    />
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div >
      <div className='flex justify-between gap-2 px-4 md:px-0 py-2 mt-2 border-t border-gray-400/20'>
        <button className='button button-ghost danger' onClick={handleReset}>重置</button>
        <button 
          className='button button-ghost'
          onClick={handleComplete}
          disabled={!imageFile || isLoading}
        >
          完成
        </button>
      </div>
    </div>


  )
}

export default App
