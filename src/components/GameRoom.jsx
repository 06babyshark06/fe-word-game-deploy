import { useEffect, useState } from "react";
import useStore from "../store";
import "../styles/room.css";
import socket from "../utils/socket";

export default function GameRoom() {
  const { playerName } = useStore();
  const [players, setPlayers] = useState([]);
  const [timer, setTimer] = useState(0);
  const [canChat, setCanChat] = useState(true);
  const [messages, setMessages] = useState([]);
  const [msg, setMsg] = useState("");
  const [currentRoomId, setCurrentRoomId] = useState("");
  const [isStarted, setIsStarted] = useState(false);
  const [isCreatingRoom, setIsCreatingRoom] = useState(true);
  const [settings, setSettings] = useState({
    roomName: "",
    players: 8,
    language: "English",
    drawTime: 80,
    rounds: 1,
    turns: 1,
    wordCount: 3,
    hints: 2,
    words: [],
    guessingWord: "",
    drawingPlayer: "",
  });

  const handleSettingChange = (key, value) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
  };

  const handleCreateRoom = () => {
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
    setIsCreatingRoom((prev) => !prev);
  };

  const handleStartGame = () => {
    socket.emit("startTurn", { roomId: currentRoomId });
    setIsStarted(true);
  };

  const handleChooseWord = (word) => {
    handleSettingChange("guessingWord", word);
    handleSettingChange("words", []);
    socket.emit("startGuessing", {
      roomId: currentRoomId,
      word: word,
      username: playerName,
      drawTime: settings.drawTime,
    });
  };

  useEffect(() => {
    const handleGetRoomData = (data) => {
      setCurrentRoomId(data.roomId);
      setPlayers(
        data.existingPlayers.map((player) => ({
          id: player.username,
          username: player.username,
          avatar: player.avatar,
          score: data.scores[player.username],
        }))
      );
      handleSettingChange("drawingPlayer", data.drawingPlayer);
      handleSettingChange("turns", data.turn);
      handleSettingChange("rounds", data.round);
      handleSettingChange("guessingWord", data.currentWord);
      setIsStarted(data.isStarted);
      setIsCreatingRoom(false);
    };

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
    socket.on("getRoomData", handleGetRoomData);
    socket.on("chatMessage", (data) => setMessages((prev) => [...prev, data]));
    socket.on("startTurn", (data) => {
      setMessages((prev) => [
        ...prev,
        {
          username: "System",
          message: `Round ${data.round} turn ${data.turn} started`,
        },
      ]);
      setCanChat(true);
      handleSettingChange("drawingPlayer", data.username);
      if (data.username === playerName)
        socket.emit("chooseWord", {
          username: playerName,
          wordsCount: settings.wordCount,
          roomId: currentRoomId,
        });
    });
    socket.on("chooseWord", (data) => {
      if (data.username === playerName) {
        setSettings((prev) => ({ ...prev, words: data.words }));
      }
      setMessages((prev) => [
        ...prev,
        {
          username: "System",
          message: `${data.username} are choosing words`,
        },
      ]);
    });
    socket.on("startGuessing", (data) => {
      handleSettingChange("guessingWord", data.word);
      setMessages((prev) => [
        ...prev,
        {
          username: "System",
          message: `Start guessing the word chosen by ${data.username}`,
        },
      ]);
    });
    socket.on("drawTime", (data) => {
      setTimer(data.drawTime);
    });
    socket.on("guessingTimeOver", (data) => {
      setMessages((prev) => [
        ...prev,
        {
          username: "System",
          message: `Guessing time over, the word was ${data.word}`,
        },
      ]);
    });
    socket.on("gameOver", (data) => {
      setMessages((prev) => [
        ...prev,
        {
          username: "System",
          message: `Game over!!!!!!!!!`,
        },
      ]);
    });
    socket.on("leaderboard", (data) => {
      console.log(data);
      setMessages((prev) => [
        ...prev,
        {
          username: "System",
          message: data
            ? "🏆 Leaderboard:\n" +
              Object.entries(data)
                .sort((a, b) => b[1] - a[1])
                .map(
                  ([username, score], index) =>
                    `${index + 1}. ${username}: ${score}`
                )
                .join("\n")
            : "🏆 Leaderboard chưa có dữ liệu.",
        },
      ]);
    });
    socket.emit("getRoomData", { username: playerName });
    return () => {
      socket.off("approveJoin");
      socket.off("chatMessage");
      socket.off("getRoomData");
      socket.off("startTurn");
      socket.off("chooseWord");
      socket.off("startGuessing");
      socket.off("drawTime");
      socket.off("guessingTimeOver");
      socket.off("gameOver");
      socket.off("leaderboard");
    };
  });

  const sendMessage = () => {
    if (!msg) return;
    if (msg.trim() === settings.guessingWord) {
      if (canChat) {
        socket.emit("guessedCorrectly", {
          username: playerName,
          roomId: currentRoomId,
          score: (timer / settings.drawTime) * 1000,
        });
        setCanChat(false);
        setMsg("");
      }
      return;
    }
    socket.emit("chatMessage", {
      username: playerName,
      message: msg,
      roomId: currentRoomId,
    });
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
          {!isStarted ? (
            <span className="round-info">Waiting</span>
          ) : (
            <>
              <span className="round-info">
                Round {settings.rounds}/{settings.turns}
              </span>
              {settings.guessingWord && (
                <span className="word-hint">
                  {"_".repeat(settings.guessingWord.length)}
                </span>
              )}
              <span className="timer">{timer}</span>
            </>
          )}
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
              <span className="player-score">{p.score}</span>
              <span
                className={`status ${
                  p.username === settings.drawingPlayer ? "drawing" : "guessed"
                }`}
              ></span>
            </div>
          ))}
        </div>
        {isCreatingRoom ? (
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
                  value={settings.turns}
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
                <button className="start-button" onClick={handleCreateRoom}>
                  Create!
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="center-panel">
            <div className="reaction-buttons">
              <button className="thumbs-up">👍</button>
              <button className="thumbs-down">👎</button>
              {players.length &&
                playerName === players[0].username &&
                !isStarted && (
                  <button onClick={handleStartGame}>Start game</button>
                )}
              {settings.words.length > 0 &&
                settings.words.map((w, i) => (
                  <button onClick={() => handleChooseWord(w)} key={i}>
                    {w}
                  </button>
                ))}
            </div>
            <div className="canvas-placeholder">[ Canvas Here ]</div>
          </div>
        )}

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
            disabled={!canChat || settings.drawingPlayer === playerName}
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
