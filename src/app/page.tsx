'use client';

import { useState, useCallback, useEffect } from 'react';
import { ReactCompareSlider, ReactCompareSliderImage } from 'react-compare-slider';

type State = 'idle' | 'loading' | 'done' | 'error';

interface User {
  email: string;
  name: string;
  avatar_url: string;
}

export default function Home() {
  const [state, setState] = useState<State>('idle');
  const [originalUrl, setOriginalUrl] = useState<string | null>(null);
  const [resultUrl, setResultUrl] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const savedUser = localStorage.getItem('user');
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }

    // @ts-ignore
    window.handleCredentialResponse = async (response: any) => {
      try {
        const res = await fetch('https://google-auth-worker.eluwomoyoqi99.workers.dev/auth/google', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token: response.credential })
        });
        const data = await res.json();
        setUser(data.user);
        localStorage.setItem('user', JSON.stringify(data.user));
      } catch (err) {
        console.error('Login failed:', err);
      }
    };
  }, []);

  const processFile = async (file: File) => {
    if (!file.type.match(/image\/(jpeg|png|webp)/)) {
      setErrorMsg('Please upload a JPG, PNG, or WEBP image.');
      setState('error');
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setErrorMsg('File size must be under 10MB.');
      setState('error');
      return;
    }

    // Show original preview
    const originalObjectUrl = URL.createObjectURL(file);
    setOriginalUrl(originalObjectUrl);
    setResultUrl(null);
    setState('loading');

    try {
      const form = new FormData();
      form.append('image', file);

      const res = await fetch('/api/remove-bg', {
        method: 'POST',
        body: form,
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Processing failed');
      }

      const blob = await res.blob();
      const resultObjectUrl = URL.createObjectURL(blob);
      setResultUrl(resultObjectUrl);
      setState('done');
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'Something went wrong. Please try again.');
      setState('error');
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processFile(file);
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) processFile(file);
  }, []);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => setIsDragging(false);

  const handleDownload = () => {
    if (!resultUrl) return;
    const a = document.createElement('a');
    a.href = resultUrl;
    a.download = 'removed-bg.png';
    a.click();
  };

  const handleReset = () => {
    setOriginalUrl(null);
    setResultUrl(null);
    setState('idle');
    setErrorMsg('');
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 py-4 px-6">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <div>
              <h1 className="text-lg font-bold text-gray-900">RemoveBG</h1>
              <p className="text-xs text-gray-500">Free Image Background Remover</p>
            </div>
          </div>
          
          {user ? (
            <div className="flex items-center gap-3">
              <img src={user.avatar_url} alt={user.name} className="w-8 h-8 rounded-full" />
              <div className="text-sm">
                <p className="font-medium text-gray-900">{user.name}</p>
                <p className="text-xs text-gray-500">{user.email}</p>
              </div>
              <button
                onClick={() => {
                  setUser(null);
                  localStorage.removeItem('user');
                }}
                className="ml-2 text-sm text-gray-500 hover:text-gray-700"
              >
                Logout
              </button>
            </div>
          ) : (
            <div
              id="g_id_onload"
              data-client_id="2499385941-d0lqohapi97ug5pdel4hq996e4d2a34k.apps.googleusercontent.com"
              data-callback="handleCredentialResponse"
            >
              <div className="g_id_signin" data-type="standard" data-size="medium"></div>
            </div>
          )}
        </div>
      </header>

      {/* Main */}
      <main className="flex-1 max-w-4xl mx-auto w-full px-4 py-12">
        <div className="text-center mb-10">
          <h2 className="text-4xl font-extrabold text-gray-900 mb-3">
            Remove Image Background
          </h2>
          <p className="text-lg text-gray-500">
            Free, instant, no signup required. Upload your image and download the result.
          </p>
        </div>

        {/* Upload Area */}
        {state === 'idle' && (
          <div
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            className={`border-2 border-dashed rounded-2xl p-16 text-center cursor-pointer transition-colors ${
              isDragging
                ? 'border-indigo-500 bg-indigo-50'
                : 'border-gray-300 bg-white hover:border-indigo-400 hover:bg-gray-50'
            }`}
          >
            <label className="cursor-pointer block">
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="hidden"
                onChange={handleFileInput}
              />
              <div className="flex flex-col items-center gap-4">
                <div className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center">
                  <svg className="w-8 h-8 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                  </svg>
                </div>
                <div>
                  <p className="text-xl font-semibold text-gray-700">
                    Drop your image here
                  </p>
                  <p className="text-gray-400 mt-1">or <span className="text-indigo-600 underline">click to upload</span></p>
                </div>
                <p className="text-sm text-gray-400">JPG, PNG, WEBP · Max 10MB</p>
              </div>
            </label>
          </div>
        )}

        {/* Loading */}
        {state === 'loading' && (
          <div className="bg-white rounded-2xl p-16 text-center shadow-sm">
            <div className="flex flex-col items-center gap-4">
              <div className="w-14 h-14 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
              <p className="text-lg font-medium text-gray-700">Removing background...</p>
              <p className="text-sm text-gray-400">This usually takes 2–5 seconds</p>
            </div>
          </div>
        )}

        {/* Error */}
        {state === 'error' && (
          <div className="bg-white rounded-2xl p-10 text-center shadow-sm">
            <div className="flex flex-col items-center gap-4">
              <div className="w-14 h-14 bg-red-100 rounded-full flex items-center justify-center">
                <svg className="w-7 h-7 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </div>
              <p className="text-lg font-medium text-gray-700">{errorMsg}</p>
              <button
                onClick={handleReset}
                className="mt-2 px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
              >
                Try Again
              </button>
            </div>
          </div>
        )}

        {/* Result */}
        {state === 'done' && originalUrl && resultUrl && (
          <div className="flex flex-col gap-6">
            <div className="bg-white rounded-2xl overflow-hidden shadow-sm">
              <ReactCompareSlider
                itemOne={
                  <ReactCompareSliderImage src={originalUrl} alt="Original" style={{ objectFit: 'contain' }} />
                }
                itemTwo={
                  <div className="checkerboard w-full h-full">
                    <ReactCompareSliderImage src={resultUrl} alt="Background removed" style={{ objectFit: 'contain' }} />
                  </div>
                }
                style={{ height: '480px' }}
              />
            </div>

            <div className="flex gap-3 justify-center">
              <button
                onClick={handleDownload}
                className="px-8 py-3 bg-indigo-600 text-white font-semibold rounded-xl hover:bg-indigo-700 transition-colors flex items-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                Download PNG
              </button>
              <button
                onClick={handleReset}
                className="px-8 py-3 bg-gray-100 text-gray-700 font-semibold rounded-xl hover:bg-gray-200 transition-colors"
              >
                Remove Another
              </button>
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-gray-200 py-6 px-4 text-center text-sm text-gray-400">
        <p>🔒 Your images are processed in memory and <strong>never stored</strong> on our servers.</p>
        <p className="mt-1">© 2024 RemoveBG · Powered by Remove.bg API</p>
      </footer>
    </div>
  );
}
