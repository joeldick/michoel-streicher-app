import React, { useEffect, useState } from "react";
import ReactJkMusicPlayer from "react-jinke-music-player";
import "react-jinke-music-player/assets/index.css";
import "../styles/SongList.css";
import * as mm from "music-metadata";

const SongList = () => {
  const [playlist, setPlaylist] = useState([]); // Initial playlist
  const [currentIndex, setCurrentIndex] = useState(0); // Current track index
  const albumArtCache = {}; // Cache for album art

  // Fetch the list of songs from Google Cloud Storage on mount
  useEffect(() => {
    const fetchSongs = async () => {
      try {
        const response = await fetch(
          "https://storage.googleapis.com/storage/v1/b/michoel-streicher-songs/o"
        );
        const data = await response.json();

        // Map songs to playlist format
        const parsedSongs = data.items.map((file) => {
          const [album, song] = file.name.split("/");
          return {
            name: song,
            singer: album,
            musicSrc: `https://storage.googleapis.com/michoel-streicher-songs/${encodeURIComponent(
              album
            )}/${encodeURIComponent(song)}`,
            cover: "https://via.placeholder.com/150", // Default placeholder
          };
        });

        setPlaylist(parsedSongs);
      } catch (error) {
        console.error("Error fetching song list:", error);
      }
    };

    fetchSongs();
  }, []);

  // Fetch album art from the MP3 metadata
  const fetchAlbumArt = async (songUrl) => {
    if (albumArtCache[songUrl]) {
      return albumArtCache[songUrl]; // Return cached art
    }

    try {
      const response = await fetch(songUrl);
      const blob = await response.blob();
      const metadata = await mm.parseBlob(blob);
      const picture = metadata.common.picture?.[0];

      if (picture) {
        const base64String = btoa(
          String.fromCharCode(...new Uint8Array(picture.data))
        );
        const albumArt = `data:${picture.format};base64,${base64String}`;
        albumArtCache[songUrl] = albumArt; // Cache it
        return albumArt;
      }
    } catch (error) {
      console.error("Error fetching album art:", error);
    }

    return "https://via.placeholder.com/150"; // Default cover
  };

  const handleAudioPlay = async (audioInfo) => {
    const { musicSrc } = audioInfo;

    // Fetch the album art for the current song
    const albumArt = await fetchAlbumArt(musicSrc);

    // Update the playlist with the fetched album art
    setPlaylist((prevPlaylist) =>
      prevPlaylist.map((track) =>
        track.musicSrc === musicSrc ? { ...track, cover: albumArt } : track
      )
    );
  };

  const handleAudioPlayTrackChange = async (currentPlayIndex, audioInfo) => {
    setCurrentIndex(currentPlayIndex);
    await handleAudioPlay(audioInfo); // Ensure album art updates on track change
  };

  return (
    <div>
      <h1>Michoel Streicher Collection</h1>
      <ReactJkMusicPlayer
        audioLists={playlist}
        mode="full"
        theme="light"
        autoPlay={false}
        onAudioPlay={handleAudioPlay}
        onAudioPlayTrackChange={handleAudioPlayTrackChange}
        showDownload={false}
        defaultPlayIndex={0}
        showMediaSession={true}
        glassBg={true}
        clearPriorAudioLists={false} // Retain the playlist when updated
      />
    </div>
  );
};

export default SongList;
