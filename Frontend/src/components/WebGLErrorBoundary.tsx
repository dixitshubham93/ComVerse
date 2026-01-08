import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertCircle, Chrome } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class WebGLErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null
  };

  public static getDerivedStateFromError(error: Error): State {
    // Update state so the next render will show the fallback UI.
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('WebGL Error caught by boundary:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center p-8 text-center glassmorphism rounded-2xl max-w-lg mx-auto my-12 animate-in fade-in zoom-in duration-500 border border-red-500/30">
          <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center mb-6">
            <AlertCircle className="w-10 h-10 text-red-400" />
          </div>
          
          <h2 className="text-2xl font-bold text-white mb-4 glow-text-red">
            WebGL Context Error
          </h2>
          
          <p className="text-[#747c88] mb-8 leading-relaxed">
            Your browser could not create a WebGL context. This is required to render the 3D Universe.
          </p>
          
          <div className="bg-black/40 rounded-xl p-6 text-left border border-white/10 mb-8 w-full">
            <div className="flex items-start gap-3 mb-4">
              <div className="p-2 rounded-lg bg-white/5">
                <Chrome className="w-5 h-5 text-[#28f5cc]" />
              </div>
              <div>
                <h3 className="text-white font-medium mb-1">How to fix in Chrome:</h3>
                <ol className="text-sm text-[#747c88] space-y-2 list-decimal ml-4">
                  <li>Go to <code className="bg-white/10 px-1 rounded text-[#28f5cc]">chrome://settings/system</code></li>
                  <li>Ensure <span className="text-white">"Use graphics acceleration when available"</span> is turned ON</li>
                  <li>Relaunch Chrome and refresh this page</li>
                </ol>
              </div>
            </div>
            
            <p className="text-xs text-[#747c88] italic">
              Note: Some older hardware or virtualization environments may not support WebGL.
            </p>
          </div>
          
          <button
            onClick={() => window.location.reload()}
            className="px-6 py-2 rounded-full bg-[#28f5cc] text-black font-medium hover:scale-105 transition-transform shadow-[0_0_15px_rgba(40,245,204,0.3)]"
          >
            Refresh Page
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
