
import React, { useState, useRef } from 'react';
import { Subtitle } from '../types';

interface TimelineProps {
  duration: number;
  currentTime: number;
  subtitles: Subtitle[];
  onSeek: (time: number) => void;
  onSubtitleChange: (id: string, newSubtitle: Partial<Subtitle>) => void;
  onSubtitleDelete: (id: string) => void;
  selectedSubtitle: string | null;
  onSubtitleSelect: (id: string | null) => void;
}

const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

const Timeline: React.FC<TimelineProps> = ({ duration, currentTime, subtitles, onSeek, onSubtitleChange, onSubtitleDelete, selectedSubtitle, onSubtitleSelect }) => {
  const timelineRef = useRef<HTMLDivElement>(null);
  const [editingTextId, setEditingTextId] = useState<string | null>(null);

  const handleTimelineClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!timelineRef.current) return;
    const rect = timelineRef.current.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const percentage = clickX / rect.width;
    onSeek(duration * percentage);
    onSubtitleSelect(null);
    setEditingTextId(null);
  };

  const handleSubtitleClick = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    onSubtitleSelect(id);
    setEditingTextId(null);
  }

  const handleDoubleClick = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    onSubtitleSelect(id);
    setEditingTextId(id);
  }

  const handleTextChange = (e: React.ChangeEvent<HTMLInputElement>, id: string) => {
    onSubtitleChange(id, { text: e.target.value });
  };
  
  const handleTextBlur = () => {
    setEditingTextId(null);
  }
  
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      setEditingTextId(null);
    }
  }

  const playheadPosition = duration > 0 ? (currentTime / duration) * 100 : 0;
  
  const timeMarkers = Array.from({ length: Math.floor(duration / 5) + 1 }, (_, i) => i * 5);

  return (
    <div className="bg-gray-800 p-4 rounded-lg flex-grow flex flex-col min-h-[200px] overflow-hidden">
        <div className="relative h-8 mb-2" onClick={handleTimelineClick} ref={timelineRef}>
            <div className="bg-gray-700 h-full rounded-md"></div>
             {timeMarkers.map(time => (
                <div key={time} className="absolute top-0 h-full flex flex-col items-center" style={{ left: `${(time / duration) * 100}%`}}>
                    <div className="w-px h-2 bg-gray-500"></div>
                    <span className="text-xs text-gray-500 mt-1">{formatTime(time)}</span>
                </div>
            ))}
            <div
                className="absolute top-0 h-full w-1 bg-cyan-400 pointer-events-none"
                style={{ left: `${playheadPosition}%` }}
            >
              <div className="w-3 h-3 bg-cyan-400 rounded-full absolute -top-1 -left-1"></div>
            </div>
        </div>
      
        <div className="flex-grow timeline-container overflow-x-auto overflow-y-hidden" onClick={(e) => {
          handleTimelineClick(e);
          onSubtitleSelect(null);
        }}>
            <div className="relative h-24" style={{ width: `${Math.max(100, (duration/15) * 100)}%`}}>
                <div className="w-full h-full">
                    {subtitles.map((sub) => {
                        const left = (sub.startTime / duration) * 100;
                        const width = ((sub.endTime - sub.startTime) / duration) * 100;
                        const isSelected = sub.id === selectedSubtitle;
                        const isEditing = sub.id === editingTextId;

                        return (
                            <div
                                key={sub.id}
                                className={`absolute top-4 h-16 rounded-lg cursor-pointer transition-all duration-150 flex items-center justify-center px-2 ${isSelected ? 'bg-indigo-500 ring-2 ring-indigo-300' : 'bg-indigo-700 hover:bg-indigo-600'}`}
                                style={{ left: `${left}%`, width: `${width}%` }}
                                onClick={(e) => handleSubtitleClick(e, sub.id)}
                                onDoubleClick={(e) => handleDoubleClick(e, sub.id)}
                            >
                               {isEditing ? (
                                    <input 
                                        type="text"
                                        value={sub.text}
                                        onChange={(e) => handleTextChange(e, sub.id)}
                                        onBlur={handleTextBlur}
                                        onKeyDown={handleKeyDown}
                                        className="bg-transparent text-white text-center w-full h-full outline-none"
                                        autoFocus
                                    />
                               ) : (
                                <p className="text-white text-sm truncate select-none">{sub.text}</p>
                               )}
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    </div>
  );
};

export default Timeline;
