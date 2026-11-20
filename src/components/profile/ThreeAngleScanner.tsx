'use client';

import React, { useState, useRef } from 'react';
import { useWardrobe } from '@/lib/store';
import { PhotoAnalysisResult } from '@/lib/types';
import { compressImage } from '@/lib/imageCompressor';
import {
  Camera,
  UploadCloud,
  Sparkles,
  Loader2,
  Check,
  AlertTriangle,
  Info,
  Palette,
  User,
  Ruler,
  ShieldCheck,
  RefreshCw,
} from 'lucide-react';
import confetti from 'canvas-confetti';

export default function ThreeAngleScanner() {
  const { user, updateThreeAngleAnalysis, userGeminiKey } = useWardrobe();

  const [frontPhoto, setFrontPhoto] = useState<string>(user.three_angle_photos?.front || '');
  const [sidePhoto, setSidePhoto] = useState<string>(user.three_angle_photos?.side || '');
  const [fullPhoto, setFullPhoto] = useState<string>(user.three_angle_photos?.full || '');
  const [heightCm, setHeightCm] = useState<number>(user.three_angle_photos?.height_cm || 178);

  const [isScanning, setIsScanning] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successToast, setSuccessToast] = useState(false);

  const frontInputRef = useRef<HTMLInputElement>(null);
  const sideInputRef = useRef<HTMLInputElement>(null);
  const fullInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = async (file: File, angle: 'front' | 'side' | 'full') => {
    try {
      setErrorMsg(null);
      const compressed = await compressImage(file, 1024, 0.85);
      if (angle === 'front') setFrontPhoto(compressed.dataUrl);
      if (angle === 'side') setSidePhoto(compressed.dataUrl);
      if (angle === 'full') setFullPhoto(compressed.dataUrl);
    } catch (e: any) {
      setErrorMsg('Failed to process image. Please try a different photo.');
    }
  };

  const handleRunScan = async () => {
    if (!frontPhoto && !sidePhoto && !fullPhoto) {
      setErrorMsg('Please upload at least your Front View photo to begin analysis.');
      return;
    }

    try {
      setIsScanning(true);
      setErrorMsg(null);

      const res = await fetch('/api/analyze-profile-photo', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(userGeminiKey ? { 'x-gemini-key': userGeminiKey } : {}),
        },
        body: JSON.stringify({
          frontPhotoBase64: frontPhoto,
          sidePhotoBase64: sidePhoto,
          fullBodyPhotoBase64: fullPhoto,
          heightCm,
          apiKey: userGeminiKey,
        }),
      });

      if (!res.ok) {
        throw new Error('Three-angle analysis failed. Please try again.');
      }

      const analysis: PhotoAnalysisResult = await res.json();
      updateThreeAngleAnalysis(
        {
          front: frontPhoto,
          side: sidePhoto,
          full: fullPhoto,
          height_cm: heightCm,
        },
        analysis
      );

      setSuccessToast(true);
      setTimeout(() => setSuccessToast(false), 2500);
      confetti({ particleCount: 50, spread: 70, origin: { y: 0.6 } });
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || 'Analysis failed. Please try again.');
    } finally {
      setIsScanning(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Title & Introduction */}
      <div className="p-4 rounded-3xl bg-white border border-neutral-200/80 shadow-xs space-y-1.5">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-amber-500 to-rose-600 text-white flex items-center justify-center">
            <Sparkles className="w-3.5 h-3.5" />
          </div>
          <h3 className="text-sm font-bold text-neutral-900">
            3-Angle Body & Face Scanner
          </h3>
        </div>
        <p className="text-xs text-neutral-600 leading-relaxed">
          Upload 3 photos (Front, Side, Full Body). Gemini AI Vision analyzes your <strong>complexion</strong>, <strong>face shape</strong>, <strong>body silhouette</strong>, and <strong>height</strong> to discover colors that look stunning vs colors that wash you out.
        </p>
      </div>

      {/* 3 Upload Slots */}
      <div className="grid grid-cols-3 gap-2">
        {/* 1. FRONT ANGLE */}
        <div className="flex flex-col space-y-1">
          <span className="text-[10px] font-bold text-neutral-700 text-center">
            1. Front View
          </span>
          <div
            onClick={() => frontInputRef.current?.click()}
            className={`aspect-[3/4] rounded-2xl border-2 border-dashed overflow-hidden relative cursor-pointer flex flex-col items-center justify-center transition-all bg-neutral-50 hover:bg-neutral-100 ${
              frontPhoto ? 'border-rose-500 bg-white' : 'border-neutral-300'
            }`}
          >
            {frontPhoto ? (
              <>
                <img src={frontPhoto} alt="Front View" className="w-full h-full object-cover" />
                <span className="absolute bottom-1 right-1 p-1 rounded-full bg-rose-600 text-white text-[9px]">
                  <Check className="w-2.5 h-2.5" />
                </span>
              </>
            ) : (
              <div className="text-center p-2 space-y-1">
                <Camera className="w-5 h-5 mx-auto text-neutral-400" />
                <span className="text-[10px] text-neutral-500 font-medium block">Face & Chest</span>
              </div>
            )}
          </div>
          <input
            ref={frontInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) handleFileUpload(f, 'front');
            }}
          />
        </div>

        {/* 2. SIDE ANGLE */}
        <div className="flex flex-col space-y-1">
          <span className="text-[10px] font-bold text-neutral-700 text-center">
            2. Side Profile
          </span>
          <div
            onClick={() => sideInputRef.current?.click()}
            className={`aspect-[3/4] rounded-2xl border-2 border-dashed overflow-hidden relative cursor-pointer flex flex-col items-center justify-center transition-all bg-neutral-50 hover:bg-neutral-100 ${
              sidePhoto ? 'border-rose-500 bg-white' : 'border-neutral-300'
            }`}
          >
            {sidePhoto ? (
              <>
                <img src={sidePhoto} alt="Side View" className="w-full h-full object-cover" />
                <span className="absolute bottom-1 right-1 p-1 rounded-full bg-rose-600 text-white text-[9px]">
                  <Check className="w-2.5 h-2.5" />
                </span>
              </>
            ) : (
              <div className="text-center p-2 space-y-1">
                <Camera className="w-5 h-5 mx-auto text-neutral-400" />
                <span className="text-[10px] text-neutral-500 font-medium block">Side Posture</span>
              </div>
            )}
          </div>
          <input
            ref={sideInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) handleFileUpload(f, 'side');
            }}
          />
        </div>

        {/* 3. FULL BODY ANGLE */}
        <div className="flex flex-col space-y-1">
          <span className="text-[10px] font-bold text-neutral-700 text-center">
            3. Full Body
          </span>
          <div
            onClick={() => fullInputRef.current?.click()}
            className={`aspect-[3/4] rounded-2xl border-2 border-dashed overflow-hidden relative cursor-pointer flex flex-col items-center justify-center transition-all bg-neutral-50 hover:bg-neutral-100 ${
              fullPhoto ? 'border-rose-500 bg-white' : 'border-neutral-300'
            }`}
          >
            {fullPhoto ? (
              <>
                <img src={fullPhoto} alt="Full Body" className="w-full h-full object-cover" />
                <span className="absolute bottom-1 right-1 p-1 rounded-full bg-rose-600 text-white text-[9px]">
                  <Check className="w-2.5 h-2.5" />
                </span>
              </>
            ) : (
              <div className="text-center p-2 space-y-1">
                <Camera className="w-5 h-5 mx-auto text-neutral-400" />
                <span className="text-[10px] text-neutral-500 font-medium block">Head to Toe</span>
              </div>
            )}
          </div>
          <input
            ref={fullInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) handleFileUpload(f, 'full');
            }}
          />
        </div>
      </div>

      {/* Height Selector / Input */}
      <div className="p-3 rounded-2xl bg-white border border-neutral-200/80 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Ruler className="w-4 h-4 text-rose-600" />
          <span className="text-xs font-semibold text-neutral-800">Your Height:</span>
        </div>
        <div className="flex items-center gap-1.5">
          <input
            type="number"
            value={heightCm}
            onChange={(e) => setHeightCm(Number(e.target.value))}
            className="w-16 px-2 py-1 rounded-lg border border-neutral-200 text-xs font-bold text-center bg-neutral-50"
          />
          <span className="text-xs text-neutral-500 font-medium">cm</span>
          <span className="text-[11px] text-neutral-400 ml-1">
            ({Math.floor(heightCm / 30.48)}&apos;{Math.round((heightCm % 30.48) / 2.54)}&quot;)
          </span>
        </div>
      </div>

      {errorMsg && (
        <div className="p-3 rounded-xl bg-amber-50 text-amber-800 text-xs flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 shrink-0 text-amber-600" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Scan Button */}
      <button
        type="button"
        disabled={isScanning}
        onClick={handleRunScan}
        className="w-full py-3 rounded-2xl bg-gradient-to-r from-rose-500 via-rose-600 to-indigo-600 hover:from-rose-600 hover:to-indigo-700 text-white text-xs font-bold shadow-md shadow-rose-500/20 flex items-center justify-center gap-2 transition-all disabled:opacity-50 active:scale-98"
      >
        {isScanning ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            <span>Scanning 3 angles with Gemini AI...</span>
          </>
        ) : (
          <>
            <Sparkles className="w-4 h-4" />
            <span>{successToast ? 'Scan Complete!' : 'Run 3-Angle Gemini AI Scan'}</span>
          </>
        )}
      </button>

      {/* RESULTS: PERSONAL COLOR STUDIO & SILHOUETTE GUIDE */}
      {user.skin_tone && (
        <div className="space-y-4 pt-2">
          {/* Summary Banner */}
          <div className="p-4 rounded-3xl bg-gradient-to-br from-amber-50 via-rose-50 to-indigo-50 border border-amber-200/80 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-wider text-amber-800 flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                <span>AI Profile Analysis</span>
              </span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-white/90 text-neutral-800 border border-amber-200">
                {user.undertone || 'Warm'} Undertone
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="p-2.5 rounded-xl bg-white/80 border border-amber-100">
                <span className="text-[10px] text-neutral-500 font-semibold block">Skin Complexion</span>
                <span className="font-bold text-neutral-900">{user.complexion || user.skin_tone}</span>
              </div>
              <div className="p-2.5 rounded-xl bg-white/80 border border-amber-100">
                <span className="text-[10px] text-neutral-500 font-semibold block">Face Shape</span>
                <span className="font-bold text-neutral-900">{user.face_shape || 'Oval'}</span>
              </div>
              <div className="p-2.5 rounded-xl bg-white/80 border border-amber-100">
                <span className="text-[10px] text-neutral-500 font-semibold block">Body Silhouette</span>
                <span className="font-bold text-neutral-900">{user.body_type || 'Athletic'}</span>
              </div>
              <div className="p-2.5 rounded-xl bg-white/80 border border-amber-100">
                <span className="text-[10px] text-neutral-500 font-semibold block">Height Balance</span>
                <span className="font-bold text-neutral-900 line-clamp-1">{user.height_proportions || "5'10\" Balanced"}</span>
              </div>
            </div>

            {user.face_styling_tips && (
              <p className="text-[11px] text-neutral-700 leading-relaxed pt-1">
                <strong>Collars & Necklines:</strong> {user.face_styling_tips}
              </p>
            )}
          </div>

          {/* 🌟 COLORS THAT LOOK AMAZING ON YOU */}
          <div className="p-4 rounded-3xl bg-white border border-neutral-200/80 shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-700 flex items-center gap-1.5">
                <span className="text-sm">🌟</span>
                <span>Colors That Look Amazing On You:</span>
              </h4>
              <span className="text-[10px] text-emerald-600 font-bold bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                Enhances Undertone
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2">
              {(user.best_colors || [
                { name: 'Warm Terracotta', hex: '#C2410C', reason: 'Accentuates golden warmth in complexion' },
                { name: 'Emerald Green', hex: '#065F46', reason: 'Radiant contrast against warm skin' },
                { name: 'Camel / Warm Tan', hex: '#D2B48C', reason: 'Flattering warm neutral staple' },
                { name: 'Deep Navy Blue', hex: '#1E3A8A', reason: 'Framing anchor for face and jawline' },
              ]).map((c, idx) => (
                <div
                  key={idx}
                  className="p-2 rounded-xl bg-neutral-50 border border-neutral-200 flex items-start gap-2"
                >
                  <span
                    className="w-5 h-5 rounded-lg border border-neutral-300 shrink-0 mt-0.5 shadow-2xs"
                    style={{ backgroundColor: c.hex }}
                  />
                  <div className="min-w-0 flex-1">
                    <p className="text-[11px] font-bold text-neutral-900 truncate">{c.name}</p>
                    <p className="text-[10px] text-neutral-500 line-clamp-2 leading-tight mt-0.5">
                      {c.reason}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* 🚫 COLORS TO AVOID (WASH YOU OUT) */}
          <div className="p-4 rounded-3xl bg-white border border-neutral-200/80 shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold uppercase tracking-wider text-rose-700 flex items-center gap-1.5">
                <span className="text-sm">🚫</span>
                <span>Colors To Avoid (Washes You Out):</span>
              </h4>
              <span className="text-[10px] text-rose-600 font-bold bg-rose-50 px-2 py-0.5 rounded-full border border-rose-200">
                Clashing / Low Contrast
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2">
              {(user.avoid_colors || [
                { name: 'Pastel Yellow', hex: '#FEF08A', reason: 'Dulls warm skin and causes sallow appearance' },
                { name: 'Cold Ash Grey', hex: '#9CA3AF', reason: 'Lacks vitality and drains warmth' },
                { name: 'Neon Lime', hex: '#84CC16', reason: 'Overpowers natural skin tones' },
                { name: 'Cold Magenta', hex: '#D946EF', reason: 'Harsh cool clash against warm undertone' },
              ]).map((c, idx) => (
                <div
                  key={idx}
                  className="p-2 rounded-xl bg-rose-50/40 border border-rose-100 flex items-start gap-2"
                >
                  <span
                    className="w-5 h-5 rounded-lg border border-neutral-300 shrink-0 mt-0.5 shadow-2xs"
                    style={{ backgroundColor: c.hex }}
                  />
                  <div className="min-w-0 flex-1">
                    <p className="text-[11px] font-bold text-neutral-900 truncate">{c.name}</p>
                    <p className="text-[10px] text-neutral-500 line-clamp-2 leading-tight mt-0.5">
                      {c.reason}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
