import React, { useState } from 'react';
import FireworksDisplay from './components/FireworksDisplay';
import { soundManager } from './utils/sound';
import { ParticleConfig } from './types';

function App() {
  const [isRunning, setIsRunning] = useState(true);
  const [isMuted, setIsMuted] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  
  const [config, setConfig] = useState<ParticleConfig>({
    sizeMultiplier: 1.0,
    durationMultiplier: 1.0,
    flickerDensity: 0.5,
    hueMode: 'RANDOM',
    customHue: 0
  });

  const toggleMute = () => {
    const newState = !isMuted;
    setIsMuted(newState);
    soundManager.setMuted(newState);
  };

  const handleConfigChange = (key: keyof ParticleConfig, value: any) => {
    setConfig(prev => ({ ...prev, [key]: value }));
  };

  return (
    <div className="w-screen h-screen overflow-hidden bg-black text-white relative">
      <FireworksDisplay 
        isRunning={isRunning} 
        autoLaunchInterval={4000} 
        particleConfig={config}
      />
      
      {/* Top Right Controls */}
      <div className="absolute top-6 right-6 flex items-center gap-4 z-20 pointer-events-none">
        <div className="flex items-center gap-2 bg-white/5 backdrop-blur-md px-4 py-2 rounded-full border border-white/10 shadow-lg">
          <div className={`w-2 h-2 rounded-full ${isRunning ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`} />
          <span className="text-xs font-mono text-gray-300 uppercase tracking-widest">
            {isRunning ? 'System Active' : 'Paused'}
          </span>
        </div>

        {/* Buttons Wrapper for pointer events */}
        <div className="flex items-center gap-2 pointer-events-auto">
          {/* Settings Toggle */}
          <button
            onClick={() => setShowSettings(!showSettings)}
            className={`p-2 rounded-full transition-colors border shadow-lg ${showSettings ? 'bg-white/20 border-white/30' : 'bg-white/5 hover:bg-white/20 border-white/10'}`}
            aria-label="Settings"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>
          </button>

          {/* Mute Toggle */}
          <button
            onClick={toggleMute}
            className="p-2 rounded-full bg-white/5 hover:bg-white/20 transition-colors border border-white/10 shadow-lg"
            aria-label={isMuted ? "Unmute" : "Mute"}
          >
            {isMuted ? (
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="1" y1="1" x2="23" y2="23"/><path d="M9 9v6a3 3 0 0 0 5.12 2.12M15 9.34V4a3 3 0 0 0-5.94-.6"/></svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" y1="19" x2="12" y2="23"/><line x1="8" y1="23" x2="16" y2="23"/></svg>
            )}
          </button>
          
          {/* Pause/Play Toggle */}
          <button 
            onClick={() => setIsRunning(!isRunning)}
            className="p-2 rounded-full bg-white/5 hover:bg-white/20 transition-colors border border-white/10 shadow-lg"
            aria-label={isRunning ? "Pause" : "Play"}
          >
            {isRunning ? (
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg>
            ) : (
               <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="5 3 19 12 5 21 5 3"/></svg>
            )}
          </button>
        </div>
      </div>

      {/* Settings Panel */}
      {showSettings && (
        <div className="absolute top-20 right-6 w-72 bg-gray-900/90 backdrop-blur-xl border border-white/10 rounded-2xl p-6 shadow-2xl z-20 text-sm animate-in fade-in slide-in-from-top-4 duration-200">
          <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.09a2 2 0 0 1-1-1.74v-.51a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/><circle cx="12" cy="12" r="3"/></svg>
            Particle Physics
          </h2>
          
          <div className="space-y-6">
            <div className="space-y-2">
              <div className="flex justify-between text-gray-400">
                <label>Duration</label>
                <span>{config.durationMultiplier.toFixed(1)}x</span>
              </div>
              <input 
                type="range" 
                min="0.5" 
                max="2.5" 
                step="0.1" 
                value={config.durationMultiplier}
                onChange={(e) => handleConfigChange('durationMultiplier', parseFloat(e.target.value))}
                className="w-full h-2 bg-white/10 rounded-lg appearance-none cursor-pointer accent-cyan-500 hover:accent-cyan-400"
              />
            </div>

            <div className="space-y-2">
              <div className="flex justify-between text-gray-400">
                <label>Size Multiplier</label>
                <span>{config.sizeMultiplier.toFixed(1)}x</span>
              </div>
              <input 
                type="range" 
                min="0.5" 
                max="3.0" 
                step="0.1" 
                value={config.sizeMultiplier}
                onChange={(e) => handleConfigChange('sizeMultiplier', parseFloat(e.target.value))}
                className="w-full h-2 bg-white/10 rounded-lg appearance-none cursor-pointer accent-purple-500 hover:accent-purple-400"
              />
            </div>

            <div className="space-y-2">
              <div className="flex justify-between text-gray-400">
                <label>Flicker Density</label>
                <span>{(config.flickerDensity * 100).toFixed(0)}%</span>
              </div>
              <input 
                type="range" 
                min="0.0" 
                max="1.0" 
                step="0.05" 
                value={config.flickerDensity}
                onChange={(e) => handleConfigChange('flickerDensity', parseFloat(e.target.value))}
                className="w-full h-2 bg-white/10 rounded-lg appearance-none cursor-pointer accent-pink-500 hover:accent-pink-400"
              />
            </div>

            {/* Color Settings */}
            <div className="pt-4 border-t border-white/10 space-y-4">
              <label className="text-gray-400 block mb-2 font-medium">Color Mode</label>
              <div className="flex bg-white/5 p-1 rounded-lg">
                <button 
                  onClick={() => handleConfigChange('hueMode', 'RANDOM')}
                  className={`flex-1 py-1.5 text-xs font-medium rounded-md transition-all ${config.hueMode === 'RANDOM' ? 'bg-white/20 text-white shadow-sm' : 'text-gray-400 hover:text-white'}`}
                >
                  Random
                </button>
                <button 
                  onClick={() => handleConfigChange('hueMode', 'CUSTOM')}
                  className={`flex-1 py-1.5 text-xs font-medium rounded-md transition-all ${config.hueMode === 'CUSTOM' ? 'bg-white/20 text-white shadow-sm' : 'text-gray-400 hover:text-white'}`}
                >
                  Custom
                </button>
              </div>

              {config.hueMode === 'CUSTOM' && (
                <div className="space-y-4 animate-in fade-in zoom-in-95 duration-200">
                  <div className="space-y-2">
                     <div className="flex justify-between text-gray-400 text-xs">
                        <label>Hue</label>
                        <span style={{ color: `hsl(${config.customHue}, 100%, 60%)` }}>{config.customHue}°</span>
                     </div>
                     <input 
                        type="range" 
                        min="0" 
                        max="360" 
                        value={config.customHue}
                        onChange={(e) => handleConfigChange('customHue', parseInt(e.target.value))}
                        className="w-full h-3 rounded-lg appearance-none cursor-pointer"
                        style={{
                          background: 'linear-gradient(to right, #f00 0%, #ff0 17%, #0f0 33%, #0ff 50%, #00f 67%, #f0f 83%, #f00 100%)'
                        }}
                     />
                  </div>

                  <div className="flex flex-wrap gap-2 justify-between px-1">
                    {[0, 30, 60, 120, 180, 240, 280, 320].map(hue => (
                      <button
                        key={hue}
                        onClick={() => handleConfigChange('customHue', hue)}
                        className={`w-6 h-6 rounded-full border border-white/20 transition-transform hover:scale-110 shadow-lg ${config.customHue === hue ? 'ring-2 ring-white scale-125' : ''}`}
                        style={{ backgroundColor: `hsl(${hue}, 100%, 50%)` }}
                        aria-label={`Select color hue ${hue}`}
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
          
          <div className="mt-6 pt-4 border-t border-white/10 text-xs text-gray-500">
            Adjust sliders to modify the explosion effects in real-time.
          </div>
        </div>
      )}
    </div>
  );
}

export default App;