
import React from 'react';
import { Subtitle, VideoFile } from '../types';

interface VideoPlayerProps {
  videoFile: VideoFile | null;
  currentTime: number;
  subtitles: Subtitle[];
  videoRef: React.RefObject<HTMLVideoElement>;
}

const VideoPlayer: React.FC<VideoPlayerProps> = ({ videoFile, currentTime, subtitles, videoRef }) => {
  const activeSubtitle = subtitles.find(
    (sub) => currentTime >= sub.startTime && currentTime <= sub.endTime
  );

  return (
    <div className="bg-black aspect-video w-full relative flex items-center justify-center rounded-lg overflow-hidden shadow-lg">
      {videoFile ? (
        <>
          <video ref={videoRef} src={videoFile.url} className="w-full h-full object-contain" />
          {activeSubtitle && (
            <div className="absolute bottom-4 md:bottom-8 lg:bottom-12 px-4 w-full text-center">
              <p className="text-lg md:text-2xl lg:text-3xl font-bold text-white py-2 px-4 rounded-md" style={{ backgroundColor: 'rgba(0, 0, 0, 0.7)', textShadow: '2px 2px 4px rgba(0,0,0,0.8)' }}>
                {activeSubtitle.text}
              </p>
            </div>
          )}
        </>
      ) : (
        <div className="text-gray-400 flex flex-col items-center gap-4">
          <svg className="w-24 h-24 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
          <span className="text-lg">Upload a video to start editing</span>
        </div>
      )}
    </div>
  );
};

export default VideoPlayer;
