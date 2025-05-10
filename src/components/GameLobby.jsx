import { useEffect, useState } from "react";
import useStore from "../store";
import "../styles/lobby.css";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import socket from "../utils/socket";
import useAxiosAuth from "../hooks/useAxiosAuth";

const avatars = ["😠", "😡", "😢", "😊", "😜", "😈", "🤓", "🤡"]; // Updated to match Skribbl.io avatars

export default function GameLobby() {
  const [name, setName] = useState("");
  const [roomId, setRoomId] = useState("");
  const [avatarIndex, setAvatarIndex] = useState(0); // Track the current avatar index
  const { username, setUser } = useStore();
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const axiosAuth = useAxiosAuth();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await axiosAuth.get("api/profile", {
          withCredentials: true,
        });
        if (response.status !== 200) return;
        const {
          player,
          user: { name },
        } = response.data;
        setName(player.username);
        setAvatarIndex(avatars.indexOf(player.avatar));
        setUser(name, player.username, player.avatar);
      } catch (error) {
        console.log(error);
      }
    };
    if (!user) {
      navigate("/login");
    }
    fetchData();
    const onConnect = () => {
      console.log("connected with id", socket.id);
    };
    const noRoomAvailable = ({ message }) => {
      alert(message);
    };

    socket.on("connect", onConnect);
    socket.on("noRoomAvailable", noRoomAvailable);
    socket.once("approveJoin", (data) => {
      console.log("Joined room:", data.roomId);
      // lưu dữ liệu nếu cần
      navigate("/game");
    });

    // Cleanup khi component unmount
    return () => {
      socket.off("connect", onConnect);
      socket.off("noRoomAvailable", noRoomAvailable);
      // socket.off("approveJoin")
    };
  }, []);

  const handlePlay = async () => {
    if (name) {
      try {
        await axiosAuth.post(
          "api/profile",
          { username: name, avatar: avatars[avatarIndex], socketID: socket.id },
          { withCredentials: true }
        );
        setUser(username, name, avatars[avatarIndex]);
        socket.emit("joinRoom", { username: name, roomId });
      } catch (error) {
        console.log(error);
        return alert(error);
      }
    } else {
      alert("Please enter your name");
    }
  };

  const handleCreatePrivateRoom = async () => {
    if (!name) return alert("Please enter your name");
    try {
      await axiosAuth.post(
        "api/profile",
        { username: name, avatar: avatars[avatarIndex], socketID: socket.id },
        { withCredentials: true }
      );

      navigate("/game");
    } catch (error) {
      console.log(error);
      return alert(error);
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate("/");
  };

  const handlePreviousAvatar = () => {
    setAvatarIndex((prev) => (prev === 0 ? avatars.length - 1 : prev - 1));
  };

  const handleNextAvatar = () => {
    setAvatarIndex((prev) => (prev === avatars.length - 1 ? 0 : prev + 1));
  };

  return (
    <div className="lobby-container">
      <div className="lobby-header">
        {username && <div className="user-display">👤 {username}</div>}
        <button className="logout-button" onClick={handleLogout}>
          Log Out
        </button>
      </div>

      <h1 className="lobby-title">SKRIBBL.io ✏️</h1>
      <div className="lobby-form">
        <div className="input-row">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Enter your name"
            className="name-input"
          />
          <select className="language-select">
            <option value="English">English</option>
          </select>
        </div>

        {/* Input mới cho Room ID */}
        <input
          value={roomId}
          onChange={(e) => setRoomId(e.target.value)}
          placeholder="Enter Room ID (optional)"
          className="room-input"
        />

        <div className="avatar-section">
          <span className="arrow left-arrow" onClick={handlePreviousAvatar}>
            ❮
          </span>
          <span className="avatar">{avatars[avatarIndex]}</span>
          <span className="arrow right-arrow" onClick={handleNextAvatar}>
            ❯
          </span>
        </div>
        <button className="play-button" onClick={handlePlay}>
          Play!
        </button>
        <button
          className="private-room-button"
          onClick={handleCreatePrivateRoom}
        >
          Create Private Room
        </button>
      </div>
    </div>
  );
}
