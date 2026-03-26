/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { X, Info, Shirt, Image as ImageIcon, Plus, Upload, Trash2, LogIn, LogOut } from "lucide-react";
import { 
  collection, 
  onSnapshot, 
  query, 
  orderBy, 
  addDoc, 
  serverTimestamp,
  deleteDoc,
  doc 
} from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { signInWithPopup, GoogleAuthProvider, signOut, onAuthStateChanged, User } from "firebase/auth";
import { db, storage, auth } from "./firebase";
import { Character, WardrobeItem, PortfolioItem } from "./types";

const ADMIN_EMAILS = ["Pinky890114@gmail.com"]; // Add authorized emails here

export default function App() {
  const [characters, setCharacters] = useState<Character[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [showAdmin, setShowAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  const selectedCharacter = characters.find((c) => c.id === selectedId);

  // Auth Listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (u) => {
      setUser(u);
    });
    return () => unsubscribe();
  }, []);

  // Firestore Listener
  useEffect(() => {
    const q = query(collection(db, "characters"), orderBy("createdAt", "desc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const chars = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Character[];
      setCharacters(chars);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // Handle escape key to close
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") setSelectedId(null);
    };
    window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, []);

  const isAdmin = user && ADMIN_EMAILS.map(e => e.toLowerCase()).includes((user.email || "").toLowerCase());

  const handleLogin = async () => {
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
    } catch (error) {
      console.error("Login failed:", error);
    }
  };

  const handleLogout = () => signOut(auth);

  return (
    <div className="min-h-screen bg-bg selection:bg-white selection:text-black">
      {/* Header */}
      <header className="fixed top-0 left-0 w-full z-40 p-8 flex justify-between items-center mix-blend-difference">
        <h1 className="serif text-2xl font-bold tracking-widest uppercase">沈梨家的寶寶們</h1>
        <div className="flex items-center gap-6">
          {isAdmin && (
            <button 
              onClick={() => setShowAdmin(true)}
              className="text-[10px] tracking-widest uppercase opacity-50 hover:opacity-100 flex items-center gap-2"
            >
              <Plus className="w-3 h-3" /> Add Character
            </button>
          )}
          {user ? (
            <button onClick={handleLogout} className="text-[10px] tracking-widest uppercase opacity-50 hover:opacity-100 flex items-center gap-2">
              <LogOut className="w-3 h-3" /> Logout
            </button>
          ) : (
            <button onClick={handleLogin} className="text-[10px] tracking-widest uppercase opacity-50 hover:opacity-100 flex items-center gap-2">
              <LogIn className="w-3 h-3" /> Login
            </button>
          )}
        </div>
      </header>

      <main className="pt-32 pb-20 px-4 sm:px-8 lg:px-16">
        {loading ? (
          <div className="flex justify-center items-center h-[50vh]">
            <div className="animate-pulse serif text-xl opacity-30">Loading Gallery...</div>
          </div>
        ) : characters.length === 0 ? (
          <div className="flex flex-col justify-center items-center h-[50vh] text-center">
            <p className="serif text-2xl opacity-30 mb-4">目前還沒有寶寶喔</p>
            {isAdmin && <button onClick={() => setShowAdmin(true)} className="px-6 py-2 border border-white/20 rounded-full text-xs uppercase tracking-widest hover:bg-white hover:text-black transition-all">新增第一個寶寶</button>}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
            {characters.map((char) => (
              <motion.div
                key={char.id}
                layoutId={char.id}
                onClick={() => setSelectedId(char.id)}
                className="group relative aspect-[2/3] cursor-pointer overflow-hidden bg-zinc-900 rounded-sm"
                whileHover={{ scale: 1.02 }}
                transition={{ type: "spring", stiffness: 300, damping: 30 }}
              >
                <img
                  src={char.posterUrl}
                  alt={char.name}
                  loading="lazy"
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110 opacity-80 group-hover:opacity-100"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 flex flex-col justify-end p-6">
                  <span className="serif text-4xl italic text-white/20 absolute top-4 right-4 select-none">
                    {char.japaneseName}
                  </span>
                  <h3 className="serif text-2xl font-light">{char.name}</h3>
                  <p className="text-[10px] tracking-widest uppercase opacity-60 mt-2">View Profile</p>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </main>

      {/* Character Detail Overlay */}
      <AnimatePresence>
        {selectedId && selectedCharacter && (
          <CharacterDetail
            character={selectedCharacter}
            onClose={() => setSelectedId(null)}
            isAdmin={isAdmin}
          />
        )}
      </AnimatePresence>

      {/* Admin Panel Overlay */}
      <AnimatePresence>
        {showAdmin && (
          <AdminPanel onClose={() => setShowAdmin(false)} />
        )}
      </AnimatePresence>

      {/* Background Decoration */}
      <div className="fixed inset-0 pointer-events-none z-[-1] opacity-20">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-white/5 blur-[120px] rounded-full" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-white/5 blur-[120px] rounded-full" />
      </div>
    </div>
  );
}

function CharacterDetail({ character, onClose, isAdmin }: { character: Character; onClose: () => void; isAdmin: boolean | null }) {
  const [activeTab, setActiveTab] = useState<"settings" | "wardrobe" | "portfolio">("settings");
  const [activeWardrobeIdx, setActiveWardrobeIdx] = useState(0);

  const handleDelete = async () => {
    if (!window.confirm("確定要刪除這個寶寶嗎？")) return;
    try {
      await deleteDoc(doc(db, "characters", character.id));
      onClose();
    } catch (error) {
      console.error("Delete failed:", error);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-bg overflow-y-auto"
    >
      <div className="fixed top-8 right-8 z-[60] flex gap-4">
        {isAdmin && (
          <button onClick={handleDelete} className="p-4 hover:bg-red-500/20 text-red-500 rounded-full transition-colors">
            <Trash2 className="w-6 h-6" />
          </button>
        )}
        <button
          onClick={onClose}
          className="p-4 hover:bg-white/10 rounded-full transition-colors group"
        >
          <X className="w-6 h-6 group-hover:rotate-90 transition-transform duration-300" />
        </button>
      </div>

      <div className="max-w-7xl mx-auto min-h-screen flex flex-col lg:flex-row">
        <div className="lg:w-1/2 lg:h-screen lg:sticky lg:top-0 p-8 lg:p-16 flex flex-col justify-center">
          <motion.div
            initial={{ y: 40, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="relative aspect-[2/3] w-full max-w-md mx-auto shadow-2xl shadow-white/5"
          >
            <img
              src={character.posterUrl}
              alt={character.name}
              className="w-full h-full object-cover rounded-sm"
              referrerPolicy="no-referrer"
            />
            <div className="absolute -bottom-12 -left-12 hidden xl:block">
              <h2 className="serif text-8xl font-bold opacity-10 select-none whitespace-nowrap">
                {character.japaneseName}
              </h2>
            </div>
          </motion.div>
        </div>

        <div className="lg:w-1/2 p-8 lg:p-16 lg:pt-32">
          <motion.div
            initial={{ x: 40, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 0.3 }}
          >
            <h2 className="serif text-5xl lg:text-7xl mb-4">{character.name}</h2>
            <div className="h-px w-20 bg-white/30 mb-12" />

            <div className="flex gap-8 mb-16 border-b border-white/10">
              {[
                { id: "settings", label: "設定", icon: Info },
                { id: "wardrobe", label: "衣櫃", icon: Shirt },
                { id: "portfolio", label: "作品集", icon: ImageIcon },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`pb-4 flex items-center gap-2 text-xs tracking-widest uppercase transition-all relative ${
                    activeTab === tab.id ? "text-white" : "text-white/40 hover:text-white/60"
                  }`}
                >
                  <tab.icon className="w-4 h-4" />
                  {tab.label}
                  {activeTab === tab.id && (
                    <motion.div
                      layoutId="activeTab"
                      className="absolute bottom-0 left-0 right-0 h-px bg-white"
                    />
                  )}
                </button>
              ))}
            </div>

            <div className="min-h-[400px]">
              <AnimatePresence mode="wait">
                {activeTab === "settings" && (
                  <motion.div
                    key="settings"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="space-y-12"
                  >
                    <p className="text-lg leading-relaxed text-white/80 font-light italic">
                      {character.description}
                    </p>
                    <div className="grid grid-cols-2 gap-8">
                      <div>
                        <h4 className="text-[10px] uppercase tracking-[0.2em] text-white/40 mb-2">Age</h4>
                        <p className="serif text-xl">{character.settings.age}</p>
                      </div>
                      <div>
                        <h4 className="text-[10px] uppercase tracking-[0.2em] text-white/40 mb-2">Height</h4>
                        <p className="serif text-xl">{character.settings.height}</p>
                      </div>
                      <div className="col-span-2">
                        <h4 className="text-[10px] uppercase tracking-[0.2em] text-white/40 mb-2">Personality</h4>
                        <p className="serif text-xl">{character.settings.personality}</p>
                      </div>
                      <div className="col-span-2">
                        <h4 className="text-[10px] uppercase tracking-[0.2em] text-white/40 mb-2">Likes</h4>
                        <div className="flex flex-wrap gap-2">
                          {character.settings.likes.map((like) => (
                            <span key={like} className="px-3 py-1 bg-white/5 border border-white/10 rounded-full text-xs">
                              {like}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}

                {activeTab === "wardrobe" && (
                  <motion.div
                    key="wardrobe"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="space-y-8"
                  >
                    <div className="flex gap-4 overflow-x-auto pb-4 no-scrollbar">
                      {character.wardrobe.map((item, idx) => (
                        <button
                          key={item.id}
                          onClick={() => setActiveWardrobeIdx(idx)}
                          className={`flex-shrink-0 px-6 py-2 rounded-sm text-xs tracking-widest uppercase transition-all ${
                            activeWardrobeIdx === idx
                              ? "bg-white text-black"
                              : "bg-white/5 text-white/40 hover:bg-white/10"
                          }`}
                        >
                          {item.name}
                        </button>
                      ))}
                    </div>
                    <div className="relative aspect-[3/4] bg-zinc-900 overflow-hidden rounded-sm">
                      <AnimatePresence mode="wait">
                        <motion.img
                          key={character.wardrobe[activeWardrobeIdx]?.id}
                          src={character.wardrobe[activeWardrobeIdx]?.imageUrl}
                          alt={character.wardrobe[activeWardrobeIdx]?.name}
                          initial={{ opacity: 0, scale: 1.05 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.95 }}
                          transition={{ duration: 0.5 }}
                          className="w-full h-full object-cover"
                          loading="lazy"
                          referrerPolicy="no-referrer"
                        />
                      </AnimatePresence>
                    </div>
                  </motion.div>
                )}

                {activeTab === "portfolio" && (
                  <motion.div
                    key="portfolio"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="columns-1 sm:columns-2 gap-4 space-y-4"
                  >
                    {character.portfolio.map((item) => (
                      <div key={item.id} className="break-inside-avoid group relative overflow-hidden rounded-sm bg-zinc-900">
                        <img
                          src={item.imageUrl}
                          alt={item.title}
                          loading="lazy"
                          referrerPolicy="no-referrer"
                          className="w-full h-auto transition-transform duration-700 group-hover:scale-105"
                        />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-4">
                          <p className="text-[10px] tracking-widest uppercase">{item.title}</p>
                        </div>
                      </div>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        </div>
      </div>
    </motion.div>
  );
}

function AdminPanel({ onClose }: { onClose: () => void }) {
  const [name, setName] = useState("");
  const [japaneseName, setJapaneseName] = useState("");
  const [description, setDescription] = useState("");
  const [age, setAge] = useState("");
  const [height, setHeight] = useState("");
  const [personality, setPersonality] = useState("");
  const [likes, setLikes] = useState("");
  
  const [posterFile, setPosterFile] = useState<File | null>(null);
  const [wardrobeFiles, setWardrobeFiles] = useState<{ name: string; file: File }[]>([]);
  const [portfolioFiles, setPortfolioFiles] = useState<File[]>([]);
  
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState("");

  const uploadFile = async (file: File, path: string) => {
    const storageRef = ref(storage, path);
    await uploadBytes(storageRef, file);
    return await getDownloadURL(storageRef);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!posterFile) return alert("請上傳角色大海報");
    
    setUploading(true);
    try {
      // 1. Upload Poster
      setProgress("正在上傳大海報...");
      const posterUrl = await uploadFile(posterFile, `posters/${Date.now()}_${posterFile.name}`);

      // 2. Upload Wardrobe
      setProgress("正在上傳衣櫃圖片...");
      const wardrobe: WardrobeItem[] = [];
      for (const item of wardrobeFiles) {
        const url = await uploadFile(item.file, `wardrobe/${Date.now()}_${item.file.name}`);
        wardrobe.push({ id: Math.random().toString(36).substr(2, 9), name: item.name, imageUrl: url });
      }

      // 3. Upload Portfolio
      setProgress("正在上傳作品集...");
      const portfolio: PortfolioItem[] = [];
      for (const file of portfolioFiles) {
        const url = await uploadFile(file, `portfolio/${Date.now()}_${file.name}`);
        portfolio.push({ id: Math.random().toString(36).substr(2, 9), imageUrl: url, title: file.name.split(".")[0] });
      }

      // 4. Save to Firestore
      setProgress("正在儲存資料...");
      await addDoc(collection(db, "characters"), {
        name,
        japaneseName,
        posterUrl,
        description,
        settings: {
          age,
          height,
          personality,
          likes: likes.split(",").map(l => l.trim()).filter(l => l),
        },
        wardrobe,
        portfolio,
        createdAt: serverTimestamp(),
      });

      onClose();
    } catch (error) {
      console.error("Upload failed:", error);
      alert("上傳失敗，請檢查網路或權限");
    } finally {
      setUploading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-md overflow-y-auto p-8"
    >
      <div className="max-w-2xl mx-auto bg-zinc-900 p-8 rounded-lg border border-white/10">
        <div className="flex justify-between items-center mb-8">
          <h2 className="serif text-3xl">新增寶寶</h2>
          <button onClick={onClose}><X /></button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <input required placeholder="角色名稱" value={name} onChange={e => setName(e.target.value)} className="bg-white/5 border border-white/10 p-3 rounded-sm text-sm" />
            <input placeholder="日文/代號 (如: 零)" value={japaneseName} onChange={e => setJapaneseName(e.target.value)} className="bg-white/5 border border-white/10 p-3 rounded-sm text-sm" />
          </div>
          
          <textarea placeholder="角色描述 (選填)" value={description} onChange={e => setDescription(e.target.value)} className="w-full bg-white/5 border border-white/10 p-3 rounded-sm text-sm h-24" />
          
          <div className="grid grid-cols-2 gap-4">
            <input placeholder="年齡" value={age} onChange={e => setAge(e.target.value)} className="bg-white/5 border border-white/10 p-3 rounded-sm text-sm" />
            <input placeholder="身高" value={height} onChange={e => setHeight(e.target.value)} className="bg-white/5 border border-white/10 p-3 rounded-sm text-sm" />
          </div>

          <input placeholder="性格" value={personality} onChange={e => setPersonality(e.target.value)} className="w-full bg-white/5 border border-white/10 p-3 rounded-sm text-sm" />
          <input placeholder="喜好 (以逗號分隔)" value={likes} onChange={e => setLikes(e.target.value)} className="w-full bg-white/5 border border-white/10 p-3 rounded-sm text-sm" />

          <div className="space-y-4">
            <label className="block text-xs uppercase tracking-widest text-white/40">角色大海報 (2:3)</label>
            <input type="file" required accept="image/*" onChange={e => setPosterFile(e.target.files?.[0] || null)} className="text-xs" />
          </div>

          <div className="space-y-4">
            <label className="block text-xs uppercase tracking-widest text-white/40">衣櫃服裝 (多選)</label>
            <input type="file" multiple accept="image/*" onChange={e => {
              const files = Array.from(e.target.files || []);
              setWardrobeFiles(files.map(f => ({ name: f.name.split(".")[0], file: f })));
            }} className="text-xs" />
            {wardrobeFiles.map((item, i) => (
              <div key={i} className="flex gap-2 items-center">
                <span className="text-[10px] opacity-40">{item.file.name}</span>
                <input 
                  placeholder="服裝名稱" 
                  className="bg-white/5 border border-white/10 p-1 rounded-sm text-[10px]"
                  onChange={e => {
                    const newFiles = [...wardrobeFiles];
                    newFiles[i].name = e.target.value;
                    setWardrobeFiles(newFiles);
                  }}
                />
              </div>
            ))}
          </div>

          <div className="space-y-4">
            <label className="block text-xs uppercase tracking-widest text-white/40">作品集 (多選)</label>
            <input type="file" multiple accept="image/*" onChange={e => setPortfolioFiles(Array.from(e.target.files || []))} className="text-xs" />
          </div>

          <button 
            type="submit" 
            disabled={uploading}
            className="w-full bg-white text-black py-4 rounded-sm font-bold uppercase tracking-[0.2em] hover:bg-white/90 disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {uploading ? <><div className="animate-spin rounded-full h-4 w-4 border-2 border-black border-t-transparent" /> {progress}</> : <><Upload className="w-4 h-4" /> 開始上傳</>}
          </button>
        </form>
      </div>
    </motion.div>
  );
}
