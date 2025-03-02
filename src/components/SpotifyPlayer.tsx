import React, { useState } from "react";
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Volume2,
  Music,
} from "lucide-react";

interface SpotifyPlayerProps {
  playlist: {
    name: string;
    description: string;
    tracks: Array<{
      title: string;
      artist: string;
    }>;
    embedUrl: string;
  };
}

const SpotifyPlayer: React.FC<SpotifyPlayerProps> = ({ playlist }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTrack, setCurrentTrack] = useState(0);
  const [progress, setProgress] = useState(35);

  const togglePlayback = () => {
    setIsPlaying(!isPlaying);
  };

  const nextTrack = () => {
    setCurrentTrack((prev) => (prev + 1) % playlist.tracks.length);
  };

  const prevTrack = () => {
    setCurrentTrack((prev) =>
      prev === 0 ? playlist.tracks.length - 1 : prev - 1
    );
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? "0" : ""}${secs}`;
  };

  const currentTrackInfo = playlist.tracks[currentTrack];
  const trackDuration = 217; // 3:37 in seconds
  const currentTime = Math.floor(trackDuration * (progress / 100));

  return (
    <div className="bg-black text-white rounded-xl overflow-hidden shadow-lg">
      <div className="p-4 bg-gradient-to-r from-green-900 to-green-800">
        <div className="flex items-center">
          <div className="w-12 h-12 rounded-full bg-green-500 flex items-center justify-center mr-3">
            <Music size={20} />
          </div>
          <div>
            <h3 className="font-bold">{playlist.name}</h3>
            <p className="text-xs text-green-300">{playlist.description}</p>
          </div>
        </div>
      </div>

      <div className="p-4">
        <div className="mb-4">
          <div className="text-sm text-gray-400 mb-1">Now Playing</div>
          <div className="font-medium">{currentTrackInfo.title}</div>
          <div className="text-sm text-gray-400">{currentTrackInfo.artist}</div>
        </div>

        <div className="mb-4">
          <div className="flex justify-between text-xs text-gray-400 mb-1">
            <span>{formatTime(currentTime)}</span>
            <span>{formatTime(trackDuration)}</span>
          </div>
          <div className="w-full h-1 bg-gray-700 rounded-full overflow-hidden">
            <div
              className="h-full bg-green-500 rounded-full"
              style={{ width: `${progress}%` }}
            ></div>
          </div>
        </div>

        <div className="flex justify-between items-center">
          <button className="text-gray-400 hover:text-white transition-colors">
            <SkipBack size={20} onClick={prevTrack} />
          </button>
          <button
            className="w-12 h-12 rounded-full bg-green-500 flex items-center justify-center hover:bg-green-600 transition-colors"
            onClick={togglePlayback}
          >
            {isPlaying ? <Pause size={20} /> : <Play size={20} />}
          </button>
          <button className="text-gray-400 hover:text-white transition-colors">
            <SkipForward size={20} onClick={nextTrack} />
          </button>
        </div>
      </div>

      <div className="p-4 border-t border-gray-800">
        <div className="text-sm text-gray-400 mb-2">Up Next</div>
        <div className="space-y-2">
          {playlist.tracks.map(
            (track, index) =>
              index !== currentTrack &&
              index < currentTrack + 3 && (
                <div
                  key={index}
                  className="flex items-center p-2 rounded-lg hover:bg-gray-800 cursor-pointer"
                  onClick={() => setCurrentTrack(index)}
                >
                  <div className="w-8 h-8 bg-gray-700 rounded-md flex items-center justify-center mr-3">
                    <Music size={14} />
                  </div>
                  <div>
                    <div className="text-sm font-medium">{track.title}</div>
                    <div className="text-xs text-gray-400">{track.artist}</div>
                  </div>
                </div>
              )
          )}
        </div>
      </div>
    </div>
  );
};

export default SpotifyPlayer;
