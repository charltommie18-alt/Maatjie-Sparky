import React, { useRef, useState, useEffect } from 'react';
import { Palette, Eraser, Sparkles, Save, Camera, Video, Upload, CheckCircle2 } from 'lucide-react';
import { speechService } from '../utils/speech';
import { VaultMedia } from '../types';

interface DrawingCanvasProps {
  onSaveMedia: (media: Omit<VaultMedia, 'id'>) => void;
  language: 'af' | 'en' | 'bilingual';
}

export const DrawingCanvas: React.FC<DrawingCanvasProps> = ({ onSaveMedia, language }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [color, setColor] = useState('#f97316');
  const [brushSize, setBrushSize] = useState(8);
  const [tool, setTool] = useState<'brush' | 'eraser' | 'stamp'>('brush');
  const [selectedStamp, setSelectedStamp] = useState('⭐');
  const [title, setTitle] = useState('');
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [mediaMode, setMediaMode] = useState<'draw' | 'camera'>('draw');

  // Camera capture simulation
  const [isRecording, setIsRecording] = useState(false);
  const [recordedVideoNotice, setRecordedVideoNotice] = useState(false);

  const colors = [
    '#f97316', // Orange
    '#ef4444', // Red
    '#ec4899', // Pink
    '#8b5cf6', // Purple
    '#3b82f6', // Blue
    '#10b981', // Green
    '#f59e0b', // Yellow
    '#78350f', // Brown
    '#1e293b', // Slate
  ];

  const stamps = ['⭐', '❤️', '🦁', '🍎', '🌈', '🚀', '🐘', '🌞'];

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    // Set white canvas background
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }, []);

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    const x = ((clientX - rect.left) / rect.width) * canvas.width;
    const y = ((clientY - rect.top) / rect.height) * canvas.height;

    if (tool === 'stamp') {
      ctx.font = '36px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(selectedStamp, x, y);
      speechService.playSound('pop');
      return;
    }

    setIsDrawing(true);
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.strokeStyle = tool === 'eraser' ? '#ffffff' : color;
    ctx.lineWidth = brushSize;
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing || tool === 'stamp') return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    const x = ((clientX - rect.left) / rect.width) * canvas.width;
    const y = ((clientY - rect.top) / rect.height) * canvas.height;

    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const stopDrawing = () => {
    if (isDrawing) {
      setIsDrawing(false);
    }
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    speechService.playSound('pop');
  };

  const handleSaveDrawing = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dataUrl = canvas.toDataURL('image/png');

    onSaveMedia({
      childId: 'child-1',
      title: title || (language === 'af' ? 'My Kleurryke Meesterstuk' : 'My Colorful Masterpiece'),
      url: dataUrl,
      type: 'drawing',
      caption: language === 'af' ? 'Geteken in Maatjie se Kuns Studio!' : 'Drawn in Maatjie Art Studio!',
      date: new Date().toISOString().split('T')[0],
      guardianApproved: false, // Requires parent review per prompt requirement!
      tags: ['Kuns', 'Tekening', 'Kreatiwiteit']
    });

    speechService.playSound('success');
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  const handleCaptureVideoMock = () => {
    setIsRecording(true);
    speechService.playSound('pop');
    setTimeout(() => {
      setIsRecording(false);
      setRecordedVideoNotice(true);
      onSaveMedia({
        childId: 'child-1',
        title: language === 'af' ? 'Liam se Wiskunde Viering Video! 🎬' : 'Liam Math Celebration Video! 🎬',
        url: 'https://images.unsplash.com/photo-1596495578065-6e0763fa1178?auto=format&fit=crop&w=600&q=80',
        type: 'video',
        caption: language === 'af' ? 'Kort video van Liam wat 10 somme opgelos het!' : 'Short clip of Liam solving 10 math challenges!',
        date: new Date().toISOString().split('T')[0],
        guardianApproved: false,
        tags: ['Video', 'Wiskunde', 'Viering']
      });
      speechService.playSound('success');
    }, 2500);
  };

  return (
    <div className="bg-white rounded-3xl p-4 sm:p-6 border-3 border-amber-300 shadow-xl space-y-4">
      {/* Mode Switcher: Drawing Studio vs Camera/Video */}
      <div className="flex items-center justify-between pb-3 border-b border-amber-100">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-2xl bg-amber-100 text-amber-600">
            <Palette className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-lg sm:text-xl font-black font-fredoka text-slate-800">
              {language === 'af' ? 'Kreatiwiteit & Familie Kluis' : 'Creativity & Family Vault'}
            </h3>
            <p className="text-xs text-slate-500">
              {language === 'af'
                ? 'Teken, neem foto’s of maak kort video’s vir Mamma & Pappa se kluis!'
                : 'Draw, snap photos, or make mini video clips for Mom & Dad’s vault!'}
            </p>
          </div>
        </div>

        <div className="flex gap-1.5 bg-amber-50 p-1 rounded-2xl border border-amber-200">
          <button
            onClick={() => setMediaMode('draw')}
            className={`px-3 py-1.5 rounded-xl font-bold text-xs transition ${
              mediaMode === 'draw' ? 'bg-amber-500 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            🎨 Teken
          </button>
          <button
            onClick={() => setMediaMode('camera')}
            className={`px-3 py-1.5 rounded-xl font-bold text-xs transition ${
              mediaMode === 'camera' ? 'bg-amber-500 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            📸 Foto / Video
          </button>
        </div>
      </div>

      {mediaMode === 'draw' ? (
        <div className="space-y-3">
          {/* Controls Bar */}
          <div className="flex flex-wrap items-center justify-between gap-2 p-2.5 bg-amber-50/70 rounded-2xl border border-amber-200">
            {/* Color Palette */}
            <div className="flex items-center gap-1.5">
              {colors.map((c) => (
                <button
                  key={c}
                  onClick={() => {
                    setColor(c);
                    setTool('brush');
                  }}
                  className={`w-7 h-7 rounded-full border-2 transition active:scale-90 ${
                    color === c && tool === 'brush' ? 'border-slate-800 scale-110 shadow-md' : 'border-white'
                  }`}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>

            {/* Tools: Eraser & Brush Size */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => setTool('eraser')}
                className={`p-2 rounded-xl border transition ${
                  tool === 'eraser' ? 'bg-slate-800 text-white border-slate-800' : 'bg-white text-slate-700 border-slate-200'
                }`}
                title="Uitveër (Eraser)"
              >
                <Eraser className="w-4 h-4" />
              </button>

              <button
                onClick={clearCanvas}
                className="px-2.5 py-1.5 rounded-xl bg-white text-slate-700 border border-slate-200 text-xs font-bold hover:bg-rose-50 hover:text-rose-600 transition"
              >
                Maak Skoon
              </button>
            </div>
          </div>

          {/* Stamps Bar */}
          <div className="flex items-center gap-2 overflow-x-auto p-1.5 bg-slate-50 rounded-2xl border border-slate-200 text-lg">
            <span className="text-xs font-bold text-slate-500 ml-1">Stempels:</span>
            {stamps.map((s) => (
              <button
                key={s}
                onClick={() => {
                  setSelectedStamp(s);
                  setTool('stamp');
                }}
                className={`w-9 h-9 rounded-xl flex items-center justify-center text-xl transition active:scale-90 ${
                  tool === 'stamp' && selectedStamp === s ? 'bg-amber-200 border-2 border-amber-400' : 'hover:bg-slate-200'
                }`}
              >
                {s}
              </button>
            ))}
          </div>

          {/* Canvas Area */}
          <div className="relative border-4 border-amber-200 rounded-3xl overflow-hidden shadow-inner bg-white">
            <canvas
              ref={canvasRef}
              width={700}
              height={380}
              onMouseDown={startDrawing}
              onMouseMove={draw}
              onMouseUp={stopDrawing}
              onMouseLeave={stopDrawing}
              onTouchStart={startDrawing}
              onTouchMove={draw}
              onTouchEnd={stopDrawing}
              className="w-full h-72 sm:h-80 touch-none cursor-crosshair bg-white"
            />
          </div>

          {/* Save Action */}
          <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={language === 'af' ? 'Gee jou tekening ’n naam...' : 'Name your drawing...'}
              className="flex-1 w-full p-3 rounded-2xl border-2 border-amber-200 bg-amber-50/50 text-sm font-bold text-slate-800"
            />
            <button
              onClick={handleSaveDrawing}
              className="w-full sm:w-auto px-6 py-3 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-black text-sm rounded-2xl shadow-lg flex items-center justify-center gap-2 transition active:scale-98 cursor-pointer"
            >
              <Save className="w-4 h-4" />
              <span>Stoor na Familie Kluis ⭐</span>
            </button>
          </div>

          {savedSuccess && (
            <div className="p-3 bg-emerald-100 text-emerald-900 rounded-2xl text-xs font-bold flex items-center gap-2 animate-in fade-in">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>
                {language === 'af'
                  ? 'Gestoord! Mamma en Pappa sal dit in die Ouer Portaal kan sien en goedkeur.'
                  : 'Saved! Mom and Dad will review and approve it in the Parent Portal.'}
              </span>
            </div>
          )}
        </div>
      ) : (
        /* Camera / Short Video Simulation */
        <div className="p-6 bg-slate-900 rounded-3xl text-white text-center space-y-4">
          <div className="w-20 h-20 mx-auto rounded-full bg-slate-800 border-2 border-indigo-400 flex items-center justify-center">
            {isRecording ? (
              <div className="w-8 h-8 rounded-full bg-rose-600 animate-ping" />
            ) : (
              <Video className="w-10 h-10 text-indigo-400" />
            )}
          </div>

          <h4 className="text-xl font-black font-fredoka text-amber-300">
            {language === 'af' ? 'Neem ’n Wiskunde-Viering Video op! 🎬' : 'Record a Math Celebration Video! 🎬'}
          </h4>
          <p className="text-xs text-slate-300 max-w-md mx-auto">
            {language === 'af'
              ? 'Wys vir Mamma en Pappa hoe jy die somme opgelos het of jou gunsteling emosie-gesiggie gemaak het.'
              : 'Show Mom & Dad how you solved your math challenges or made your proud face.'}
          </p>

          <div className="flex justify-center gap-3 pt-2">
            <button
              onClick={handleCaptureVideoMock}
              disabled={isRecording}
              className={`px-6 py-3 rounded-2xl font-black text-sm flex items-center gap-2 transition shadow-lg active:scale-98 ${
                isRecording
                  ? 'bg-rose-600 text-white animate-pulse'
                  : 'bg-indigo-600 hover:bg-indigo-700 text-white'
              }`}
            >
              <Camera className="w-4 h-4" />
              <span>{isRecording ? 'Neem tans op (2s)...' : 'Begin Opname (Short Video) 🔴'}</span>
            </button>
          </div>

          {recordedVideoNotice && (
            <div className="p-3 bg-emerald-900/60 border border-emerald-400 rounded-2xl text-xs text-emerald-200 font-bold">
              Video suksesvol opgeneem en na die beveiligde voogkluis gestuur! ✅
            </div>
          )}
        </div>
      )}
    </div>
  );
};
