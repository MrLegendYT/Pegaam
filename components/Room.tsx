import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { db, auth } from '../firebase';
import firebase from 'firebase/compat/app';
import { uploadImageToImgBB } from '../services/imgbb';
import { Room as RoomType, Message } from '../types';
import { 
  Send, Image as ImageIcon, Settings, Share2, 
  ChevronLeft, Trash2, X, Copy, Check, Loader2,
  ExternalLink
} from 'lucide-react';

const Room: React.FC = () => {
  const { roomId } = useParams();
  const navigate = useNavigate();
  const [room, setRoom] = useState<RoomType | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showShare, setShowShare] = useState(false);
  const [copied, setCopied] = useState(false);
  
  // New state for attachment
  const [attachedFile, setAttachedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  
  // State for full screen image viewing
  const [viewingImage, setViewingImage] = useState<string | null>(null);

  const scrollRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!roomId) return;

    // Listen to Room Details
    const unsubRoom = db.collection("rooms").doc(roomId).onSnapshot((docSnap) => {
      if (docSnap.exists) {
        const data = docSnap.data();
        if (data) {
            setRoom({ 
                id: docSnap.id, 
                name: data.name, 
                ownerId: data.ownerId, 
                createdAt: data.createdAt,
                joiners: data.joiners,
                joinerCount: data.joiners?.length || 0
            });
        }
      } else {
        // Room deleted
        navigate('/');
      }
      setLoading(false);
    });

    // Listen to Messages
    const unsubMsg = db.collection("rooms").doc(roomId).collection("messages")
      .orderBy("timestamp", "asc")
      .onSnapshot((snapshot) => {
        const msgs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Message));
        setMessages(msgs);
      });

    return () => {
      unsubRoom();
      unsubMsg();
    };
  }, [roomId, navigate]);

  useEffect(() => {
    // Scroll to bottom when messages change
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setAttachedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const clearAttachment = () => {
    setAttachedFile(null);
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSendMessage = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if ((!newMessage.trim() && !attachedFile) || !auth.currentUser || !roomId) return;

    setSending(true);
    try {
      let uploadedUrl = undefined;
      
      if (attachedFile) {
        uploadedUrl = await uploadImageToImgBB(attachedFile);
      }

      await db.collection("rooms").doc(roomId).collection("messages").add({
        text: newMessage,
        imageUrl: uploadedUrl || null,
        senderId: auth.currentUser.uid,
        senderName: auth.currentUser.displayName,
        senderPhoto: auth.currentUser.photoURL,
        timestamp: firebase.firestore.FieldValue.serverTimestamp(),
        type: uploadedUrl ? 'image' : 'text'
      });
      
      setNewMessage('');
      clearAttachment();
    } catch (error) {
      console.error("Error sending message", error);
      alert("Failed to send message.");
    } finally {
      setSending(false);
    }
  };

  const handleDeleteRoom = async () => {
    if (!roomId || !room) return;
    if (window.confirm("Are you sure you want to delete this room? This cannot be undone.")) {
       try {
         await db.collection("rooms").doc(roomId).delete();
         navigate('/');
       } catch (err) {
         console.error(err);
         alert("Error deleting room");
       }
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(roomId || '');
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (loading) return <div className="h-[100dvh] flex items-center justify-center bg-dark-900 text-white"><Loader2 className="animate-spin w-8 h-8 text-accent"/></div>;

  const isOwner = auth.currentUser?.uid === room?.ownerId;

  return (
    <div className="flex flex-col h-[100dvh] bg-dark-900 text-white overflow-hidden relative">
      {/* Top Bar */}
      <header className="bg-dark-800 p-3 md:p-4 shadow-md flex items-center justify-between z-10 border-b border-dark-700 shrink-0 safe-area-top">
        <button onClick={() => navigate('/')} className="p-2 -ml-2 text-gray-400 hover:text-white rounded-full hover:bg-dark-700 active:scale-95 transition-transform">
          <ChevronLeft className="w-6 h-6" />
        </button>
        
        <div className="flex flex-col items-center">
            <h1 className="font-bold text-lg leading-tight">{room?.name}</h1>
            <span className="text-xs text-green-400 flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                {room?.joinerCount} online
            </span>
        </div>

        <div className="flex items-center gap-1">
            <button 
                onClick={() => setShowShare(true)} 
                className="p-2 text-gray-400 hover:text-accent rounded-full hover:bg-dark-700 active:scale-95 transition-transform"
            >
                <Share2 className="w-5 h-5" />
            </button>
            {isOwner && (
                <button 
                    onClick={() => setShowSettings(true)} 
                    className="p-2 text-gray-400 hover:text-white rounded-full hover:bg-dark-700 active:scale-95 transition-transform"
                >
                    <Settings className="w-5 h-5" />
                </button>
            )}
        </div>
      </header>

      {/* Chat Area */}
      <div 
        className="flex-1 overflow-y-auto p-4 space-y-4 overscroll-contain"
        ref={scrollRef}
      >
        {messages.map((msg) => {
            const isMe = msg.senderId === auth.currentUser?.uid;
            return (
                <div key={msg.id} className={`flex w-full ${isMe ? 'justify-end' : 'justify-start'} animate-fade-in-up`}>
                    <div className={`flex max-w-[85%] md:max-w-[70%] ${isMe ? 'flex-row-reverse' : 'flex-row'} gap-2`}>
                        {/* Avatar */}
                        <img 
                            src={msg.senderPhoto || `https://ui-avatars.com/api/?name=${msg.senderName}`} 
                            alt={msg.senderName} 
                            className="w-8 h-8 rounded-full border border-dark-700 self-end mb-1 object-cover"
                        />
                        
                        <div className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                            <span className="text-[10px] text-gray-500 mb-1 px-1">{msg.senderName}</span>
                            <div className={`
                                p-3 rounded-2xl shadow-sm
                                ${isMe 
                                    ? 'bg-accent text-white rounded-br-none' 
                                    : 'bg-dark-700 text-gray-200 rounded-bl-none'
                                }
                            `}>
                                {msg.imageUrl && (
                                    <div 
                                        className="mb-2 rounded-lg overflow-hidden cursor-zoom-in active:opacity-90 active:scale-[0.99] transition-all bg-black/20"
                                        onClick={() => setViewingImage(msg.imageUrl || null)}
                                    >
                                        <img src={msg.imageUrl} alt="Shared" className="max-w-full h-auto max-h-64 object-cover" />
                                    </div>
                                )}
                                {msg.text && <p className="whitespace-pre-wrap break-words leading-relaxed text-[15px]">{msg.text}</p>}
                            </div>
                        </div>
                    </div>
                </div>
            );
        })}
      </div>

      {/* Input Area */}
      <div className="p-3 md:p-4 bg-dark-800 border-t border-dark-700 shrink-0 safe-area-bottom z-20">
        <div className="max-w-4xl mx-auto">
            {previewUrl && (
                <div className="mb-3 flex items-start gap-2 animate-fade-in-up">
                    <div className="relative group">
                        <img src={previewUrl} alt="Preview" className="h-20 w-auto rounded-lg border border-dark-600 shadow-lg object-contain bg-dark-900" />
                        <button 
                            onClick={clearAttachment} 
                            className="absolute -top-2 -right-2 bg-dark-700 text-white rounded-full p-1 border border-dark-600 shadow-sm hover:bg-red-500 transition-colors"
                        >
                            <X className="w-3 h-3" />
                        </button>
                    </div>
                </div>
            )}
            
            <form onSubmit={handleSendMessage} className="flex items-end gap-2 md:gap-3">
                <button 
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className={`p-3 rounded-full bg-dark-700 text-gray-400 hover:text-white hover:bg-dark-600 active:scale-95 transition-all ${sending ? 'opacity-50 cursor-not-allowed' : ''}`}
                    disabled={sending}
                >
                    {sending ? <Loader2 className="w-6 h-6 animate-spin"/> : <ImageIcon className="w-6 h-6" />}
                </button>
                <input 
                    type="file" 
                    ref={fileInputRef} 
                    className="hidden" 
                    accept="image/*"
                    onChange={handleFileSelect}
                />

                <div className="flex-1 bg-dark-900 border border-dark-700 rounded-2xl px-4 py-2 focus-within:border-accent focus-within:ring-1 focus-within:ring-accent transition-all">
                    <input
                        type="text"
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        placeholder={attachedFile ? "Add a caption..." : "Type a message..."}
                        className="w-full bg-transparent border-none text-white focus:ring-0 placeholder-gray-500 py-1 text-base"
                    />
                </div>
                
                <button 
                    type="submit"
                    disabled={(!newMessage.trim() && !attachedFile) || sending}
                    className="p-3 bg-accent text-white rounded-full shadow-lg shadow-accent/20 hover:bg-accent-hover active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                >
                    <Send className="w-5 h-5" />
                </button>
            </form>
        </div>
      </div>

      {/* Share Modal */}
      {showShare && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in">
            <div className="bg-dark-800 w-full max-w-sm rounded-2xl p-6 border border-dark-700 shadow-2xl relative">
                <button onClick={() => setShowShare(false)} className="absolute top-4 right-4 text-gray-400 hover:text-white p-2">
                    <X className="w-5 h-5" />
                </button>
                <h3 className="text-xl font-bold mb-4">Invite People</h3>
                <p className="text-sm text-gray-400 mb-4">Share this code with your friends to let them join.</p>
                
                <div className="flex items-center gap-2 bg-dark-900 p-2 rounded-lg border border-dark-700">
                    <code className="flex-1 text-center font-mono text-accent font-bold tracking-wider text-lg">{roomId}</code>
                    <button 
                        onClick={copyToClipboard}
                        className="p-3 bg-dark-700 hover:bg-dark-600 rounded-md transition-colors active:scale-95"
                    >
                        {copied ? <Check className="w-5 h-5 text-green-500" /> : <Copy className="w-5 h-5 text-white" />}
                    </button>
                </div>
            </div>
        </div>
      )}

      {/* Settings Modal (Owner Only) */}
      {showSettings && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in">
            <div className="bg-dark-800 w-full max-w-sm rounded-2xl p-6 border border-dark-700 shadow-2xl relative">
                <button onClick={() => setShowSettings(false)} className="absolute top-4 right-4 text-gray-400 hover:text-white p-2">
                    <X className="w-5 h-5" />
                </button>
                <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
                    <Settings className="w-5 h-5" /> Room Settings
                </h3>
                
                <div className="space-y-4">
                    <div className="p-4 bg-dark-900 rounded-lg">
                        <span className="text-sm text-gray-400 block mb-1">Room ID</span>
                        <span className="font-mono text-sm">{roomId}</span>
                    </div>

                    <div className="border-t border-dark-700 pt-4">
                        <button 
                            onClick={handleDeleteRoom}
                            className="w-full bg-red-500/10 hover:bg-red-500/20 text-red-500 border border-red-500/50 py-3 rounded-lg flex items-center justify-center gap-2 transition-all font-medium active:scale-95"
                        >
                            <Trash2 className="w-4 h-4" /> Delete Room
                        </button>
                        <p className="text-xs text-gray-500 text-center mt-2">
                            This will permanently remove the room and all messages.
                        </p>
                    </div>
                </div>
            </div>
        </div>
      )}

      {/* Full Screen Image Modal */}
      {viewingImage && (
        <div 
            className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-md flex items-center justify-center p-2 animate-fade-in"
            onClick={() => setViewingImage(null)}
        >
            {/* Toolbar */}
            <div className="absolute top-0 left-0 right-0 p-4 flex justify-between items-start safe-area-top z-10 bg-gradient-to-b from-black/50 to-transparent">
               <button 
                  onClick={(e) => {
                      e.stopPropagation();
                      window.open(viewingImage, '_blank');
                  }}
                  className="p-3 bg-dark-800/50 rounded-full text-white hover:bg-dark-700 transition-colors backdrop-blur-sm"
                  title="Open original"
              >
                  <ExternalLink className="w-6 h-6" />
              </button>

              <button 
                  onClick={(e) => {
                      e.stopPropagation();
                      setViewingImage(null);
                  }}
                  className="p-3 bg-dark-800/50 rounded-full text-white hover:bg-dark-700 transition-colors backdrop-blur-sm"
              >
                  <X className="w-6 h-6" />
              </button>
            </div>
            
            <img 
                src={viewingImage} 
                alt="Full screen" 
                className="max-w-full max-h-[90dvh] object-contain shadow-2xl"
                onClick={(e) => e.stopPropagation()} 
            />
        </div>
      )}
    </div>
  );
};

export default Room;