import React, { useState } from 'react';
import { Settings, Volume2, VolumeX, Sparkles, X } from 'lucide-react';
import { sfx } from '../utils/sounds';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose }) => {
  const [sfxMuted, setSfxMuted] = useState(sfx.sfxMuted);
  const [sfxVolume, setSfxVolume] = useState(Math.round(sfx.sfxVolume * 100));
  const [musicMuted, setMusicMuted] = useState(sfx.musicMuted);
  const [musicVolume, setMusicVolume] = useState(Math.round(sfx.musicVolume * 100));

  if (!isOpen) return null;

  const handleToggleSFX = () => {
    sfx.playPop();
    const nextMuted = !sfxMuted;
    setSfxMuted(nextMuted);
    sfx.setSFXMuted(nextMuted);
    if (!nextMuted && sfxVolume === 0) {
      setSfxVolume(80);
      sfx.setSFXVolume(0.8);
    }
  };

  const handleSFXVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseInt(e.target.value, 10);
    setSfxVolume(val);
    sfx.setSFXVolume(val / 100);
    if (sfxMuted && val > 0) {
      setSfxMuted(false);
      sfx.setSFXMuted(false);
    } else if (val === 0 && !sfxMuted) {
      setSfxMuted(true);
      sfx.setSFXMuted(true);
    }
  };

  const handleToggleVolume = () => {
    sfx.playPop();
    const nextMuted = !musicMuted;
    setMusicMuted(nextMuted);
    sfx.setMusicMuted(nextMuted);
    if (!nextMuted) {
      if (musicVolume === 0) {
        setMusicVolume(50);
        sfx.setMusicVolume(0.5);
      }
      sfx.startBGM();
    }
  };

  const handleMusicVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseInt(e.target.value, 10);
    setMusicVolume(val);
    sfx.setMusicVolume(val / 100);
    if (musicMuted && val > 0) {
      setMusicMuted(false);
      sfx.setMusicMuted(false);
      sfx.startBGM();
    } else if (val === 0 && !musicMuted) {
      setMusicMuted(true);
      sfx.setMusicMuted(true);
    }
  };

  const isSFXActive = !sfxMuted && sfxVolume > 0;
  const isMusicActive = !musicMuted && musicVolume > 0;

  return (
    <div
      className="no-drag-aim"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          sfx.playPop();
          onClose();
        }
      }}
      style={{
        position: 'absolute',
        inset: 0,
        zIndex: 120,
        background: 'rgba(15, 23, 42, 0.75)',
        backdropFilter: 'blur(8px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '12px'
      }}
    >
      {/* 50% Reduced Size Compact Settings Panel */}
      <div
        className="animate-pop"
        onClick={(e) => e.stopPropagation()}
        style={{
          background: '#FFFFFF',
          borderRadius: '18px',
          padding: '14px 16px',
          border: '3px solid #38bdf8',
          boxShadow: '0 8px 0 #0284c7, 0 16px 30px rgba(0,0,0,0.4)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '11px',
          minWidth: '220px',
          maxWidth: '250px',
          width: '85%',
          textAlign: 'center',
          boxSizing: 'border-box'
        }}
      >
        {/* Header: Title */}
        <div style={{ width: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#0f172a', fontWeight: 900, fontSize: '1.05rem', letterSpacing: '0.5px' }}>
            <Settings size={18} color="#0284c7" />
            <span>SETTINGS</span>
          </div>
        </div>

        {/* 1. SFX Controller Row with Circular Icon Toggle */}
        <div
          style={{
            width: '100%',
            background: '#f8fafc',
            border: '2px solid #e2e8f0',
            borderRadius: '14px',
            padding: '8px 10px',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            boxSizing: 'border-box'
          }}
        >
          {/* Circular SFX Icon Toggle Button */}
          <button
            onClick={handleToggleSFX}
            className="btn-3d"
            title={isSFXActive ? 'Mute SFX' : 'Unmute SFX'}
            style={{
              background: isSFXActive
                ? 'linear-gradient(180deg, #38bdf8 0%, #0284c7 100%)'
                : '#94a3b8',
              color: '#FFFFFF',
              border: '2px solid #FFFFFF',
              borderRadius: '50%',
              width: '38px',
              height: '38px',
              minWidth: '38px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              boxShadow: isSFXActive ? '0 3px 0 #0369a1' : '0 3px 0 #64748b',
              transition: 'all 0.15s ease'
            }}
          >
            {isSFXActive ? <Sparkles size={18} /> : <VolumeX size={18} />}
          </button>

          {/* Slider & Label Container */}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '3px', textAlign: 'left' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontWeight: 900, color: '#1e293b', fontSize: '0.82rem' }}>SFX</span>
              <span style={{ fontWeight: 900, color: '#64748b', fontSize: '0.75rem' }}>
                {isSFXActive ? `${sfxVolume}%` : 'OFF'}
              </span>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              value={sfxMuted ? 0 : sfxVolume}
              onChange={handleSFXVolumeChange}
              style={{
                width: '100%',
                accentColor: isSFXActive ? '#0284c7' : '#94a3b8',
                cursor: 'pointer',
                height: '5px',
                borderRadius: '9999px',
                margin: 0
              }}
            />
          </div>
        </div>

        {/* 2. Volume (Music) Controller Row with Circular Icon Toggle */}
        <div
          style={{
            width: '100%',
            background: '#f8fafc',
            border: '2px solid #e2e8f0',
            borderRadius: '14px',
            padding: '8px 10px',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            boxSizing: 'border-box'
          }}
        >
          {/* Circular Volume Icon Toggle Button */}
          <button
            onClick={handleToggleVolume}
            className="btn-3d"
            title={isMusicActive ? 'Mute Volume' : 'Unmute Volume'}
            style={{
              background: isMusicActive
                ? 'linear-gradient(180deg, #a855f7 0%, #7e22ce 100%)'
                : '#94a3b8',
              color: '#FFFFFF',
              border: '2px solid #FFFFFF',
              borderRadius: '50%',
              width: '38px',
              height: '38px',
              minWidth: '38px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              boxShadow: isMusicActive ? '0 3px 0 #6b21a8' : '0 3px 0 #64748b',
              transition: 'all 0.15s ease'
            }}
          >
            {isMusicActive ? <Volume2 size={19} /> : <VolumeX size={19} />}
          </button>

          {/* Slider & Label Container */}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '3px', textAlign: 'left' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontWeight: 900, color: '#1e293b', fontSize: '0.82rem' }}>Volume</span>
              <span style={{ fontWeight: 900, color: '#64748b', fontSize: '0.75rem' }}>
                {isMusicActive ? `${musicVolume}%` : 'OFF'}
              </span>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              value={musicMuted ? 0 : musicVolume}
              onChange={handleMusicVolumeChange}
              style={{
                width: '100%',
                accentColor: isMusicActive ? '#9333ea' : '#94a3b8',
                cursor: 'pointer',
                height: '5px',
                borderRadius: '9999px',
                margin: 0
              }}
            />
          </div>
        </div>

        {/* Bottom Bar: Red X Close Button in Bottom-Right Corner */}
        <div style={{ width: '100%', display: 'flex', justifyContent: 'flex-end', alignItems: 'center', marginTop: '2px' }}>
          <button
            onClick={() => {
              sfx.playPop();
              onClose();
            }}
            className="btn-3d"
            title="Close Settings"
            style={{
              background: 'linear-gradient(180deg, #ef4444 0%, #dc2626 100%)',
              color: '#FFFFFF',
              border: '2px solid #FFFFFF',
              borderRadius: '50%',
              width: '34px',
              height: '34px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              boxShadow: '0 3px 0 #991b1b'
            }}
          >
            <X size={18} strokeWidth={3} />
          </button>
        </div>
      </div>
    </div>
  );
};
