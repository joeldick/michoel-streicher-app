import React, { useEffect, useState } from "react";
import ReactAudioPlayer from "react-h5-audio-player";
import "react-h5-audio-player/lib/styles.css"; // Import default styles
import { parseBuffer } from "music-metadata"; // Import from the new library
import "../styles/SongList.css";

const SongList = () => {
  const [albums, setAlbums] = useState([]);
  const [currentSong, setCurrentSong] = useState(null); // For selected song
  const [currentAlbumArt, setCurrentAlbumArt] = useState(null); // For album art
  const [currentSongTitle, setCurrentSongTitle] = useState(""); // For song title

  useEffect(() => {
    const fetchSongs = async () => {
      try {
        const response = await fetch(
          "https://storage.googleapis.com/storage/v1/b/michoel-streicher-songs/o"
        );
        const data = await response.json();
        const files = data.items;
        const groupedAlbums = {};

        // Group files by album folder
        files.forEach((file) => {
          const [album, song] = file.name.split("/");
          if (!groupedAlbums[album]) {
            groupedAlbums[album] = { songs: [] };
          }
          groupedAlbums[album].songs.push(song);
        });

        // Convert to an array of album objects
        const albumList = Object.keys(groupedAlbums).map((album) => ({
          name: album,
          songs: groupedAlbums[album].songs.filter(Boolean), // Remove undefined entries
        }));

        setAlbums(albumList);
      } catch (error) {
        console.error("Error fetching songs:", error);
      }
    };

    fetchSongs();
  }, []);

  // Handles song selection
  const handleSongSelect = async (album, song) => {
    const songUrl = `https://storage.googleapis.com/michoel-streicher-songs/${encodeURIComponent(
      album.name
    )}/${encodeURIComponent(song)}`;
    setCurrentSong(songUrl);
    setCurrentSongTitle(song);
  
    // Extract album art from MP3 file
    try {
      const response = await fetch(songUrl);
      const arrayBuffer = await response.arrayBuffer();
      const metadata = await parseBuffer(new Uint8Array(arrayBuffer), { mimeType: "audio/mpeg" });
      
      console.log("Metadata:", metadata); // Log metadata to check for album art
  
      const picture = metadata.common.picture?.[0];
  
      if (picture) {
        const blob = new Blob([picture.data], { type: picture.format });
        const url = URL.createObjectURL(blob);
        setCurrentAlbumArt(url);
      } else {
        console.warn("No album art found in metadata.");
        setCurrentAlbumArt(null);
      }
    } catch (error) {
      console.error("Error extracting album art:", error);
      setCurrentAlbumArt(null);
    }
  };
  

  return (
    <div>
      <h1>Michoel Streicher Collection</h1>

      {/* Centralized Audio Player */}
      <ReactAudioPlayer
        src={currentSong}
        autoPlay
        controls
        style={{ width: "100%", marginBottom: "20px" }}
        header={
          currentSong && (
            <div style={{ display: "flex", alignItems: "center" }}>
              {currentAlbumArt && (
                <img
                  src={currentAlbumArt}
                  alt="Album Art"
                  style={{
                    width: "50px",
                    height: "50px",
                    marginRight: "10px",
                    borderRadius: "4px",
                  }}
                />
              )}
              <p style={{ margin: 0 }}>{currentSongTitle}</p>
            </div>
          )
        }
      />

      {/* Album and Song List */}
      {albums.map((album, index) => (
        <div key={index}>
          <h2>{album.name}</h2>
          <ul>
            {album.songs.map((song, idx) => (
              <li key={idx}>
                <button
                  onClick={() => handleSongSelect(album, song)}
                  style={{ cursor: "pointer" }}
                >
                  {song}
                </button>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
};

export default SongList;
