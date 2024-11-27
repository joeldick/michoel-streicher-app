import React, { useEffect, useState } from "react";
import AudioPlayer from "react-h5-audio-player";
import "react-h5-audio-player/lib/styles.css";
import { parseBlob } from "music-metadata";

const SongList = () => {
  const [albums, setAlbums] = useState([]); // Albums with songs
  const [currentSong, setCurrentSong] = useState(null); // Current song
  const [currentCover, setCurrentCover] = useState("https://via.placeholder.com/150"); // Default cover art
  const albumArtCache = {}; // Cache to store album art by song URL

  // Fetch album art from MP3 metadata
  const fetchAlbumArt = async (songUrl) => {
    if (albumArtCache[songUrl]) {
      return albumArtCache[songUrl];
    }

    try {
      const response = await fetch(songUrl);
      const blob = await response.blob();
      const metadata = await parseBlob(blob);
      const picture = metadata.common.picture?.[0];

      if (picture) {
        const base64String = btoa(
          String.fromCharCode(...new Uint8Array(picture.data))
        );
        const albumArt = `data:${picture.format};base64,${base64String}`;
        albumArtCache[songUrl] = albumArt; // Cache the album art
        return albumArt;
      }

      return "https://via.placeholder.com/150"; // Fallback if no album art
    } catch (error) {
      console.error("Error fetching album art:", error);
      return "https://via.placeholder.com/150"; // Fallback in case of error
    }
  };

  // Fetch the albums and songs when the component mounts
  useEffect(() => {
    const fetchSongs = async () => {
      try {
        const response = await fetch(
          "https://storage.googleapis.com/storage/v1/b/michoel-streicher-songs/o"
        );
        const data = await response.json();
        const files = data.items;

        const groupedAlbums = {};
        files.forEach((file) => {
          const [album, song] = file.name.split("/");
          if (!groupedAlbums[album]) {
            groupedAlbums[album] = [];
          }
          groupedAlbums[album].push(song);
        });

        const albumList = Object.keys(groupedAlbums).map((album) => ({
          name: album,
          songs: groupedAlbums[album].filter(Boolean).map((song) => ({
            name: song,
            url: `https://storage.googleapis.com/michoel-streicher-songs/${encodeURIComponent(
              album
            )}/${encodeURIComponent(song)}`,
          })),
        }));

        // Fetch album art for each album using the first song in the album
        for (const album of albumList) {
          const firstSong = album.songs[0];
          if (firstSong) {
            const albumArt = await fetchAlbumArt(firstSong.url);
            album.cover = albumArt;
          } else {
            album.cover = "https://via.placeholder.com/150";
          }
        }

        setAlbums(albumList);
      } catch (error) {
        console.error("Error fetching songs:", error);
      }
    };

    fetchSongs();
  }, []);

  // Handle song selection
  const handlePlay = async (song) => {
    setCurrentSong(song);

    // Fetch album art
    const albumArt = await fetchAlbumArt(song.url);
    setCurrentCover(albumArt);
  };

  return (
    <div>
      <div
        style={{
          position: "sticky",
          top: 0,
          background: "white",
          zIndex: 1000,
          borderBottom: "1px solid #ccc",
          padding: "10px 0",
        }}
      >
        <AudioPlayer
          src={currentSong?.url || ""}
          header={
            <div style={{ display: "flex", alignItems: "center" }}>
              <img
                src={currentCover}
                alt="Album Art"
                style={{
                  width: "50px",
                  height: "50px",
                  borderRadius: "5px",
                  marginRight: "10px",
                }}
              />
              <div>
                <div>{currentSong?.name || "Select a song"}</div>
                <div style={{ fontSize: "0.9em", color: "gray" }}>
                  {currentSong?.album || ""}
                </div>
              </div>
            </div>
          }
          onPlay={() => {
            if (currentSong) handlePlay(currentSong);
          }}
          autoPlayAfterSrcChange={true}
        />
      </div>
      <div style={{ marginTop: "20px" }}>
        {albums.map((album, index) => (
          <div key={index} style={{ marginBottom: "20px" }}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                marginBottom: "10px",
              }}
            >
              <img
                src={album.cover}
                alt={`${album.name} Cover`}
                style={{
                  width: "50px",
                  height: "50px",
                  borderRadius: "5px",
                  marginRight: "10px",
                }}
              />
              <h2>{album.name}</h2>
            </div>
            <ul>
              {album.songs.map((song, songIndex) => (
                <li
                  key={songIndex}
                  style={{ cursor: "pointer", margin: "5px 0" }}
                >
                  <button
                    style={{
                      background: "none",
                      border: "none",
                      cursor: "pointer",
                      color: "blue",
                      textDecoration: "underline",
                    }}
                    onClick={() => handlePlay({ ...song, album: album.name })}
                  >
                    {song.name}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
};

export default SongList;
