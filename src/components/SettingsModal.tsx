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
        padding: '30px'
      }}
    >
      {/* Kid-friendly Settings Panel */}
      <div
        className="animate-pop"
        onClick={(e) => e.stopPropagation()}
        style={{
          position: 'relative',
          background: '#FFFFFF',
          borderRadius: '38px',
          padding: '46px 50px 80px 50px',
          border: '5px solid #38bdf8',
          boxShadow: '0 15px 0 #0284c7, 0 30px 55px rgba(0,0,0,0.45)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '28px',
          minWidth: '625px',
          maxWidth: '725px',
          width: '82%',
          textAlign: 'center',
          boxSizing: 'border-box'
        }}
      >
        {/* Header: Title */}
        <div style={{ width: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '15px', color: '#0f172a', fontWeight: 900, fontSize: '2.5rem', letterSpacing: '0.5px' }}>
            <Settings size={45} color="#0284c7" />
            <span>SETTINGS</span>
          </div>
        </div>

        {/* 1. SFX Controller Row with Circular Icon Toggle */}
        <div
          style={{
            width: '100%',
            background: '#f8fafc',
            border: '4px solid #e2e8f0',
            borderRadius: '26px',
            padding: '20px 26px',
            display: 'flex',
            alignItems: 'center',
            gap: '22px',
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
              border: '4px solid #FFFFFF',
              borderRadius: '50%',
              width: '90px',
              height: '90px',
              minWidth: '90px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              boxShadow: isSFXActive ? '0 6px 0 #0369a1' : '0 6px 0 #64748b',
              transition: 'all 0.15s ease'
            }}
          >
            {isSFXActive ? <Sparkles size={42} /> : <VolumeX size={42} />}
          </button>

          {/* Slider & Label Container */}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '9px', textAlign: 'left' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontWeight: 900, color: '#1e293b', fontSize: '1.75rem' }}>SFX</span>
              <span style={{ fontWeight: 900, color: '#64748b', fontSize: '1.5rem' }}>
                {isSFXActive ? `${sfxVolume}%` : 'OFF'}
              </span>
            </div>
            <input
              className="audio-slider"
              type="range"
              min="0"
              max="100"
              value={sfxMuted ? 0 : sfxVolume}
              onChange={handleSFXVolumeChange}
              style={{
                width: '100%',
                color: isSFXActive ? '#0284c7' : '#94a3b8',
                cursor: 'pointer',
                height: '34px',
                borderRadius: '9999px',
                margin: 0,
                background: `linear-gradient(90deg, ${isSFXActive ? '#0284c7' : '#94a3b8'} 0%, ${isSFXActive ? '#0284c7' : '#94a3b8'} ${sfxMuted ? 0 : sfxVolume}%, #e2e8f0 ${sfxMuted ? 0 : sfxVolume}%, #e2e8f0 100%)`
              }}
            />
          </div>
        </div>

        {/* 2. Volume (Music) Controller Row with Circular Icon Toggle */}
        <div
          style={{
            width: '100%',
            background: '#f8fafc',
            border: '4px solid #e2e8f0',
            borderRadius: '26px',
            padding: '20px 26px',
            display: 'flex',
            alignItems: 'center',
            gap: '22px',
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
              border: '4px solid #FFFFFF',
              borderRadius: '50%',
              width: '90px',
              height: '90px',
              minWidth: '90px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              boxShadow: isMusicActive ? '0 6px 0 #6b21a8' : '0 6px 0 #64748b',
              transition: 'all 0.15s ease'
            }}
          >
            {isMusicActive ? <Volume2 size={45} /> : <VolumeX size={45} />}
          </button>

          {/* Slider & Label Container */}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '9px', textAlign: 'left' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontWeight: 900, color: '#1e293b', fontSize: '1.75rem' }}>Volume</span>
              <span style={{ fontWeight: 900, color: '#64748b', fontSize: '1.5rem' }}>
                {isMusicActive ? `${musicVolume}%` : 'OFF'}
              </span>
            </div>
            <input
              className="audio-slider"
              type="range"
              min="0"
              max="100"
              value={musicMuted ? 0 : musicVolume}
              onChange={handleMusicVolumeChange}
              style={{
                width: '100%',
                color: isMusicActive ? '#9333ea' : '#94a3b8',
                cursor: 'pointer',
                height: '34px',
                borderRadius: '9999px',
                margin: 0,
                background: `linear-gradient(90deg, ${isMusicActive ? '#9333ea' : '#94a3b8'} 0%, ${isMusicActive ? '#9333ea' : '#94a3b8'} ${musicMuted ? 0 : musicVolume}%, #e2e8f0 ${musicMuted ? 0 : musicVolume}%, #e2e8f0 100%)`
              }}
            />
          </div>
        </div>

        {/* Close Button — anchored to the panel's bottom-right corner */}
        <button
          onClick={() => {
            sfx.playPop();
            onClose();
          }}
          className="btn-3d"
          title="Close Settings"
          style={{
            position: 'absolute',
            bottom: '-24px',
            right: '-24px',
            background: 'linear-gradient(180deg, #ef4444 0%, #dc2626 100%)',
            color: '#FFFFFF',
            border: '4px solid #FFFFFF',
            borderRadius: '50%',
            width: '94px',
            height: '94px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            boxShadow: '0 7px 0 #991b1b'
          }}
        >
          <X size={48} strokeWidth={3} />
        </button>
      </div>
    </div>
  );
};
