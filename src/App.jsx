import React, { useState, useEffect, useRef, useMemo } from "react";
import { initializeApp } from "firebase/app";
import { getAuth, signInAnonymously } from "firebase/auth";
import {
  getFirestore,
  collection,
  doc,
  setDoc,
  getDoc,
  getDocs,
  deleteDoc,
  onSnapshot,
  serverTimestamp,
  increment,
  updateDoc,
} from "firebase/firestore";
import {
  Play,
  Info,
  X,
  Check,
  Plus,
  Minus,
  ChevronRight,
  ChevronLeft,
  Search,
  Bell,
  LogOut,
  Upload,
  Eye,
  AlertCircle,
  WifiOff,
  Settings,
  Save,
  FileVideo,
  Trash2,
  Lock,
  Users,
  Activity,
  BarChart2,
  Download,
  UserPlus,
  Star,
  Briefcase,
  ShieldAlert,
  PieChart,
  Image as ImageIcon,
} from "lucide-react";

// --- CONFIGURATION START ---
let firebaseConfig;
let rawAppId;

if (typeof __firebase_config !== "undefined") {
  // Online Preview Environment (Sandbox)
  firebaseConfig = JSON.parse(__firebase_config);
  rawAppId = typeof __app_id !== "undefined" ? __app_id : "default-app-id";
} else {
  // YOUR LOCAL KEYS (Replace these with your actual keys from Firebase Console)
  firebaseConfig = {
    apiKey: "AIzaSyCg6OiTS4e35r1F9huJDQI2LS7i0G4OylI",
    authDomain: "learnflix-8dd3b.firebaseapp.com",
    projectId: "learnflix-8dd3b",
    storageBucket: "learnflix-8dd3b.firebasestorage.app",
    messagingSenderId: "264465472904",
    appId: "1:264465472904:web:da485ffe3eb7312a086e3d",
    measurementId: "G-908H7ELXYD",
  };
  rawAppId = "learnflix-production-v1";
}

// FIX: Sanitize appId to ensure it has no slashes
const appId = rawAppId.replace(/[\/.]/g, "_");
// --- CONFIGURATION END ---

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

const INITIAL_VIDEOS = [
  {
    id: "vid_1",
    title: "Security Compliance 2025",
    description: "Mandatory security training for all staff members.",
    thumbnail:
      "https://images.unsplash.com/photo-1555949963-ff9fe0c870eb?w=800&q=80",
    videoUrl:
      "https://storage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4",
    category: "Compliance",
    duration: "15m",
    match: "100%",
    views: 1205,
    assignedRoles: ["All", "Developer", "Manager"],
    isRequired: true,
  },
  {
    id: "vid_2",
    title: "xxAdvanced React Patterns",
    description: "Master the art of component composition and hooks.",
    thumbnail: "", // Empty thumbnail to test random frame generation
    videoUrl:
      "https://storage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4",
    category: "Frontendaa Development",
    duration: "45m",
    match: "98%",
    views: 890,
    assignedRoles: ["Developer"],
    isRequired: false,
  },
  {
    id: "vid_3",
    title: "Leadership Principles",
    description: "Core principles for effective team management.",
    thumbnail:
      "https://images.unsplash.com/photo-1519389950473-47ba0277781c?w=800&q=80",
    videoUrl:
      "https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4",
    category: "Management",
    duration: "20m",
    match: "95%",
    views: 450,
    assignedRoles: ["Manager"],
    isRequired: true,
  },
];

// --- COMPONENTS ---
const NetflixLogo = ({ onClick }) => (
  <div
    onClick={onClick}
    className="text-red-600 font-bold text-3xl tracking-tighter cursor-pointer"
  >
    CalexFlicks
  </div>
);

const IconButton = ({ icon: Icon, onClick, className = "", label }) => (
  <button
    onClick={onClick}
    className={`group p-2 hover:bg-zinc-800 rounded-full transition-colors relative ${className}`}
    title={label}
  >
    <Icon className="w-6 h-6 text-white" />
    {label && (
      <span className="absolute -bottom-8 left-1/2 -translate-x-1/2 text-xs bg-zinc-800 text-white px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-50 pointer-events-none">
        {label}
      </span>
    )}
  </button>
);

// --- NEW COMPONENT: Smart Video Thumbnail ---
const VideoThumbnail = ({ video, onClick }) => {
  const [isHovered, setIsHovered] = useState(false);
  const videoRef = useRef(null);

  // Generate a stable "random" time based on the video ID (so it's consistent for the same video)
  // We pick a frame between 5s and 60s to avoid black intros
  const randomFrameTime = useMemo(() => {
    let hash = 0;
    for (let i = 0; i < video.id.length; i++)
      hash = video.id.charCodeAt(i) + ((hash << 5) - hash);
    return (Math.abs(hash) % 55) + 5;
  }, [video.id]);

  useEffect(() => {
    const vid = videoRef.current;
    if (!vid) return;

    if (isHovered) {
      // HOVER: Play 20s loop
      vid.currentTime = 0; // Start loop from beginning (or keep randomFrameTime if you prefer)
      vid.play().catch(() => {});
    } else {
      // NOT HOVERED:
      // If we have a thumbnail image, we don't need the video.
      // If NO thumbnail, we pause at the random frame.
      vid.pause();
      if (!video.thumbnail) {
        vid.currentTime = randomFrameTime;
      }
    }
  }, [isHovered, video.thumbnail, randomFrameTime]);

  // Handle loop logic (reset after 20s)
  const handleTimeUpdate = () => {
    if (isHovered && videoRef.current && videoRef.current.currentTime >= 20) {
      videoRef.current.currentTime = 0;
      videoRef.current.play();
    }
  };

  const hasThumbnail = Boolean(
    video.thumbnail && video.thumbnail.trim() !== ""
  );

  return (
    <div
      onClick={() => onClick(video)}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className="flex-none w-[200px] md:w-[280px] aspect-video relative cursor-pointer transition-transform duration-300 hover:scale-105 hover:z-20 rounded-md overflow-hidden shadow-lg bg-zinc-900 group/card ring-1 ring-white/5"
    >
      {/* Logic:
         1. If Hovered: ALWAYS show video player.
         2. If Not Hovered AND No Thumbnail: Show video player (paused at random frame).
         3. If Not Hovered AND Has Thumbnail: Show Image.
      */}
      {isHovered || !hasThumbnail ? (
        <video
          ref={videoRef}
          src={video.videoUrl}
          className="w-full h-full object-cover"
          muted
          preload="metadata" // Save bandwidth, only load header
          onTimeUpdate={handleTimeUpdate}
          onLoadedMetadata={(e) => {
            // Initial seek for the random frame
            if (!hasThumbnail && !isHovered)
              e.target.currentTime = randomFrameTime;
          }}
        />
      ) : (
        <img
          src={video.thumbnail}
          alt={video.title}
          className="w-full h-full object-cover opacity-90 group-hover/card:opacity-100"
        />
      )}

      {/* Overlay for Required/Assigned */}
      {video.isRequired && (
        <div className="absolute top-2 right-2 bg-red-600 text-white text-[10px] font-bold px-2 py-1 rounded shadow-md z-10 pointer-events-none">
          REQUIRED
        </div>
      )}

      {/* Play Icon (Only show if not hovering and we have a static image or paused video) */}
      {!isHovered && (
        <div className="absolute inset-0 flex items-center justify-center opacity-0 hover:opacity-100 bg-black/40 transition-opacity">
          <Play className="w-12 h-12 text-white fill-white/20" />
        </div>
      )}

      <div className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-black via-black/80 to-transparent opacity-0 group-hover/card:opacity-100 transition-opacity flex justify-between items-end pointer-events-none">
        <div className="text-xs text-white font-semibold truncate flex-1 mr-2">
          {video.title}
        </div>
      </div>
    </div>
  );
};

// --- LOGIN PAGE ---
const LoginPage = ({ onLogin }) => {
  const [formData, setFormData] = useState({ userId: "", password: "" });
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const userRef = doc(
        db,
        "artifacts",
        appId,
        "public",
        "data",
        "users",
        formData.userId
      );
      const userSnap = await getDoc(userRef);

      if (userSnap.exists()) {
        const userData = userSnap.data();
        if (userData.password === formData.password) {
          onLogin({ uid: userData.id, ...userData });
        } else {
          setError("Incorrect password.");
        }
      } else {
        setError("User ID not found.");
      }
    } catch (err) {
      console.error("Login failed:", err);
      setError("Connection failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black/90 bg-[url('https://assets.nflxext.com/ffe/siteui/vlv3/f841d4c7-10e1-40af-bcae-07a3f8dc141a/f6d7434e-d6de-4185-a6d4-c77a2d08737b/US-en-20220502-popsignuptwoweeks-perspective_alpha_website_medium.jpg')] bg-cover bg-center flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60"></div>
      <div className="relative bg-black/75 p-12 rounded-lg w-full max-w-md border border-zinc-800">
        <h1 className="text-3xl font-bold text-white mb-8">Sign In</h1>
        {error && (
          <div className="bg-orange-500/20 text-orange-500 p-3 rounded text-sm mb-4">
            {error}
          </div>
        )}
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <input
              required
              className="w-full bg-[#333] rounded px-4 py-3 text-white placeholder-zinc-400 outline-none focus:bg-[#454545]"
              placeholder="User ID / Email"
              value={formData.userId}
              onChange={(e) =>
                setFormData({ ...formData, userId: e.target.value })
              }
            />
          </div>
          <div>
            <input
              required
              type="password"
              className="w-full bg-[#333] rounded px-4 py-3 text-white placeholder-zinc-400 outline-none focus:bg-[#454545]"
              placeholder="Password"
              value={formData.password}
              onChange={(e) =>
                setFormData({ ...formData, password: e.target.value })
              }
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-3 rounded mt-2 transition-colors disabled:opacity-50"
          >
            {loading ? "Signing In..." : "Sign In"}
          </button>
        </form>
        <div className="mt-6 text-zinc-500 text-sm">
          New to CalexFlicks?{" "}
          <span className="text-white hover:underline cursor-pointer">
            Contact your Admin.
          </span>
        </div>
      </div>
    </div>
  );
};

const VideoModal = ({
  video,
  onClose,
  onLogEvent,
  isFavorite,
  onToggleFavorite,
}) => {
  const videoRef = useRef(null);
  const hasLoggedStart = useRef(false);

  const handleTimeUpdate = () => {
    if (videoRef.current) {
      if (videoRef.current.currentTime > 2 && !hasLoggedStart.current) {
        onLogEvent(video, "partial");
        hasLoggedStart.current = true;
      }
    }
  };

  const handleEnded = () => {
    onLogEvent(video, "full");
  };

  if (!video) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-md p-4 animate-in fade-in duration-200">
      <div className="bg-[#181818] w-full max-w-5xl rounded-xl overflow-hidden shadow-2xl relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-20 bg-black/50 rounded-full p-2 hover:bg-white/20"
        >
          <X className="text-white w-6 h-6" />
        </button>
        <div className="aspect-video w-full bg-black relative">
          <video
            ref={videoRef}
            src={video.videoUrl}
            className="w-full h-full"
            controls
            autoPlay
            onTimeUpdate={handleTimeUpdate}
            onEnded={handleEnded}
          />
        </div>
        <div className="p-8">
          <div className="flex items-start justify-between">
            <div className="flex-1 mr-4">
              <div className="flex items-center space-x-3 mb-3 text-sm">
                <span className="text-green-500 font-bold">
                  {video.match} Match
                </span>
                <span className="text-zinc-400">{video.duration}</span>
                <span className="border border-zinc-600 px-1.5 py-0.5 text-xs text-zinc-400 rounded">
                  HD
                </span>
                {video.isRequired && (
                  <span className="bg-red-600 px-2 py-0.5 text-xs text-white rounded font-bold uppercase tracking-wider">
                    Required
                  </span>
                )}
                <div className="flex items-center space-x-1 text-zinc-400 ml-4">
                  <Eye className="w-4 h-4" />
                  <span>{video.views || 0} views</span>
                </div>
              </div>
              <h2 className="text-3xl font-bold text-white mb-4">
                {video.title}
              </h2>
              <p className="text-zinc-300 text-base leading-relaxed mb-6">
                {video.description}
              </p>
            </div>
            <div className="flex flex-col space-y-3 min-w-[160px]">
              <button
                onClick={() => onLogEvent(video, "full")}
                className="flex items-center justify-center space-x-2 bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-md font-bold transition-all hover:scale-105 active:scale-95"
              >
                <Check className="w-5 h-5" />
                <span>Mark Watched</span>
              </button>
              <button
                onClick={() => onToggleFavorite(video)}
                className={`flex items-center justify-center space-x-2 px-6 py-3 rounded-md font-bold transition-all border-2 ${
                  isFavorite
                    ? "bg-zinc-800 border-zinc-600 text-zinc-300 hover:border-zinc-400"
                    : "bg-transparent border-zinc-500 text-white hover:bg-zinc-800"
                }`}
              >
                {isFavorite ? (
                  <>
                    <Minus className="w-5 h-5" />
                    <span>Remove from List</span>
                  </>
                ) : (
                  <>
                    <Plus className="w-5 h-5" />
                    <span>Add to My List</span>
                  </>
                )}
              </button>
            </div>
          </div>
          <div className="text-xs text-zinc-500 font-mono mt-4 pt-4 border-t border-zinc-800">
            Source: {video.videoUrl}
          </div>
        </div>
      </div>
    </div>
  );
};

// --- SETTINGS / ADMIN PAGE ---
const SettingsPage = ({
  onClose,
  onAddVideo,
  onDeleteVideo,
  onSetFeatured,
  featuredVideoId,
  videos,
  db,
  onCreateUser,
}) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [passwordInput, setPasswordInput] = useState("");
  const [activeTab, setActiveTab] = useState("library");
  const [userList, setUserList] = useState([]);
  const [analyticsList, setAnalyticsList] = useState([]);

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    category: "General",
    duration: "",
    fileName: "",
    isExternalUrl: false,
    thumbnail: "",
    assignedRoles: "",
    isRequired: false,
  });
  const [newUser, setNewUser] = useState({
    id: "",
    password: "",
    jobRole: "Employee",
  });
  const fileInputRef = useRef(null);

  useEffect(() => {
    if (!isAuthenticated) return;
    if (activeTab === "users") {
      const usersRef = collection(
        db,
        "artifacts",
        appId,
        "public",
        "data",
        "users"
      );
      getDocs(usersRef).then((snap) => {
        const users = snap.docs.map((d) => d.data());
        users.sort((a, b) => b.lastSeen?.seconds - a.lastSeen?.seconds);
        setUserList(users);
      });
    }
    if (activeTab === "analytics") {
      const analyticsRef = collection(
        db,
        "artifacts",
        appId,
        "public",
        "data",
        "analytics"
      );
      getDocs(analyticsRef).then((snap) => {
        const events = snap.docs.map((d) => d.data());
        events.sort((a, b) => b.timestamp?.seconds - a.timestamp?.seconds);
        setAnalyticsList(events);
      });
    }
  }, [activeTab, isAuthenticated, db]);

  const handleAdminUnlock = (e) => {
    e.preventDefault();
    if (passwordInput === "Password") {
      setIsAuthenticated(true);
    } else {
      alert("Incorrect Password");
      setPasswordInput("");
    }
  };

  const handleFileSelect = (e) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setFormData((prev) => ({
        ...prev,
        fileName: file.name,
        title: prev.title || file.name.replace(/\.[^/.]+$/, ""),
      }));
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    let finalVideoUrl = formData.fileName;
    if (
      !formData.isExternalUrl &&
      !finalVideoUrl.startsWith("http") &&
      !finalVideoUrl.startsWith("/")
    ) {
      finalVideoUrl = "/" + finalVideoUrl;
    }

    // Process assigned roles (comma separated to array)
    const rolesArray = formData.assignedRoles
      .split(",")
      .map((r) => r.trim())
      .filter((r) => r !== "");
    if (rolesArray.length === 0) rolesArray.push("All");

    onAddVideo({
      ...formData,
      videoUrl: finalVideoUrl,
      id: `vid_${Date.now()}`,
      match: "New",
      views: 0,
      assignedRoles: rolesArray,
    });
    setFormData((prev) => ({
      ...prev,
      title: "",
      fileName: "",
      description: "",
      assignedRoles: "",
      isRequired: false,
      thumbnail: "",
    }));
  };

  const handleCreateUserSubmit = (e) => {
    e.preventDefault();
    onCreateUser(newUser);
    setNewUser({ id: "", password: "", jobRole: "Employee" });
  };

  const handleExportCSV = () => {
    if (!analyticsList.length) {
      alert("No data to export");
      return;
    }
    const headers = ["Video Title", "Event Status", "User ID", "Timestamp"];
    const rows = analyticsList.map((item) => {
      const date = item.timestamp
        ? new Date(item.timestamp.seconds * 1000).toLocaleString()
        : "N/A";
      const title = `"${item.videoTitle || "Unknown"}"`;
      const status = item.event === "full" ? "Completed" : "Started";
      return [title, status, item.userId, date].join(",");
    });
    const csvContent =
      "data:text/csv;charset=utf-8," +
      headers.join(",") +
      "\n" +
      rows.join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute(
      "download",
      `learnflix_analytics_${new Date().toISOString().slice(0, 10)}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (!isAuthenticated) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#141414] text-white">
        <div className="bg-black/80 p-8 rounded-xl border border-zinc-800 shadow-2xl max-w-md w-full">
          <div className="flex flex-col items-center mb-6">
            <div className="bg-zinc-800 p-3 rounded-full mb-4">
              <Lock className="w-8 h-8 text-red-600" />
            </div>
            <h2 className="text-2xl font-bold">Admin Console</h2>
            <p className="text-zinc-400 text-sm mt-1">Enter Master Password</p>
          </div>
          <form onSubmit={handleAdminUnlock} className="space-y-4">
            <input
              type="password"
              autoFocus
              className="w-full bg-zinc-900 border border-zinc-700 rounded p-3 text-white focus:border-red-600 outline-none text-center tracking-widest"
              placeholder="Password"
              value={passwordInput}
              onChange={(e) => setPasswordInput(e.target.value)}
            />
            <button
              type="submit"
              className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-3 rounded transition-colors"
            >
              Unlock
            </button>
            <button
              type="button"
              onClick={onClose}
              className="w-full text-zinc-500 hover:text-white text-sm py-2"
            >
              Go Back
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="pt-24 px-4 md:px-12 min-h-screen bg-[#141414] text-white w-full">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-8 border-b border-zinc-800 pb-4">
          <div className="flex items-center gap-6">
            <h1 className="text-3xl font-bold flex items-center gap-3">
              <Settings className="w-8 h-8 text-zinc-400" /> Admin Console
            </h1>
            <div className="flex space-x-1 bg-zinc-900 p-1 rounded-lg">
              <button
                onClick={() => setActiveTab("library")}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  activeTab === "library"
                    ? "bg-zinc-700 text-white"
                    : "text-zinc-400 hover:text-white"
                }`}
              >
                Library
              </button>
              <button
                onClick={() => setActiveTab("users")}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  activeTab === "users"
                    ? "bg-zinc-700 text-white"
                    : "text-zinc-400 hover:text-white"
                }`}
              >
                Users
              </button>
              <button
                onClick={() => setActiveTab("analytics")}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  activeTab === "analytics"
                    ? "bg-zinc-700 text-white"
                    : "text-zinc-400 hover:text-white"
                }`}
              >
                Analytics
              </button>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-zinc-400 hover:text-white flex items-center px-4 py-2 bg-zinc-900 rounded hover:bg-zinc-800 transition-colors"
          >
            <X className="w-5 h-5 mr-2" /> Close
          </button>
        </div>

        {activeTab === "library" && (
          <div className="grid lg:grid-cols-3 gap-8">
            <div className="lg:col-span-1">
              <div className="bg-black/40 p-6 rounded-xl border border-zinc-800 shadow-xl sticky top-24">
                <h2 className="text-xl font-bold mb-6 flex items-center text-green-500">
                  <Plus className="w-5 h-5 mr-2" /> Add New Video
                </h2>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-zinc-500 uppercase mb-1">
                      File Name
                    </label>
                    <div className="flex gap-2">
                      <div className="flex-1 flex">
                        <span className="bg-zinc-700 text-zinc-400 p-2 rounded-l border border-r-0 border-zinc-700 select-none text-sm flex items-center">
                          /
                        </span>
                        <input
                          required
                          className="w-full bg-zinc-800 border border-zinc-700 rounded-r p-2 text-white focus:border-red-600 outline-none font-mono text-sm"
                          value={formData.fileName}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              fileName: e.target.value,
                            })
                          }
                          placeholder="video.mp4"
                        />
                      </div>
                      <input
                        type="file"
                        accept="video/*"
                        ref={fileInputRef}
                        onChange={handleFileSelect}
                        className="hidden"
                      />
                      <button
                        type="button"
                        onClick={() => fileInputRef.current.click()}
                        className="bg-zinc-700 hover:bg-zinc-600 text-white px-3 rounded"
                        title="Select file"
                      >
                        <FileVideo className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-zinc-500 uppercase mb-1">
                      Title
                    </label>
                    <input
                      required
                      className="w-full bg-zinc-800 border border-zinc-700 rounded p-2 text-white focus:border-red-600 outline-none"
                      value={formData.title}
                      onChange={(e) =>
                        setFormData({ ...formData, title: e.target.value })
                      }
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-xs font-bold text-zinc-500 uppercase mb-1">
                        Roles (comma sep)
                      </label>
                      <input
                        className="w-full bg-zinc-800 border border-zinc-700 rounded p-2 text-white text-sm"
                        value={formData.assignedRoles}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            assignedRoles: e.target.value,
                          })
                        }
                        placeholder="Developer, Manager"
                      />
                    </div>
                    <div className="flex items-center pt-6">
                      <input
                        type="checkbox"
                        className="mr-2 w-4 h-4 accent-red-600"
                        checked={formData.isRequired}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            isRequired: e.target.checked,
                          })
                        }
                      />
                      <label className="text-xs font-bold text-zinc-500 uppercase">
                        Required?
                      </label>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-xs font-bold text-zinc-500 uppercase mb-1">
                        Category
                      </label>
                      <select
                        className="w-full bg-zinc-800 border border-zinc-700 rounded p-2 text-white text-sm"
                        value={formData.category}
                        onChange={(e) =>
                          setFormData({ ...formData, category: e.target.value })
                        }
                      >
                        <option>General</option>
                        <option>Frontend Development</option>
                        <option>Backend Development</option>
                        <option>Design</option>
                        <option>Business</option>
                        <option>Compliance</option>
                        <option>Management</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-zinc-500 uppercase mb-1">
                        Duration
                      </label>
                      <input
                        className="w-full bg-zinc-800 border border-zinc-700 rounded p-2 text-white text-sm"
                        value={formData.duration}
                        onChange={(e) =>
                          setFormData({ ...formData, duration: e.target.value })
                        }
                        placeholder="10m"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-zinc-500 uppercase mb-1">
                      Thumbnail URL (Optional)
                    </label>
                    <div className="flex gap-2">
                      <div className="flex-1 flex">
                        <span className="bg-zinc-700 text-zinc-400 p-2 rounded-l border border-r-0 border-zinc-700 select-none text-sm flex items-center">
                          <ImageIcon className="w-4 h-4" />
                        </span>
                        <input
                          className="w-full bg-zinc-800 border border-zinc-700 rounded-r p-2 text-white focus:border-red-600 outline-none font-mono text-sm"
                          value={formData.thumbnail}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              thumbnail: e.target.value,
                            })
                          }
                          placeholder="Leave empty for auto-generation"
                        />
                      </div>
                    </div>
                    <p className="text-[10px] text-zinc-500 mt-1">
                      Leave empty to use a random video frame.
                    </p>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-zinc-500 uppercase mb-1">
                      Description
                    </label>
                    <textarea
                      required
                      rows={2}
                      className="w-full bg-zinc-800 border border-zinc-700 rounded p-2 text-white focus:border-red-600 outline-none text-sm"
                      value={formData.description}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          description: e.target.value,
                        })
                      }
                    />
                  </div>
                  <button
                    type="submit"
                    className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-3 rounded mt-2 flex items-center justify-center"
                  >
                    <Save className="w-4 h-4 mr-2" /> Add to Library
                  </button>
                </form>
              </div>
            </div>
            <div className="lg:col-span-2">
              <div className="bg-zinc-900/50 p-6 rounded-xl border border-zinc-800">
                <h2 className="text-xl font-bold mb-6 flex items-center text-white">
                  <Settings className="w-5 h-5 mr-2" /> Manage Library (
                  {videos.length} items)
                </h2>
                <div className="space-y-3">
                  {videos.map((vid) => (
                    <div
                      key={vid.id}
                      className="flex items-center justify-between bg-zinc-900 border border-zinc-800 p-4 rounded-lg group hover:border-zinc-700 transition-colors"
                    >
                      <div className="flex items-center space-x-4">
                        <div className="w-16 h-9 bg-zinc-800 rounded overflow-hidden flex-shrink-0 relative">
                          <img
                            src={
                              vid.thumbnail ||
                              "https://via.placeholder.com/150/000000/FFFFFF/?text=VIDEO"
                            }
                            className="w-full h-full object-cover opacity-60"
                            alt=""
                          />
                        </div>
                        <div>
                          <h4 className="font-bold text-sm text-white flex items-center">
                            {vid.title}
                            {vid.isRequired && (
                              <span className="ml-2 text-[10px] bg-red-600 px-1.5 rounded text-white">
                                REQ
                              </span>
                            )}
                          </h4>
                          <div className="text-xs text-zinc-500 flex gap-2">
                            <span>
                              {vid.assignedRoles?.join(", ") || "All"}
                            </span>
                            <span>•</span>
                            <span className="font-mono text-zinc-600">
                              {vid.views || 0} views
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => onSetFeatured(vid.id)}
                          className={`p-2 rounded transition-colors ${
                            featuredVideoId === vid.id
                              ? "bg-yellow-600/20 text-yellow-500"
                              : "bg-zinc-800 text-zinc-400 hover:bg-zinc-700"
                          }`}
                          title="Set Featured"
                        >
                          <Star
                            className={`w-5 h-5 ${
                              featuredVideoId === vid.id ? "fill-current" : ""
                            }`}
                          />
                        </button>
                        <button
                          onClick={() => onDeleteVideo(vid.id)}
                          className="p-2 bg-zinc-800 text-zinc-400 hover:bg-red-900/30 hover:text-red-500 rounded transition-colors"
                          title="Delete Video"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === "users" && (
          <div className="grid lg:grid-cols-3 gap-8">
            <div className="lg:col-span-1">
              <div className="bg-black/40 p-6 rounded-xl border border-zinc-800 shadow-xl">
                <h2 className="text-xl font-bold mb-6 flex items-center text-blue-500">
                  <UserPlus className="w-5 h-5 mr-2" /> Create User
                </h2>
                <form onSubmit={handleCreateUserSubmit} className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-zinc-500 uppercase mb-1">
                      User ID / Email
                    </label>
                    <input
                      required
                      className="w-full bg-zinc-800 border border-zinc-700 rounded p-2 text-white focus:border-blue-600 outline-none"
                      value={newUser.id}
                      onChange={(e) =>
                        setNewUser({ ...newUser, id: e.target.value })
                      }
                      placeholder="user@company.com"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-zinc-500 uppercase mb-1">
                      Password
                    </label>
                    <input
                      required
                      type="text"
                      className="w-full bg-zinc-800 border border-zinc-700 rounded p-2 text-white focus:border-blue-600 outline-none"
                      value={newUser.password}
                      onChange={(e) =>
                        setNewUser({ ...newUser, password: e.target.value })
                      }
                      placeholder="Temporary Password"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-zinc-500 uppercase mb-1">
                      Job Role
                    </label>
                    <select
                      className="w-full bg-zinc-800 border border-zinc-700 rounded p-2 text-white focus:border-blue-600 outline-none"
                      value={newUser.jobRole}
                      onChange={(e) =>
                        setNewUser({ ...newUser, jobRole: e.target.value })
                      }
                    >
                      <option>Employee</option>
                      <option>Developer</option>
                      <option>Manager</option>
                      <option>Sales</option>
                      <option>Admin</option>
                    </select>
                  </div>
                  <button
                    type="submit"
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded mt-2 flex items-center justify-center"
                  >
                    <Save className="w-4 h-4 mr-2" /> Save User
                  </button>
                </form>
              </div>
            </div>
            <div className="lg:col-span-2">
              <div className="bg-zinc-900/50 p-6 rounded-xl border border-zinc-800">
                <h2 className="text-xl font-bold mb-6 flex items-center text-white">
                  <Users className="w-5 h-5 mr-2" /> Registered Users (
                  {userList.length})
                </h2>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm text-zinc-400">
                    <thead className="bg-zinc-900 text-zinc-500 uppercase font-bold text-xs">
                      <tr>
                        <th className="p-4 rounded-tl-lg">User ID</th>
                        <th className="p-4">Role</th>
                        <th className="p-4 rounded-tr-lg">Last Active</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-800">
                      {userList.map((u, i) => (
                        <tr key={i} className="hover:bg-zinc-800/50">
                          <td className="p-4 font-mono text-white">
                            {u.uid || u.id}
                          </td>
                          <td className="p-4">
                            <span className="bg-blue-900/50 text-blue-400 px-2 py-1 rounded text-xs border border-blue-800">
                              {u.jobRole || "Employee"}
                            </span>
                          </td>
                          <td className="p-4">
                            {u.lastSeen
                              ? new Date(
                                  u.lastSeen.seconds * 1000
                                ).toLocaleString()
                              : "N/A"}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === "analytics" && (
          <div className="bg-zinc-900/50 p-6 rounded-xl border border-zinc-800">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold flex items-center text-white">
                <Activity className="w-5 h-5 mr-2" /> Recent View Activity (
                {analyticsList.length})
              </h2>
              <button
                onClick={handleExportCSV}
                className="bg-green-700 hover:bg-green-600 text-white px-4 py-2 rounded flex items-center text-sm font-bold transition-colors"
              >
                <Download className="w-4 h-4 mr-2" /> Export to Excel
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-zinc-400">
                <thead className="bg-zinc-900 text-zinc-500 uppercase font-bold text-xs">
                  <tr>
                    <th className="p-4 rounded-tl-lg">Video Title</th>
                    <th className="p-4">Status</th>
                    <th className="p-4">User ID</th>
                    <th className="p-4 rounded-tr-lg">Timestamp</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800">
                  {analyticsList.map((ev, i) => (
                    <tr key={i} className="hover:bg-zinc-800/50">
                      <td className="p-4 font-bold text-white">
                        {ev.videoTitle}
                      </td>
                      <td className="p-4">
                        <span
                          className={`px-2 py-1 rounded text-xs font-bold ${
                            ev.event === "full"
                              ? "bg-green-900/50 text-green-400 border border-green-800"
                              : "bg-yellow-900/50 text-yellow-400 border border-yellow-800"
                          }`}
                        >
                          {ev.event === "full"
                            ? "COMPLETED"
                            : "STARTED (Partial)"}
                        </span>
                      </td>
                      <td className="p-4 font-mono text-xs">
                        {ev.userId ? ev.userId.slice(0, 8) + "..." : "Unknown"}
                      </td>
                      <td className="p-4">
                        {ev.timestamp
                          ? new Date(
                              ev.timestamp.seconds * 1000
                            ).toLocaleString()
                          : "N/A"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

const VideoRow = ({ title, videos, onVideoClick }) => {
  const scrollRef = useRef(null);
  const scroll = (direction) => {
    if (scrollRef.current) {
      const { current } = scrollRef;
      const scrollAmount =
        direction === "left" ? -window.innerWidth / 2 : window.innerWidth / 2;
      current.scrollBy({ left: scrollAmount, behavior: "smooth" });
    }
  };
  if (!videos || videos.length === 0) return null;
  return (
    <div className="mb-10 group relative">
      <h3 className="text-xl font-semibold text-zinc-200 mb-3 px-4 md:px-12 hover:text-white transition-colors cursor-pointer flex items-center">
        {title}
        <ChevronRight className="w-5 h-5 opacity-0 group-hover:opacity-100 transition-opacity ml-1 text-cyan-400" />
      </h3>
      <div className="group/row relative">
        <button
          onClick={() => scroll("left")}
          className="absolute left-0 top-0 bottom-0 z-40 bg-black/50 hover:bg-black/70 w-12 flex items-center justify-center opacity-0 group-hover/row:opacity-100 transition-opacity h-full"
        >
          <ChevronLeft className="text-white w-8 h-8" />
        </button>
        <div
          ref={scrollRef}
          className="flex space-x-2 overflow-x-auto scrollbar-hide px-4 md:px-12 pb-8 pt-4 scroll-smooth"
          style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
        >
          {videos.map((video) => (
            <VideoThumbnail
              key={video.id}
              video={video}
              onClick={onVideoClick}
            />
          ))}
        </div>
        <button
          onClick={() => scroll("right")}
          className="absolute right-0 top-0 bottom-0 z-40 bg-black/50 hover:bg-black/70 w-12 flex items-center justify-center opacity-0 group-hover/row:opacity-100 transition-opacity h-full"
        >
          <ChevronRight className="text-white w-8 h-8" />
        </button>
      </div>
    </div>
  );
};

export default function App() {
  const [user, setUser] = useState(null);
  const [videos, setVideos] = useState([]);
  const [favorites, setFavorites] = useState(new Set());
  const [watchHistory, setWatchHistory] = useState(new Set()); // Need full history for score
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedVideo, setSelectedVideo] = useState(null);
  const [view, setView] = useState("home");
  const [featuredVideoId, setFeaturedVideoId] = useState(null);

  useEffect(() => {
    const storedUser = localStorage.getItem("learnflix_user");
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
    signInAnonymously(auth).catch((err) =>
      console.warn("Background auth failed", err)
    );
  }, []);

  useEffect(() => {
    if (!user) return;
    try {
      const videosRef = collection(
        db,
        "artifacts",
        appId,
        "public",
        "data",
        "videos"
      );
      const unsubscribeVideos = onSnapshot(
        videosRef,
        (snapshot) => {
          if (snapshot.empty) {
            Promise.all(
              INITIAL_VIDEOS.map((v) => setDoc(doc(videosRef, v.id), v))
            ).catch((e) =>
              console.warn("Seeding failed (permissions?), ignoring:", e)
            );
            setVideos(INITIAL_VIDEOS);
          } else {
            setVideos(snapshot.docs.map((d) => d.data()));
          }
          setLoading(false);
        },
        (err) => {
          console.error("Database Error:", err);
          setError(
            "Database Connection Failed: " +
              err.message +
              ". Check Firebase Console Rules."
          );
          setLoading(false);
        }
      );
      const configRef = doc(
        db,
        "artifacts",
        appId,
        "public",
        "data",
        "config",
        "ui"
      );
      const unsubscribeConfig = onSnapshot(configRef, (snap) => {
        if (snap.exists()) setFeaturedVideoId(snap.data().featuredId);
      });

      // Fetch Watch History
      const historyRef = collection(
        db,
        "artifacts",
        appId,
        "users",
        user.uid,
        "history"
      );
      const unsubscribeHistory = onSnapshot(historyRef, (snap) => {
        setWatchHistory(new Set(snap.docs.map((d) => d.id)));
      });

      return () => {
        unsubscribeVideos();
        unsubscribeConfig();
        unsubscribeHistory();
      };
    } catch (e) {
      console.error("Critical Setup Error:", e);
      setError("Setup Error: " + e.message);
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (!user) return;
    const favRef = collection(
      db,
      "artifacts",
      appId,
      "users",
      user.uid,
      "favorites"
    );
    const unsubscribeFav = onSnapshot(
      favRef,
      (snapshot) => {
        const favIds = new Set(snapshot.docs.map((d) => d.id));
        setFavorites(favIds);
      },
      (err) => console.error("Favorites Error:", err)
    );
    return () => unsubscribeFav();
  }, [user]);

  const logAnalyticsEvent = async (video, type) => {
    if (!user) return;
    try {
      const analyticsRef = collection(
        db,
        "artifacts",
        appId,
        "public",
        "data",
        "analytics"
      );
      await setDoc(doc(analyticsRef), {
        userId: user.uid,
        videoId: video.id,
        videoTitle: video.title,
        event: type,
        timestamp: serverTimestamp(),
      });
      if (type === "full") {
        const historyRef = doc(
          db,
          "artifacts",
          appId,
          "users",
          user.uid,
          "history",
          video.id
        );
        await setDoc(historyRef, {
          watchedAt: serverTimestamp(),
          videoId: video.id,
          title: video.title,
        });
        const videoRef = doc(
          db,
          "artifacts",
          appId,
          "public",
          "data",
          "videos",
          video.id
        );
        updateDoc(videoRef, { views: increment(1) }).catch(() => {});
      }
    } catch (e) {
      console.error("Analytics Error:", e);
    }
  };

  const handleToggleFavorite = async (video) => {
    if (!user) return;
    try {
      const favoriteRef = doc(
        db,
        "artifacts",
        appId,
        "users",
        user.uid,
        "favorites",
        video.id
      );
      if (favorites.has(video.id)) {
        await deleteDoc(favoriteRef);
      } else {
        await setDoc(favoriteRef, {
          addedAt: serverTimestamp(),
          videoId: video.id,
          title: video.title,
        });
      }
    } catch (e) {
      console.error("Error toggling favorite:", e);
      alert("Failed to update My List. Check console.");
    }
  };

  const handleAddVideo = async (newVideoData) => {
    if (!user) {
      alert("You must be logged in to add videos.");
      return;
    }
    try {
      const videosRef = collection(
        db,
        "artifacts",
        appId,
        "public",
        "data",
        "videos"
      );
      await setDoc(doc(videosRef, newVideoData.id), newVideoData);
      alert("Video Added Permanently!");
    } catch (e) {
      console.error("Error adding video:", e);
      alert("Failed to add video. Error: " + e.message);
    }
  };

  const handleCreateUser = async (userData) => {
    if (!user) return;
    try {
      const usersRef = collection(
        db,
        "artifacts",
        appId,
        "public",
        "data",
        "users"
      );
      await setDoc(doc(usersRef, userData.id), {
        id: userData.id,
        password: userData.password,
        jobRole: userData.jobRole,
        createdAt: serverTimestamp(),
        isAnonymous: false,
        createdByAdmin: true,
      });
      alert(`User ${userData.id} added successfully!`);
    } catch (e) {
      console.error("Error creating user:", e);
      alert("Failed to create user: " + e.message);
    }
  };

  const handleDeleteVideo = async (videoId) => {
    if (!user) return;
    if (
      !confirm(
        "Are you sure you want to delete this video? This cannot be undone."
      )
    )
      return;
    try {
      const videoRef = doc(
        db,
        "artifacts",
        appId,
        "public",
        "data",
        "videos",
        videoId
      );
      await deleteDoc(videoRef);
    } catch (e) {
      console.error("Error deleting video:", e);
      alert("Failed to delete video: " + e.message);
    }
  };

  const handleSetFeatured = async (id) => {
    try {
      await setDoc(
        doc(db, "artifacts", appId, "public", "data", "config", "ui"),
        { featuredId: id },
        { merge: true }
      );
    } catch (e) {
      console.error("Error setting featured:", e);
    }
  };

  const handleAppLogin = (userData) => {
    setUser(userData);
    localStorage.setItem("learnflix_user", JSON.stringify(userData));
    try {
      setDoc(
        doc(db, "artifacts", appId, "public", "data", "users", userData.id),
        { lastSeen: serverTimestamp() },
        { merge: true }
      );
    } catch (e) {
      console.error("Login sync failed", e);
    }
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem("learnflix_user");
    setView("home");
  };

  // --- DERIVED STATE ---
  const userRole = user?.jobRole || "All"; // Default to 'All' or user's role

  // Filter videos assigned to this user's role
  const assignedVideos = useMemo(() => {
    return videos.filter((v) => {
      if (!v.assignedRoles) return true; // Legacy support
      return (
        v.assignedRoles.includes("All") || v.assignedRoles.includes(userRole)
      );
    });
  }, [videos, userRole]);

  // Calculate Compliance Score
  const complianceStats = useMemo(() => {
    const required = assignedVideos.filter((v) => v.isRequired);
    const completed = required.filter((v) => watchHistory.has(v.id));
    const score =
      required.length > 0
        ? Math.round((completed.length / required.length) * 100)
        : 100;
    return {
      score,
      requiredCount: required.length,
      completedCount: completed.length,
    };
  }, [assignedVideos, watchHistory]);

  const categories = useMemo(() => {
    const cats = {};
    assignedVideos.forEach((v) => {
      if (!cats[v.category]) cats[v.category] = [];
      cats[v.category].push(v);
    });
    return cats;
  }, [assignedVideos]);
  const myListVideos = useMemo(() => {
    return videos.filter((v) => favorites.has(v.id));
  }, [videos, favorites]);

  // Hero Video Logic: Use dynamic featured video or fallback to first video.
  const heroVideo = useMemo(() => {
    return (
      videos.find((v) => v.id === featuredVideoId) ||
      videos[0] ||
      INITIAL_VIDEOS[0]
    );
  }, [videos, featuredVideoId]);

  if (!user) {
    return <LoginPage onLogin={handleAppLogin} />;
  }
  if (loading) {
    return (
      <div className="min-h-screen bg-[#141414] flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-red-600"></div>
      </div>
    );
  }
  if (error) {
    return (
      <div className="min-h-screen bg-[#141414] flex items-center justify-center p-4">
        <div className="bg-red-900/30 border border-red-500 rounded p-8 max-w-lg text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-white mb-2">
            Connection Error
          </h2>
          <p className="text-zinc-300 break-words">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-6 bg-white text-black px-6 py-2 rounded font-bold"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }
  if (view === "settings") {
    return (
      <SettingsPage
        onClose={() => setView("home")}
        onAddVideo={handleAddVideo}
        onDeleteVideo={handleDeleteVideo}
        onSetFeatured={handleSetFeatured}
        featuredVideoId={featuredVideoId}
        onCreateUser={handleCreateUser}
        videos={videos}
        db={db}
      />
    );
  }

  return (
    <div className="min-h-screen bg-[#141414] text-white font-sans pb-20 w-full overflow-x-hidden">
      <style>{`:root { font-family: Inter, system-ui, Avenir, Helvetica, Arial, sans-serif; line-height: 1.5; font-weight: 400; color-scheme: dark; } html, body, #root { width: 100%; min-height: 100vh; margin: 0; padding: 0; max-width: 100% !important; background-color: #141414; display: block !important; place-items: unset !important; }`}</style>
      <nav className="fixed top-0 w-full z-40 bg-gradient-to-b from-black/90 to-transparent px-4 md:px-12 py-4 flex justify-between items-center">
        <div className="flex items-center gap-8">
          <NetflixLogo onClick={() => setView("home")} />
          <ul className="hidden md:flex space-x-4 text-sm font-medium text-zinc-300">
            <li
              className="hover:text-white cursor-pointer"
              onClick={() => setView("home")}
            >
              Home
            </li>
            {myListVideos.length > 0 && (
              <li className="hover:text-white cursor-pointer font-bold">
                My List
              </li>
            )}
            <li
              className="hover:text-white cursor-pointer"
              onClick={() => setView("settings")}
            >
              Library Settings
            </li>
          </ul>
        </div>
        <div className="flex items-center space-x-4">
          {/* Compliance Score Widget */}
          <div
            className="hidden md:flex flex-col mr-6 w-32"
            title={`Compliance Score: ${complianceStats.score}%`}
          >
            <div className="flex justify-between items-center mb-1">
              <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">
                Compliance
              </span>
              <span
                className={`text-xs font-bold ${
                  complianceStats.score === 100
                    ? "text-green-500"
                    : "text-orange-500"
                }`}
              >
                {complianceStats.score}%
              </span>
            </div>
            <div className="w-full h-1.5 bg-zinc-800 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-1000 ease-out ${
                  complianceStats.score === 100
                    ? "bg-green-500"
                    : "bg-gradient-to-r from-red-500 to-orange-500"
                }`}
                style={{ width: `${complianceStats.score}%` }}
              />
            </div>
          </div>
          {user && (
            <span className="text-xs text-zinc-500 hidden sm:inline flex flex-col items-end leading-tight">
              <span>{user.id}</span>
              <span className="text-[10px] text-zinc-600 bg-zinc-800 px-1 rounded">
                {user.jobRole || "Employee"}
              </span>
            </span>
          )}
          <IconButton
            icon={Upload}
            onClick={() => setView("settings")}
            label="Upload Video"
          />
          <IconButton
            icon={Settings}
            onClick={() => setView("settings")}
            label="Settings"
          />
          <IconButton icon={LogOut} onClick={handleLogout} label="Sign Out" />
        </div>
      </nav>

      {/* Hero Section - UPDATED with Video Loop */}
      <div className="relative h-[70vh] w-full mb-8">
        <div className="absolute inset-0">
          <video
            src={heroVideo.videoUrl}
            className="w-full h-full object-cover"
            autoPlay
            muted
            onTimeUpdate={(e) => {
              if (e.target.currentTime >= 20) e.target.currentTime = 0;
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#141414] via-transparent to-transparent" />
        </div>
        <div className="absolute bottom-0 left-0 p-4 md:p-12 w-full max-w-2xl">
          <div className="flex gap-2 mb-4">
            {heroVideo.isRequired && (
              <span className="bg-red-600 text-white text-xs font-bold px-2 py-1 rounded">
                REQUIRED
              </span>
            )}
            <span className="bg-zinc-800 text-zinc-300 text-xs font-bold px-2 py-1 rounded">
              {heroVideo.category}
            </span>
          </div>
          <h1 className="text-4xl md:text-6xl font-black mb-4 drop-shadow-lg">
            {heroVideo.title}
          </h1>
          <p className="text-lg text-zinc-200 mb-6 drop-shadow-md">
            {heroVideo.description}
          </p>
          <button
            onClick={() => setSelectedVideo(heroVideo)}
            className="bg-white text-black px-8 py-3 rounded font-bold flex items-center space-x-2 hover:bg-gray-200 transition-colors"
          >
            <Play className="fill-black" /> <span>Play</span>
          </button>
        </div>
      </div>

      {/* Rows */}
      {complianceStats.requiredCount > 0 && (
        <VideoRow
          title="Required for Compliance"
          videos={assignedVideos.filter((v) => v.isRequired)}
          onVideoClick={setSelectedVideo}
        />
      )}
      {myListVideos.length > 0 && (
        <VideoRow
          title="My List"
          videos={myListVideos}
          onVideoClick={setSelectedVideo}
        />
      )}
      {Object.entries(categories).map(([cat, vids]) => (
        <VideoRow
          key={cat}
          title={cat}
          videos={vids}
          onVideoClick={setSelectedVideo}
        />
      ))}

      {selectedVideo && (
        <VideoModal
          video={selectedVideo}
          onClose={() => setSelectedVideo(null)}
          onLogEvent={logAnalyticsEvent}
          isFavorite={favorites.has(selectedVideo.id)}
          onToggleFavorite={handleToggleFavorite}
        />
      )}
    </div>
  );
}
