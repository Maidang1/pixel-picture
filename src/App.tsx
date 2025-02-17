import React, { useState, useRef, useEffect } from 'react'
import { Label } from "@/components/ui/label"
import { Slider } from "@/components/ui/slider"
import { Download, ChevronLeft } from 'lucide-react'
import { Switch } from "@/components/ui/switch"
import { GridPattern } from "@/components/magicui/grid-pattern"
import { ShinyButton } from "@/components/magicui/shiny-button"
import { RippleButton } from "@/components/magicui/ripple-button"
import { Marquee } from "@/components/magicui/marquee";
import ReactConfetti from 'react-confetti'
import { cn } from "@/lib/utils";


import one from './assets/pixel-image/one.jpeg'
import two from './assets/pixel-image/two.jpeg'
import three from './assets/pixel-image/three.jpeg'
import four from './assets/pixel-image/four.jpeg'

import './App.css'

export function GridBackground(props: { children: React.ReactNode }) {
  return (
    <div className="relative flex h-full w-full flex-col items-center justify-center overflow-hidden rounded-lg border">
      <GridPattern
        width={30}
        height={30}
        x={-1}
        y={-1}
        strokeDasharray={"4 2"}
        className={cn(
          "[mask-image:radial-gradient(600px_circle_at_center,white,transparent)]",
        )}
      />
      {props.children}
    </div>
  );
}



const imagePath = [
  one,
  two,
  three,
  four,
]

export function MarqueeList() {
  return (
    <div className="relative flex w-full flex-col items-center justify-center overflow-hidden">
      <Marquee className="[--duration:20s]">
        {imagePath.map((item, index) => (
          <div key={index} className="w-full h-full">
            <img src={item} alt="pixel art" className="w-[250px] h-auto object-cover" />
          </div>
        ))}
      </Marquee>
    </div>
  );
}



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
  const [canvasData, setCanvasData] = useState<string | null>(null);
  const [pixelSize, setPixelSize] = useState(3);
  const [sampleSize, setSampleSize] = useState(5);

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
            for (let y = 0; y < img.height; y += sampleSize) {
              for (let x = 0; x < img.width; x += sampleSize) {
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
                ctx.fillRect(x, y, pixelSize, pixelSize);
              }
            }

            // 在完成渲染后保存 canvas 数据
            setCanvasData(canvas.toDataURL('image/png'));
          } finally {
            setIsLoading(false);
          }
        };
      }
    };

    reader.readAsDataURL(imageFile);
  }, [imageFile, weights, isColorMode, pixelSize, sampleSize]);

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

  useEffect(() => {
    if (isCompleted && canvasRef.current && canvasData) {
      const img = new Image();
      img.onload = () => {
        const canvas = canvasRef.current;
        const ctx = canvas?.getContext('2d');
        if (!ctx || !canvas) return;

        // 设置 canvas 尺寸
        canvas.width = img.width;
        canvas.height = img.height;

        // 绘制保存的图像
        ctx.drawImage(img, 0, 0);
      };
      img.src = canvasData;
    }
  }, [isCompleted, canvasData]);

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
    if (canvasRef.current) {
      // 确保在切换到完成界面前保存当前 canvas 数据
      setCanvasData(canvasRef.current.toDataURL('image/png'));
    }
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
      <GridBackground>
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

            <div className="relative aspect-square w-full overflow-hidden rounded-lg">
              <canvas
                ref={canvasRef}
                className="absolute inset-0 w-full h-full object-contain"
              />
            </div>

            <div className="flex justify-center gap-4">
              <button
                className="btn btn-normal flex items-center gap-2"
                onClick={() => {
                  setIsCompleted(false);
                  handleReset();
                }}
              >
                <ChevronLeft className="w-4 h-4" />
                返回
              </button>
              <button
                className="btn btn-normal flex items-center gap-2"
                onClick={handleExportImage}
              >
                <Download className="w-4 h-4" />
                保存图片
              </button>
            </div>
            <div className='py-4 md:px-1 px-4 text-xs text-center text-black/30'>
              <div className='text-center'>灵感来源于许嵩的《摄影艺术》的歌词</div>
              <div className='text-center text-primary'>”数码时代用千万像素，制造出当我把你放大到底后，只剩马赛克的失意“</div>
              <div className='text-center'>网站设计灵感来源于：<a href='https://poem.mayday.land' target='_blank' rel='noopener' className='text-primary underline'>Mayday 拼贴诗</a></div>
            </div>
          </div>
        </div>
      </GridBackground>
    );
  }

  return (
    <GridBackground>
      <div className='flex flex-col h-full w-full max-w-full max-h-full box-border relative overflow-hidden justify-between'>
        <div className="p-4 md:p-8 overflow-auto w-full max-w-full h-full max-h-full box-border relative">
          {/* <span className='md:rounded-full bg-gradient-to-t md:bg-gradient-to-r from-sky-400 to-teal-100 opacity-40 aspect-square blur-3xl absolute -z-10 w-[100%] md:w-full bottom-[calc(85%-200px)] left-1/2 -translate-x-1/2 md:left-0 md:translate-x-0'></span> */}
          <div className="container max-w-2xl mx-auto space-y-6 h-full">
            <div className="flex justify-between flex-col flex-start items-start">
              <div className="text-2xl font-bold">Pixel Picture</div>
              <div className='text-l'>Transform your image into <span className='text-primary font-bold'>pixel art</span></div>
            </div>

            {/* 上传图片控件 */}
            {/**展示成品 */}
            {
              !imageFile && <div className="flex flex-col items-center justify-between h-full box-border overflow-auto pb-[70px]">


                <div className='mt-[20%]'>
                  <MarqueeList />
                </div>
                <Label
                  htmlFor="file-upload"
                  className="cursor-pointer w-full max-w-[300px]"
                >
                  <div className="flex flex-col h-full items-end gap-2 p-6 rounded-lg hover:border-primary transition-colors">
                    <ShinyButton
                      className='!w-full bg-white'
                      onClick={() => {
                        const input = document.getElementById('file-upload') as HTMLInputElement;
                        input?.click();
                      }}
                    >
                      <div className='flex items-center justify-center'>
                        <span className='text-sm text-primary'>点击选择图片</span>
                      </div>
                    </ShinyButton>
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
                        <Label>R 通道权重 当前值: <span className='text-primary'>{weights.r.toFixed(3)}</span></Label>
                        <Slider
                          value={[weights.r]}
                          onValueChange={(value) => handleWeightChange('r', value)}
                          min={0}
                          max={1}
                          step={0.001}
                          disabled={isLoading}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label>G 通道权重 当前值: <span className='text-primary'>{weights.g.toFixed(3)}</span></Label>
                        <Slider
                          value={[weights.g]}
                          onValueChange={(value) => handleWeightChange('g', value)}
                          min={0}
                          max={1}
                          step={0.001}
                          disabled={isLoading}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label>B 通道权重 当前值: <span className='text-primary'>{weights.b.toFixed(3)}</span></Label>
                        <Slider
                          value={[weights.b]}
                          onValueChange={(value) => handleWeightChange('b', value)}
                          min={0}
                          max={1}
                          step={0.001}
                          disabled={isLoading}
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label>像素大小 当前值: <span className='text-primary'>{pixelSize}px</span></Label>
                      <Slider
                        value={[pixelSize]}
                        onValueChange={(value) => setPixelSize(value[0])}
                        min={1}
                        max={10}
                        step={1}
                        disabled={isLoading}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>采样间隔 当前值: <span className='text-primary'>{sampleSize}px</span></Label>
                      <Slider
                        value={[sampleSize]}
                        onValueChange={(value) => setSampleSize(value[0])}
                        min={1}
                        max={10}
                        step={1}
                        disabled={isLoading}
                      />
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
          <RippleButton className='btn btn-ghost danger' onClick={handleReset}>重置</RippleButton>
          <RippleButton
            className='btn btn-ghost border-[#9ca3af80]'
            onClick={handleComplete}
            disabled={!imageFile || isLoading}
          >
            完成
          </RippleButton>
        </div>
      </div>
    </GridBackground>

  )
}

export default App
