import React from 'react';
import { PlayIcon, PauseIcon, SubtitleIcon, AddIcon, UploadIcon, LoadingSpinner, ExportIcon } from './icons';

interface ControlsPanelProps {
    isPlaying: boolean;
    onPlayPause: () => void;
    currentTime: number;
    duration: number;
    onFileUpload: (event: React.ChangeEvent<HTMLInputElement>) => void;
    onGenerateSubtitles: () => void;
    onAddSubtitle: () => void;
    onExportSrt: () => void;
    hasVideo: boolean;
    hasSubtitles: boolean;
    isGenerating?: boolean;
}

const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
};

const ControlsPanel: React.FC<ControlsPanelProps> = ({
    isPlaying,
    onPlayPause,
    currentTime,
    duration,
    onFileUpload,
    onGenerateSubtitles,
    onAddSubtitle,
    onExportSrt,
    hasVideo,
    hasSubtitles,
    isGenerating = false,
}) => {
    const fileInputRef = React.useRef<HTMLInputElement>(null);

    return (
        <div className="bg-gray-800 p-4 rounded-lg flex flex-col md:flex-row items-center justify-between gap-4 shadow-lg">
            <div className="flex items-center gap-4">
                <input type="file" accept="video/*" ref={fileInputRef} onChange={onFileUpload} className="hidden" />
                <button
                    onClick={() => fileInputRef.current?.click()}
                    className="flex items-center gap-2 bg-gray-700 hover:bg-gray-600 text-white font-semibold py-2 px-4 rounded-lg transition-colors duration-200"
                >
                    <UploadIcon className="w-5 h-5" />
                    Upload
                </button>
                <button
                    onClick={onPlayPause}
                    disabled={!hasVideo}
                    className="p-3 bg-cyan-500 rounded-full text-white hover:bg-cyan-600 disabled:bg-gray-600 disabled:cursor-not-allowed transition-colors duration-200"
                >
                    {isPlaying ? <PauseIcon className="w-6 h-6" /> : <PlayIcon className="w-6 h-6" />}
                </button>
                <div className="text-lg font-mono text-gray-300">
                    <span>{formatTime(currentTime)}</span> / <span>{formatTime(duration)}</span>
                </div>
            </div>
            <div className="flex items-center gap-3">
                <button
                    onClick={onAddSubtitle}
                    disabled={!hasVideo}
                    className="flex items-center gap-2 bg-gray-700 hover:bg-gray-600 text-white font-semibold py-2 px-4 rounded-lg transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    <AddIcon className="w-5 h-5" />
                    Add Subtitle
                </button>
                <button
                    onClick={onGenerateSubtitles}
                    disabled={!hasVideo || isGenerating}
                    className="flex items-center gap-2 bg-indigo-500 hover:bg-indigo-600 text-white font-semibold py-2 px-4 rounded-lg transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {isGenerating ? (
                        <LoadingSpinner className="w-5 h-5" />
                    ) : (
                        <SubtitleIcon className="w-5 h-5" />
                    )}
                    {isGenerating ? 'Generating...' : 'Auto Subtitle'}
                </button>
                 <button
                    onClick={onExportSrt}
                    disabled={!hasVideo || !hasSubtitles}
                    className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    <ExportIcon className="w-5 h-5" />
                    Export .srt
                </button>
            </div>
        </div>
    );
};

export default ControlsPanel;