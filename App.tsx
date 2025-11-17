
import React, { useState, useRef, useEffect, useCallback } from 'react';
import Header from './components/Header';
import VideoPlayer from './components/VideoPlayer';
import ControlsPanel from './components/ControlsPanel';
import Timeline from './components/Timeline';
import { LoadingSpinner } from './components/icons';
import { Subtitle, VideoFile } from './types';
import { generateSubtitlesFromAudio } from './services/geminiService';

const blobToBase64 = (blob: Blob): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = (reader.result as string).split(',')[1];
      resolve(base64String);
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
};

const bufferToWav = (buffer: AudioBuffer): Blob => {
    const numOfChan = buffer.numberOfChannels;
    const length = buffer.length * numOfChan * 2 + 44;
    const bufferArr = new ArrayBuffer(length);
    const view = new DataView(bufferArr);
    const channels = [];
    let i;
    let sample;
    let offset = 0;
    let pos = 0;

    const setUint16 = (data: number) => {
        view.setUint16(pos, data, true);
        pos += 2;
    }

    const setUint32 = (data: number) => {
        view.setUint32(pos, data, true);
        pos += 4;
    }

    setUint32(0x46464952); // "RIFF"
    setUint32(length - 8); 
    setUint32(0x45564157); // "WAVE"
    setUint32(0x20746d66); // "fmt " chunk
    setUint32(16);
    setUint16(1);
    setUint16(numOfChan);
    setUint32(buffer.sampleRate);
    setUint32(buffer.sampleRate * 2 * numOfChan);
    setUint16(numOfChan * 2);
    setUint16(16);
    setUint32(0x61746164); // "data" - chunk
    setUint32(length - pos - 4);

    for (i = 0; i < buffer.numberOfChannels; i++) {
        channels.push(buffer.getChannelData(i));
    }

    while (pos < length) {
        for (i = 0; i < numOfChan; i++) {
            sample = Math.max(-1, Math.min(1, channels[i][offset]));
            sample = (0.5 + sample < 0 ? sample * 32768 : sample * 32767) | 0;
            view.setInt16(pos, sample, true);
            pos += 2;
        }
        offset++;
    }

    return new Blob([view], { type: 'audio/wav' });
};

const formatSrtTime = (timeInSeconds: number): string => {
    const hours = Math.floor(timeInSeconds / 3600);
    const minutes = Math.floor((timeInSeconds % 3600) / 60);
    const seconds = Math.floor(timeInSeconds % 60);
    const milliseconds = Math.round((timeInSeconds - Math.floor(timeInSeconds)) * 1000);

    const pad = (num: number, length: number = 2) => num.toString().padStart(length, '0');

    return `${pad(hours)}:${pad(minutes)}:${pad(seconds)},${pad(milliseconds, 3)}`;
};


const App: React.FC = () => {
    const [videoFile, setVideoFile] = useState<VideoFile | null>(null);
    const [subtitles, setSubtitles] = useState<Subtitle[]>([]);
    const [currentTime, setCurrentTime] = useState<number>(0);
    const [isPlaying, setIsPlaying] = useState<boolean>(false);
    const [loadingMessage, setLoadingMessage] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [selectedSubtitle, setSelectedSubtitle] = useState<string | null>(null);

    const videoRef = useRef<HTMLVideoElement>(null);
    const timelineContainerRef = useRef<HTMLDivElement>(null);

    const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            const url = URL.createObjectURL(file);
            const videoElement = document.createElement('video');
            videoElement.src = url;
            videoElement.onloadedmetadata = () => {
                setVideoFile({ url, name: file.name, duration: videoElement.duration });
                setSubtitles([]);
                setCurrentTime(0);
                setIsPlaying(false);
            };
        }
    };

    const handlePlayPause = () => {
        if (!videoRef.current) return;
        if (isPlaying) {
            videoRef.current.pause();
        } else {
            videoRef.current.play();
        }
        setIsPlaying(!isPlaying);
    };
    
    const handleTimeUpdate = () => {
        if (!videoRef.current) return;
        setCurrentTime(videoRef.current.currentTime);
    };

    const handleSeek = (time: number) => {
        if (!videoRef.current) return;
        videoRef.current.currentTime = time;
        setCurrentTime(time);
    };

    const handleGenerateSubtitles = async () => {
        if (!videoFile) return;

        setLoadingMessage('Extracting audio from video...');
        setError(null);

        try {
            const response = await fetch(videoFile.url);
            const videoData = await response.arrayBuffer();

            // FIX: Cast window to `any` to support `webkitAudioContext` for older browsers.
            const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
            const audioBufferSource = await audioContext.decodeAudioData(videoData.slice(0)); 

            const offlineContext = new OfflineAudioContext({
                numberOfChannels: 1,
                sampleRate: 16000,
                length: Math.ceil(audioBufferSource.duration * 16000),
            });

            const source = offlineContext.createBufferSource();
            source.buffer = audioBufferSource;
            source.connect(offlineContext.destination);
            source.start();

            const resampledBuffer = await offlineContext.startRendering();
            const wavBlob = bufferToWav(resampledBuffer);
            const audioBase64 = await blobToBase64(wavBlob);

            setLoadingMessage('Generating subtitles with Gemini...');
            const newSubs = await generateSubtitlesFromAudio(audioBase64, 'audio/wav', videoFile.duration);
            
            const formattedSubs: Subtitle[] = newSubs.map((s, i) => ({
                ...s,
                id: `sub-${Date.now()}-${i}`,
            }));

            setSubtitles(formattedSubs);

        } catch (err) {
            console.error(err);
            setError(err instanceof Error ? err.message : 'Failed to process audio and generate subtitles.');
        } finally {
            setLoadingMessage(null);
        }
    };
    
    const handleAddSubtitle = () => {
        if (!videoFile) return;
        const newSubtitle: Subtitle = {
            id: `sub-${Date.now()}`,
            startTime: currentTime,
            endTime: Math.min(currentTime + 5, videoFile.duration),
            text: 'New Subtitle',
        };
        setSubtitles(prev => [...prev, newSubtitle].sort((a,b) => a.startTime - b.startTime));
    };

    const handleSubtitleChange = (id: string, newSubtitle: Partial<Subtitle>) => {
        setSubtitles(prev => prev.map(sub => sub.id === id ? { ...sub, ...newSubtitle } : sub));
    };

    const handleSubtitleDelete = useCallback((id: string) => {
        setSubtitles(prev => prev.filter(sub => sub.id !== id));
        setSelectedSubtitle(null);
    }, []);

    const handleExportSrt = () => {
        if (!subtitles.length || !videoFile) {
            return;
        }

        const srtContent = subtitles
            .map((sub, index) => {
                const startTime = formatSrtTime(sub.startTime);
                const endTime = formatSrtTime(sub.endTime);
                return `${index + 1}\n${startTime} --> ${endTime}\n${sub.text}`;
            })
            .join('\n\n');

        const blob = new Blob([srtContent], { type: 'text/srt' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        
        const fileName = videoFile.name.split('.').slice(0, -1).join('.') || 'subtitles';
        a.download = `${fileName}.srt`;
        
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    useEffect(() => {
      const handleKeyDown = (e: KeyboardEvent) => {
        if ((e.key === 'Backspace' || e.key === 'Delete') && selectedSubtitle) {
          handleSubtitleDelete(selectedSubtitle);
        }
      };
      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
    }, [selectedSubtitle, handleSubtitleDelete]);


    useEffect(() => {
        const video = videoRef.current;
        if (video) {
            video.addEventListener('timeupdate', handleTimeUpdate);
            video.addEventListener('play', () => setIsPlaying(true));
            video.addEventListener('pause', () => setIsPlaying(false));
            video.addEventListener('ended', () => setIsPlaying(false));

            const currentVideoURL = videoFile?.url;

            return () => {
                video.removeEventListener('timeupdate', handleTimeUpdate);
                video.removeEventListener('play', () => setIsPlaying(true));
                video.removeEventListener('pause', () => setIsPlaying(false));
                video.removeEventListener('ended', () => setIsPlaying(false));
                if (currentVideoURL) {
                    URL.revokeObjectURL(currentVideoURL);
                }
            };
        }
    }, [videoFile?.url]);

    const handleExport = () => {
      alert("Export functionality is a mock-up in this demo. Client-side video rendering is complex and typically requires a server or advanced libraries like FFMPEG.wasm.");
    }

    return (
        <div className="h-screen w-screen flex flex-col bg-gray-900 overflow-hidden">
            <Header onExport={handleExport} />
            <main className="flex-grow p-4 grid grid-cols-1 lg:grid-cols-3 gap-4 h-full overflow-hidden">
                <div className="lg:col-span-2 flex flex-col gap-4 h-full min-h-0">
                    <VideoPlayer
                        videoFile={videoFile}
                        currentTime={currentTime}
                        subtitles={subtitles}
                        videoRef={videoRef}
                    />
                    <ControlsPanel
                        isPlaying={isPlaying}
                        onPlayPause={handlePlayPause}
                        currentTime={currentTime}
                        duration={videoFile?.duration || 0}
                        onFileUpload={handleFileUpload}
                        onGenerateSubtitles={handleGenerateSubtitles}
                        onAddSubtitle={handleAddSubtitle}
                        onExportSrt={handleExportSrt}
                        hasVideo={!!videoFile}
                        hasSubtitles={subtitles.length > 0}
                        isGenerating={!!loadingMessage}
                    />
                </div>
                <div ref={timelineContainerRef} className="lg:col-span-1 flex flex-col gap-4 h-full min-h-0">
                  <h2 className="text-lg font-semibold text-gray-300">Timeline</h2>
                    <Timeline
                        duration={videoFile?.duration || 0}
                        currentTime={currentTime}
                        subtitles={subtitles}
                        onSeek={handleSeek}
                        onSubtitleChange={handleSubtitleChange}
                        onSubtitleDelete={handleSubtitleDelete}
                        selectedSubtitle={selectedSubtitle}
                        onSubtitleSelect={setSelectedSubtitle}
                    />
                </div>
            </main>
            {loadingMessage && (
                <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 flex-col gap-4">
                    <LoadingSpinner className="w-16 h-16 text-cyan-400" />
                    <p className="text-xl text-gray-300">{loadingMessage}</p>
                </div>
            )}
            {error && (
                <div className="fixed bottom-4 right-4 bg-red-500 text-white py-3 px-6 rounded-lg shadow-lg z-50">
                    <p><span className="font-bold">Error:</span> {error}</p>
                    <button onClick={() => setError(null)} className="absolute top-1 right-2 text-xl font-bold">&times;</button>
                </div>
            )}
        </div>
    );
};

export default App;