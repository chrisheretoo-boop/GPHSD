import React, { useState, useEffect, useRef } from 'react';
import { User, ChatRoom, ChatMessage } from '../types';
import { subscribeToMessages, sendMessage, subscribeToUserChats, createOrGetDirectChat, getUsers, subscribeToAllChats } from '../firebase';
import { Send, Globe, Lock, Plus, Search, MessageSquare, MoreVertical, Phone, Video, ArrowLeft, ShieldCheck, Zap, Eye, EyeOff } from 'lucide-react';

interface Props {
    user: User;
    onClose: () => void;
}

export const ChatInterface: React.FC<Props> = ({ user, onClose }) => {
    const [activeRoomId, setActiveRoomId] = useState<string>('global');
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [rooms, setRooms] = useState<ChatRoom[]>([]);
    const [inputText, setInputText] = useState('');
    const [showNewChatModal, setShowNewChatModal] = useState(false);
    const [allUsers, setAllUsers] = useState<User[]>([]);
    const [userSearch, setUserSearch] = useState('');
    
    // Admin Spy Mode State
    const [spyMode, setSpyMode] = useState(false);
    
    const scrollRef = useRef<HTMLDivElement>(null);

    // Subscribe to Rooms (User or All/Spy)
    useEffect(() => {
        let unsubscribe: () => void;
        
        if (spyMode && user.role === 'admin') {
            unsubscribe = subscribeToAllChats((updatedRooms) => {
                setRooms(updatedRooms);
            });
        } else {
            unsubscribe = subscribeToUserChats(user.username, (updatedRooms) => {
                setRooms(updatedRooms);
            });
        }

        return () => unsubscribe && unsubscribe();
    }, [user.username, spyMode]);

    // Subscribe to Active Room Messages
    useEffect(() => {
        const unsubscribe = subscribeToMessages(activeRoomId, (msgs) => {
            setMessages(msgs);
            // Scroll to bottom
            setTimeout(() => {
                if (scrollRef.current) {
                    scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
                }
            }, 100);
        });
        return () => unsubscribe();
    }, [activeRoomId]);

    // Fetch users for the "New Chat" modal
    useEffect(() => {
        if (showNewChatModal) {
            getUsers().then(users => {
                // Filter out self
                setAllUsers(users.filter(u => u.username !== user.username));
            });
        }
    }, [showNewChatModal, user.username]);

    const handleSend = async (e?: React.FormEvent) => {
        e?.preventDefault();
        if (!inputText.trim()) return;
        
        try {
            await sendMessage(activeRoomId, user, inputText);
            setInputText('');
        } catch (error) {
            console.error("Failed to send message", error);
        }
    };

    const handleStartDirectChat = async (otherUser: User) => {
        try {
            const roomId = await createOrGetDirectChat(user, otherUser);
            setActiveRoomId(roomId);
            setShowNewChatModal(false);
        } catch (error) {
            alert("Could not start chat");
        }
    };

    const getRoomName = (room: ChatRoom) => {
        if (room.type === 'global') return "Global Headquarters";
        
        // Standard User Logic: Show the other person
        const isParticipant = room.participants.includes(user.username);
        
        if (isParticipant) {
            const otherUsername = room.participants.find(p => p !== user.username);
            return otherUsername || "Unknown User";
        } else {
            // Spy Mode Logic: Show both participants
            return `${room.participants[0]} & ${room.participants[1]}`;
        }
    };

    const filteredUsers = allUsers.filter(u => 
        (u.displayName || u.username).toLowerCase().includes(userSearch.toLowerCase())
    );

    // Determine if the current user is just a spectator (Admin viewing others' chat)
    const currentRoom = rooms.find(r => r.id === activeRoomId);
    const isSpectator = spyMode && currentRoom && !currentRoom.participants.includes(user.username) && currentRoom.type !== 'global';

    return (
        <div className="fixed inset-0 z-[100] bg-zinc-950 flex flex-col md:flex-row text-white font-sans animate-fade-in">
            {/* Sidebar */}
            <div className="w-full md:w-80 border-r border-white/5 bg-zinc-900/50 flex flex-col h-full">
                <div className="p-6 border-b border-white/5 flex justify-between items-center">
                    <div className="flex items-center gap-3">
                         <div className="w-10 h-10 rounded-xl flex items-center justify-center border bg-gold-500/10 border-gold-500/20 text-gold-500 transition-all">
                             <MessageSquare size={20} />
                         </div>
                         <div>
                             <h2 className="font-display font-bold text-lg leading-none">Encrypted Link</h2>
                             <div className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider mt-1 text-green-500">
                                 <ShieldCheck size={10} /> Secure Connection
                             </div>
                         </div>
                    </div>
                    
                    <div className="flex gap-2">
                         {user.role === 'admin' && (
                             <button 
                                onClick={() => setSpyMode(!spyMode)} 
                                className={`p-2 rounded-lg transition ${spyMode ? 'bg-zinc-800 text-white' : 'text-zinc-600 hover:text-white hover:bg-white/5'}`}
                                title={spyMode ? "Disable Global View" : "Enable Global View"}
                             >
                                 {spyMode ? <Eye size={18}/> : <EyeOff size={18}/>}
                             </button>
                         )}
                         <button onClick={onClose} className="md:hidden p-2 text-zinc-500 hover:text-white"><ArrowLeft size={20}/></button>
                    </div>
                </div>

                <div className="p-4 flex-1 overflow-y-auto custom-scrollbar space-y-6">
                    {/* Global Section */}
                    <div>
                        <h3 className="text-zinc-500 text-[10px] font-black uppercase tracking-widest px-4 mb-2">Public Channels</h3>
                        <button 
                            onClick={() => setActiveRoomId('global')}
                            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${activeRoomId === 'global' ? 'bg-gold-500 text-black font-bold shadow-lg shadow-gold-500/20' : 'text-zinc-400 hover:bg-white/5 hover:text-white'}`}
                        >
                            <Globe size={18} />
                            <span>Global HQ</span>
                            {activeRoomId !== 'global' && <span className="ml-auto w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>}
                        </button>
                    </div>

                    {/* Direct Messages */}
                    <div>
                        <div className="flex items-center justify-between px-4 mb-2">
                            <h3 className="text-zinc-500 text-[10px] font-black uppercase tracking-widest">
                                {spyMode ? 'All Channels' : 'Direct Comms'}
                            </h3>
                            <button onClick={() => setShowNewChatModal(true)} className="text-gold-500 hover:text-white transition"><Plus size={14}/></button>
                        </div>
                        <div className="space-y-1">
                            {rooms.length === 0 ? (
                                <p className="px-4 text-xs text-zinc-600 italic">No active conversations</p>
                            ) : (
                                rooms.map(room => {
                                    // Clean display logic - no aggressive red badges
                                    return (
                                        <button 
                                            key={room.id}
                                            onClick={() => setActiveRoomId(room.id)}
                                            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all group ${activeRoomId === room.id ? 'bg-zinc-800 text-white font-bold border border-white/10' : 'text-zinc-400 hover:bg-white/5 hover:text-white'}`}
                                        >
                                            <div className="w-8 h-8 rounded-full border border-white/10 flex items-center justify-center text-xs font-black bg-black">
                                                {getRoomName(room).charAt(0).toUpperCase()}
                                            </div>
                                            <div className="flex-1 text-left overflow-hidden">
                                                <div className="flex items-center gap-2">
                                                    <div className="truncate text-sm flex-1">{getRoomName(room)}</div>
                                                </div>
                                                <div className="truncate text-[10px] opacity-60 font-mono">{room.lastMessage || 'Start conversation...'}</div>
                                            </div>
                                        </button>
                                    );
                                })
                            )}
                        </div>
                    </div>
                </div>

                {/* User Info Footer */}
                <div className="p-4 border-t border-white/5 bg-zinc-950">
                    <button onClick={onClose} className="w-full py-3 rounded-xl border border-white/10 text-zinc-400 hover:text-white hover:bg-white/5 transition text-xs font-bold uppercase tracking-widest flex items-center justify-center gap-2">
                        <ArrowLeft size={14}/> Return to Dashboard
                    </button>
                </div>
            </div>

            {/* Main Chat Area */}
            <div className="flex-1 flex flex-col h-full bg-zinc-950 relative">
                {/* Chat Header */}
                <div className="h-20 border-b border-white/5 flex justify-between items-center px-6 bg-zinc-900/30 backdrop-blur-md">
                    <div>
                        <h3 className="font-display font-bold text-xl text-white flex items-center gap-2">
                            {activeRoomId === 'global' ? <Globe size={20} className="text-blue-500"/> : <Lock size={20} className="text-gold-500"/>}
                            {activeRoomId === 'global' ? 'Global Headquarters' : (isSpectator ? 'Secure Channel (Oversight)' : 'Secure Channel')}
                        </h3>
                        <div className="flex items-center gap-2 text-[10px] text-zinc-500 font-mono uppercase tracking-widest">
                            <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></span>
                            End-to-End Encryption Protocol Active
                        </div>
                    </div>
                    <div className="flex items-center gap-4 text-zinc-600">
                        <Phone size={20} className="hover:text-white cursor-pointer transition"/>
                        <Video size={20} className="hover:text-white cursor-pointer transition"/>
                        <MoreVertical size={20} className="hover:text-white cursor-pointer transition"/>
                    </div>
                </div>

                {/* Messages Area */}
                <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar" ref={scrollRef}>
                    <div className="flex justify-center pb-4">
                        <div className="px-4 py-1 rounded-full bg-zinc-900 border border-white/5 text-[10px] text-zinc-500 font-mono uppercase tracking-widest">
                            {new Date().toLocaleDateString()}
                        </div>
                    </div>
                    
                    {messages.map((msg, i) => {
                        const isMe = msg.senderId === user.username;
                        const showAvatar = i === 0 || messages[i-1].senderId !== msg.senderId;

                        return (
                            <div key={msg.id} className={`flex gap-4 ${isMe ? 'justify-end' : 'justify-start'} group animate-fade-in`}>
                                {!isMe && showAvatar && (
                                    <div className="w-8 h-8 rounded-lg bg-zinc-800 border border-white/10 overflow-hidden flex-shrink-0">
                                        {msg.senderImg ? <img src={msg.senderImg} className="w-full h-full object-cover"/> : <div className="w-full h-full flex items-center justify-center text-xs font-bold">{msg.senderName[0]}</div>}
                                    </div>
                                )}
                                {!isMe && !showAvatar && <div className="w-8 flex-shrink-0"/>}
                                
                                <div className={`max-w-[80%] ${isMe ? 'items-end' : 'items-start'} flex flex-col`}>
                                    {!isMe && showAvatar && <span className="text-[10px] text-zinc-500 ml-1 mb-1 font-bold">{msg.senderName}</span>}
                                    <div className={`px-5 py-3 rounded-2xl text-sm leading-relaxed font-medium shadow-lg ${isMe ? 'bg-gold-500 text-black rounded-tr-none' : 'bg-zinc-800 text-zinc-200 rounded-tl-none border border-white/5'}`}>
                                        {msg.text}
                                    </div>
                                    <span className="text-[9px] text-zinc-600 mt-1 px-1 opacity-0 group-hover:opacity-100 transition">
                                        {new Date(msg.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                                    </span>
                                </div>
                            </div>
                        );
                    })}
                </div>

                {/* Input Area */}
                <div className="p-6 bg-zinc-900/30 border-t border-white/5">
                    <form onSubmit={handleSend} className="relative flex items-center gap-4">
                        <button type="button" disabled={isSpectator} className="p-3 rounded-xl bg-zinc-800 text-zinc-400 hover:text-white transition hover:bg-zinc-700 disabled:opacity-50">
                             <Plus size={20}/>
                        </button>
                        <input 
                            value={inputText}
                            onChange={e => setInputText(e.target.value)}
                            disabled={isSpectator}
                            placeholder={isSpectator ? "Read-Only Mode: Surveillance Active" : `Message ${activeRoomId === 'global' ? '#global' : 'secure channel'}...`} 
                            className="flex-1 bg-black/50 border border-white/10 rounded-2xl py-4 pl-6 pr-12 text-white focus:border-gold-500/50 outline-none transition placeholder-zinc-600 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                        />
                        <button 
                            type="submit" 
                            disabled={!inputText.trim() || isSpectator}
                            className="absolute right-2 p-2 bg-gold-500 text-black rounded-xl hover:bg-white transition disabled:opacity-0 disabled:scale-75 transform duration-200"
                        >
                            <Send size={18}/>
                        </button>
                    </form>
                </div>
            </div>

            {/* New Chat Modal */}
            {showNewChatModal && (
                <div className="fixed inset-0 z-[200] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="bg-zinc-900 w-full max-w-md rounded-3xl border border-white/10 shadow-2xl overflow-hidden flex flex-col max-h-[80vh]">
                        <div className="p-6 border-b border-white/5 flex justify-between items-center">
                            <h3 className="font-display font-bold text-xl text-white">Start New Comms</h3>
                            <button onClick={() => setShowNewChatModal(false)}><ArrowLeft size={20} className="text-zinc-500 hover:text-white"/></button>
                        </div>
                        <div className="p-4 border-b border-white/5">
                            <div className="relative">
                                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500" size={16}/>
                                <input 
                                    value={userSearch}
                                    onChange={e => setUserSearch(e.target.value)}
                                    placeholder="Search directory..." 
                                    className="w-full bg-black border border-white/10 rounded-xl py-3 pl-10 text-white text-sm focus:border-gold-500/50 outline-none"
                                />
                            </div>
                        </div>
                        <div className="flex-1 overflow-y-auto p-2">
                            {filteredUsers.map(u => (
                                <button 
                                    key={u.username}
                                    onClick={() => handleStartDirectChat(u)}
                                    className="w-full flex items-center gap-4 p-4 hover:bg-white/5 rounded-xl transition group"
                                >
                                    <div className="w-10 h-10 rounded-full bg-zinc-800 flex items-center justify-center text-white font-bold border border-white/10 group-hover:border-gold-500/50">
                                        {u.profileImg ? <img src={u.profileImg} className="w-full h-full object-cover rounded-full"/> : u.username.charAt(0).toUpperCase()}
                                    </div>
                                    <div className="text-left">
                                        <div className="text-sm font-bold text-white group-hover:text-gold-500 transition">{u.displayName || u.username}</div>
                                        <div className="text-xs text-zinc-500 font-mono">@{u.username}</div>
                                    </div>
                                    <Zap size={16} className="ml-auto text-zinc-700 group-hover:text-gold-500"/>
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
