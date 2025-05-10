import { useEffect, useState } from "react";
import useStore from "../store";
import "../styles/room.css";
import socket from "../utils/socket";

export default function GameRoom() {
  const { playerName } = useStore();
  const [players, setPlayers] = useState([]);
  const [messages, setMessages] = useState([]);
  const [msg, setMsg] = useState("");
  const [currentRoomId, setCurrentRoomId] = useState("");
  const [settings, setSettings] = useState({
    roomName: "",
    players: 8,
    language: "English",
    drawTime: 80,
    rounds: 0,
    turns: 0,
    wordCount: 3,
    hints: 2,
  });

  const handleSettingChange = (key, value) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
  };

  const handleStartGame = () => {
    socket.emit("createRoom", {
      username: playerName,
      roomName: settings.roomName,
      occupancy: settings.players,
      maxRound: settings.rounds,
      turnsPerRound: settings.turns,
      wordsCount: settings.wordCount,
      drawTime: settings.drawTime,
      hints: settings.hints,
    });
  };

  useEffect(() => {
    socket.on("approveJoin", (data) => {
      setCurrentRoomId(data.roomId);
      setPlayers((prev) => [
        ...prev,
        {
          id: data.username,
          username: data.username,
          avatar: data.avatar,
          score: 0,
        },
      ]);
    });
    const handleGetRoomData = (data) => {
      setCurrentRoomId(data.roomId);
      setPlayers(
        data.existingPlayers.map((player) => ({
          id: player.username,
          username: player.username,
          avatar: player.avatar,
          score: player.score,
        }))
      );
    };

    socket.on("getRoomData", handleGetRoomData);
    socket.on("chatMessage", (data) => setMessages((prev) => [...prev, data]));
    // setPlayers([
    //   ...players,
    //   { id: playerName, username: playerName, avatar, score: 0 },
    // ]);
    socket.emit("getRoomData", { username: playerName });
    return () => {
      socket.off("approveJoin");
      socket.off("chatMessage");
    };
  }, []);

  const sendMessage = () => {
    socket.emit("chatMessage", { username: playerName, message: msg, roomId: currentRoomId });
    setMsg("");
  };

  return (
    <div className="game-room">
      <div className="header">
        <div className="title-container">
          <h1 className="game-title">SKRIBBL.io ✏️</h1>
          <span className="room-id">Room: {currentRoomId}</span>
        </div>
        <div className="game-info">
          <span className="player-count">{players.length}</span>
          {settings.rounds === 0 ? (
            <span className="round-info">Waiting</span>
          ) : (
            <span className="round-info">
              Round {settings.rounds}/{settings.turns}
            </span>
          )}
          {/* <span className="word-hint">______</span> */}
          <span className="timer">0:00</span>
        </div>
      </div>
      <div className="main-content">
        <div className="left-panel">
          {players.map((p, index) => (
            <div
              key={p.id}
              className={`player ${
                p.username === playerName ? "current-player" : ""
              }`}
            >
              <span className="player-rank">#{index + 1}</span>
              <span className="player-avatar">{p.avatar}</span>
              <span className="player-name">
                {p.username}
                {p.username === playerName && " (You)"}
              </span>
              <span className="player-score">0</span>
              <span
                className={`status ${
                  p.username === "Ayush Sharma" ? "drawing" : "guessed"
                }`}
              ></span>
            </div>
          ))}
        </div>
        <div className="center-panel">
          <div className="settings-form">
            <div className="settings-row">
              <label>Room name: </label>
              <input
                type="text"
                value={settings.roomName}
                onChange={(e) =>
                  handleSettingChange("roomName", e.target.value)
                }
              />
            </div>
            <div className="settings-row">
              <label>Players</label>
              <select
                value={settings.players}
                onChange={(e) =>
                  handleSettingChange("players", parseInt(e.target.value))
                }
              >
                {[...Array(15).keys()].map((i) => (
                  <option key={i + 2} value={i + 2}>
                    {i + 2}
                  </option>
                ))}
              </select>
            </div>
            <div className="settings-row">
              <label>Language</label>
              <select
                value={settings.language}
                onChange={(e) =>
                  handleSettingChange("language", e.target.value)
                }
              >
                <option value="English">English</option>
                <option value="Vietnamese">Vietnamese</option>
              </select>
            </div>
            <div className="settings-row">
              <label>Draw time</label>
              <select
                value={settings.drawTime}
                onChange={(e) =>
                  handleSettingChange("drawTime", parseInt(e.target.value))
                }
              >
                {[30, 60, 80, 100, 120].map((time) => (
                  <option key={time} value={time}>
                    {time}
                  </option>
                ))}
              </select>
            </div>
            <div className="settings-row">
              <label>Rounds</label>
              <select
                value={settings.rounds}
                onChange={(e) =>
                  handleSettingChange("rounds", parseInt(e.target.value))
                }
              >
                {[1, 2, 3, 4, 5].map((round) => (
                  <option key={round} value={round}>
                    {round}
                  </option>
                ))}
              </select>
            </div>
            <div className="settings-row">
              <label>Turns</label>
              <select
                value={settings.rounds}
                onChange={(e) =>
                  handleSettingChange("turns", parseInt(e.target.value))
                }
              >
                {[1, 2, 3, 4, 5].map((round) => (
                  <option key={round} value={round}>
                    {round}
                  </option>
                ))}
              </select>
            </div>
            <div className="settings-row">
              <label>Word Count</label>
              <select
                value={settings.wordCount}
                onChange={(e) =>
                  handleSettingChange("wordCount", parseInt(e.target.value))
                }
              >
                {[1, 2, 3, 4].map((count) => (
                  <option key={count} value={count}>
                    {count}
                  </option>
                ))}
              </select>
            </div>
            <div className="settings-row">
              <label>Hints</label>
              <select
                value={settings.hints}
                onChange={(e) =>
                  handleSettingChange("hints", parseInt(e.target.value))
                }
              >
                {[0, 1, 2, 3].map((hint) => (
                  <option key={hint} value={hint}>
                    {hint}
                  </option>
                ))}
              </select>
            </div>

            <div className="settings-buttons">
              <button className="start-button" onClick={handleStartGame}>
                Create!
              </button>
            </div>
          </div>
        </div>
        <div className="right-panel">
          <div className="chat">
            {messages.map((m, i) => (
              <div
                key={i}
                className={`chat-message ${
                  m.username === playerName ? "highlight" : ""
                }`}
              >
                <span className="message-username">{m.username}</span>:{" "}
                {m.message}
              </div>
            ))}
          </div>
          <input
            value={msg}
            onChange={(e) => setMsg(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.nativeEvent.isComposing) {
                sendMessage();
              }
            }}
            placeholder="Type your guess..."
            className="chat-input"
          />
        </div>
      </div>
    </div>
  );
}
