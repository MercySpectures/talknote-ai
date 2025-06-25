import React, { useState, useEffect, useRef } from 'react';
import { Sun, Moon, Mic, Square, Save, Play, Star, Edit, Trash2, LoaderCircle, Download, Upload, Folder, Search, Filter, NotebookText, X, RotateCcw, Trash, Keyboard } from 'lucide-react';

// --- Helper Functions & Data ---

const NOTE_COLORS = [
  { light: 'bg-yellow-100', dark: 'dark:bg-yellow-900/60', border: 'border-yellow-200 dark:border-yellow-800/80' },
  { light: 'bg-rose-100', dark: 'dark:bg-rose-900/60', border: 'border-rose-200 dark:border-rose-800/80' },
  { light: 'bg-violet-100', dark: 'dark:bg-violet-900/60', border: 'border-violet-200 dark:border-violet-800/80' },
  { light: 'bg-lime-100', dark: 'dark:bg-lime-900/60', border: 'border-lime-200 dark:border-lime-800/80' },
  { light: 'bg-sky-100', dark: 'dark:bg-sky-900/60', border: 'border-sky-200 dark:border-sky-800/80' },
];

const CATEGORIES = [
  { id: 'all', name: 'All Notes', icon: '📝' },
  { id: 'favorites', name: 'Favorites', icon: '⭐' },
  { id: 'work', name: 'Work', icon: '💼' },
  { id: 'personal', name: 'Personal', icon: '👤' },
  { id: 'ideas', name: 'Ideas', icon: '💡' },
  { id: 'meetings', name: 'Meetings', icon: '🤝' },
  { id: 'todo', name: 'To-Do', icon: '✅' },
  { id: 'trash', name: 'Trash', icon: '🗑️' },
];

const getInitialTheme = () => {
  if (typeof window !== 'undefined') {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme) return savedTheme;
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }
  return 'light';
};

// --- Custom Components ---

const Tooltip = ({ children, text }) => {
    const [isHovered, setIsHovered] = useState(false);
    return (
        <div className="relative flex items-center" onMouseEnter={() => setIsHovered(true)} onMouseLeave={() => setIsHovered(false)}>
            {children}
            {isHovered && (
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-1.5 text-xs font-semibold text-white bg-gray-900 dark:bg-gray-700 rounded-md shadow-lg z-50 whitespace-nowrap">
                    {text}
                </div>
            )}
        </div>
    );
};

// --- Main App Component ---

export default function App() {
  const [theme, setTheme] = useState(getInitialTheme);
  const [notes, setNotes] = useState([]);
  const [deletedNotes, setDeletedNotes] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRecording, setIsRecording] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [isRecordingModalOpen, setIsRecordingModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [editingNoteId, setEditingNoteId] = useState(null);
  const [editingText, setEditingText] = useState('');
  const [editingTitle, setEditingTitle] = useState('');
  const [noteToDelete, setNoteToDelete] = useState(null);
  const [newNoteText, setNewNoteText] = useState('');
  const [newNoteTitle, setNewNoteTitle] = useState('');
  const [isTextModalOpen, setIsTextModalOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [newNoteCategory, setNewNoteCategory] = useState('personal');
  const [showKeyboardShortcuts, setShowKeyboardShortcuts] = useState(false);
  const [viewingNote, setViewingNote] = useState(null);

  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);

  // --- Effects ---

  useEffect(() => {
    setTimeout(() => {
        try {
            const savedNotes = localStorage.getItem('talknotes_react_v1');
            const savedDeletedNotes = localStorage.getItem('talknotes_deleted_v1');
            if (savedNotes) setNotes(JSON.parse(savedNotes));
            if (savedDeletedNotes) setDeletedNotes(JSON.parse(savedDeletedNotes));
        } catch (error) {
            console.error("Failed to load or parse notes from localStorage", error);
        }
        setIsLoading(false);
    }, 500);
  }, []);

  useEffect(() => {
    document.documentElement.classList.remove('light', 'dark');
    document.documentElement.classList.add(theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.ctrlKey || e.metaKey) {
        switch (e.key) {
          case 'n': e.preventDefault(); setIsTextModalOpen(true); break;
          case 'r': e.preventDefault(); setIsRecordingModalOpen(true); break;
          case 's': e.preventDefault(); if (editingNoteId) saveEditing(editingNoteId); break;
          case 'f': e.preventDefault(); document.querySelector('input[type="search"]')?.focus(); break;
          case 'k': e.preventDefault(); setShowKeyboardShortcuts(prev => !prev); break;
        }
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [editingNoteId]);

  // --- Theme Toggle ---
  const toggleTheme = () => setTheme(prev => (prev === 'light' ? 'dark' : 'light'));

  // --- Audio & Transcription Logic ---
  const handleRecordingStart = async () => {
    if (isRecording) {
      stopRecording();
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorderRef.current = new MediaRecorder(stream, { mimeType: 'audio/webm' });
      audioChunksRef.current = [];
      mediaRecorderRef.current.ondataavailable = event => audioChunksRef.current.push(event.data);
      mediaRecorderRef.current.onstop = async () => {
        setIsRecording(false);
        setIsTranscribing(true);
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        await transcribeAudio(audioBlob);
        stream.getTracks().forEach(track => track.stop());
      };
      mediaRecorderRef.current.start();
      setIsRecording(true);
    } catch (err) {
      console.error("Recording Error:", err);
      alert("Microphone access denied.");
      setIsRecordingModalOpen(false);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) mediaRecorderRef.current.stop();
  };

  const transcribeAudio = async (audioBlob) => {
    const reader = new FileReader();
    reader.readAsDataURL(audioBlob);
    reader.onloadend = async () => {
      const base64Audio = reader.result.split(',')[1];
      
      const isTodo = newNoteCategory === 'todo';
      const promptText = isTodo
        ? "Transcribe this audio as a to-do list. Each distinct task should be on a new line, prefixed with '[ ] '. Also, generate a concise title (max 5 words). Format the output as a clean JSON object with 'title' and 'transcription' keys. Example: {\"title\": \"Grocery List\", \"transcription\": \"[ ] Milk\\n[ ] Eggs\\n[ ] Bread\"}"
        : "Transcribe this audio. Also generate a short, concise title (max 5 words). Format the output as a clean JSON object with 'title' and 'transcription' keys. Example: {\"title\": \"My Great Idea\", \"transcription\": \"This is my idea...\"}";

      const payload = {
        contents: [{ role: "user", parts: [
          { text: promptText },
          { inlineData: { mimeType: "audio/webm", data: base64Audio } }
        ]}]
      };
      const apiKey = process.env.REACT_APP_GEMINI_API_KEY;
      const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`;

      try {
        const response = await fetch(apiUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        if (!response.ok) throw new Error(`API Error: ${response.status}`);
        
        const result = await response.json();
        const responseText = result.candidates?.[0]?.content?.parts?.[0]?.text;
        
        if (responseText) {
          try {
            const jsonString = responseText.match(/{[\s\S]*}/)[0];
            const { title, transcription } = JSON.parse(jsonString);
            saveNote(transcription, title);
          } catch (e) {
            saveNote(responseText, "Untitled Note");
          }
        } else {
          throw new Error("Invalid API response structure.");
        }
      } catch (error) {
        console.error("Transcription Error:", error);
        alert(`Transcription failed.`);
      } finally {
        setIsTranscribing(false);
        setIsRecordingModalOpen(false);
      }
    };
  };

  // --- Note Management ---
  const saveNote = (text, title) => {
    if (!text.trim()) return;
    const newNote = {
      id: Date.now(),
      title: title.trim() || "Untitled Note",
      text,
      category: newNoteCategory,
      createdAt: new Date().toISOString(),
      isFavorited: false,
      color: NOTE_COLORS[notes.length % NOTE_COLORS.length]
    };
    const updatedNotes = [newNote, ...notes];
    setNotes(updatedNotes);
    localStorage.setItem('talknotes_react_v1', JSON.stringify(updatedNotes));
    setNewNoteText('');
    setNewNoteTitle('');
    setIsRecordingModalOpen(false);
    setIsTextModalOpen(false);
  };

  const handleDeleteRequest = (id) => setNoteToDelete(id);
  
  const confirmDelete = () => {
    if (noteToDelete) {
        const noteToMove = notes.find(note => note.id === noteToDelete);
        if (noteToMove) {
          const updatedDeletedNotes = [noteToMove, ...deletedNotes];
          setDeletedNotes(updatedDeletedNotes);
          localStorage.setItem('talknotes_deleted_v1', JSON.stringify(updatedDeletedNotes));
        }
        const updatedNotes = notes.filter(note => note.id !== noteToDelete);
        setNotes(updatedNotes);
        localStorage.setItem('talknotes_react_v1', JSON.stringify(updatedNotes));
        setNoteToDelete(null);
    }
  };

  const deletePermanently = (id) => {
    const updatedDeletedNotes = deletedNotes.filter(note => note.id !== id);
    setDeletedNotes(updatedDeletedNotes);
    localStorage.setItem('talknotes_deleted_v1', JSON.stringify(updatedDeletedNotes));
  };

  const restoreNote = (id) => {
    const noteToRestore = deletedNotes.find(note => note.id === id);
    if (noteToRestore) {
      const updatedNotes = [noteToRestore, ...notes];
      setNotes(updatedNotes);
      localStorage.setItem('talknotes_react_v1', JSON.stringify(updatedNotes));
      const updatedDeletedNotes = deletedNotes.filter(note => note.id !== id);
      setDeletedNotes(updatedDeletedNotes);
      localStorage.setItem('talknotes_deleted_v1', JSON.stringify(updatedDeletedNotes));
    }
  };

  const toggleFavorite = (id) => {
    const updatedNotes = notes.map(n => n.id === id ? { ...n, isFavorited: !n.isFavorited } : n);
    setNotes(updatedNotes);
    localStorage.setItem('talknotes_react_v1', JSON.stringify(updatedNotes));
  };

  const startEditing = (note) => {
    setEditingNoteId(note.id);
    setEditingText(note.text);
    setEditingTitle(note.title);
  };

  const saveEditing = (id) => {
    const updatedNotes = notes.map(n => n.id === id ? { ...n, text: editingText, title: editingTitle } : n);
    setNotes(updatedNotes);
    localStorage.setItem('talknotes_react_v1', JSON.stringify(updatedNotes));
    if (viewingNote?.id === id) setViewingNote({ ...viewingNote, text: editingText, title: editingTitle });
    setEditingNoteId(null);
  };
  
  const handleTodoToggle = (noteId, lineIndex) => {
    const targetNote = notes.find(n => n.id === noteId);
    if (!targetNote) return;

    const lines = targetNote.text.split('\n');
    const currentLine = lines[lineIndex];
    
    if (currentLine.startsWith('[ ] ')) {
        lines[lineIndex] = currentLine.replace('[ ] ', '[x] ');
    } else if (currentLine.startsWith('[x] ')) {
        lines[lineIndex] = currentLine.replace('[x] ', '[ ] ');
    } else {
        lines[lineIndex] = `[ ] ${currentLine}`;
    }
    
    const updatedText = lines.join('\n');
    const updatedNotes = notes.map(n => n.id === noteId ? { ...n, text: updatedText } : n);
    setNotes(updatedNotes);
    localStorage.setItem('talknotes_react_v1', JSON.stringify(updatedNotes));
    if (viewingNote?.id === noteId) setViewingNote(prev => ({...prev, text: updatedText}));
  };

  const playNote = (text) => {
    if ('speechSynthesis' in window) {
      speechSynthesis.cancel();
      speechSynthesis.speak(new SpeechSynthesisUtterance(text));
    }
  };

  // --- Export/Import Functions ---
  const exportNotes = () => {
    const dataStr = JSON.stringify(notes, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `talknotes_${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const importNotes = (event) => {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const importedNotes = JSON.parse(e.target.result);
          setNotes(importedNotes);
          localStorage.setItem('talknotes_react_v1', JSON.stringify(importedNotes));
          alert('Notes imported successfully!');
        } catch (error) {
          alert('Invalid file format. Please select a valid JSON file.');
        }
      };
      reader.readAsText(file);
    }
  };

  const filteredNotes = notes.filter(note => {
      if (selectedCategory === 'favorites') return note.isFavorited;
      const lowerCaseQuery = searchQuery.toLowerCase();
      const matchesSearch = note.title.toLowerCase().includes(lowerCaseQuery) || note.text.toLowerCase().includes(lowerCaseQuery);
      if (selectedCategory === 'all') return matchesSearch;
      return matchesSearch && note.category === selectedCategory;
    }).sort((a, b) => (b.isFavorited - a.isFavorited) || (new Date(b.createdAt) - new Date(a.createdAt)));

  const currentNotes = selectedCategory === 'trash' ? deletedNotes : filteredNotes;

  // --- UI Components ---
  const NoteCard = ({ note, isDeleted = false }) => (
    <div 
      className={`p-4 rounded-lg shadow-sm flex flex-col h-64 border ${note.color.border} ${note.color.light} ${note.color.dark} transition-all duration-300 hover:shadow-lg hover:-translate-y-1 ${isDeleted ? '' : 'cursor-pointer'}`}
      onClick={() => !isDeleted && setViewingNote(note)}
    >
      <div className="flex justify-between items-start mb-2">
        <span className="text-xs font-medium text-gray-600 dark:text-gray-400 bg-gray-200 dark:bg-black/20 px-2 py-1 rounded-full">{CATEGORIES.find(c => c.id === note.category)?.icon} {CATEGORIES.find(c => c.id === note.category)?.name}</span>
        <span className="text-xs font-medium text-gray-500 dark:text-gray-400">{new Date(note.createdAt).toLocaleDateString()}</span>
      </div>
      <h4 className="text-lg font-bold mb-2 truncate text-gray-900 dark:text-gray-100" title={note.title}>{note.title}</h4>
      <p className="text-sm text-gray-800 dark:text-gray-200 leading-relaxed flex-grow overflow-y-auto pr-2">{note.text}</p>
      <div className="flex justify-end items-center border-t border-black/10 dark:border-white/10 pt-3 mt-auto">
        {isDeleted ? (
          <>
            <Tooltip text="Restore"><button onClick={(e) => { e.stopPropagation(); restoreNote(note.id); }} className="p-1.5 rounded-full hover:bg-black/10 dark:hover:bg-white/10"><RotateCcw className="w-4 h-4 text-green-500" /></button></Tooltip>
            <Tooltip text="Delete Permanently"><button onClick={(e) => { e.stopPropagation(); deletePermanently(note.id); }} className="p-1.5 rounded-full hover:bg-black/10 dark:hover:bg-white/10"><Trash className="w-4 h-4 text-red-500" /></button></Tooltip>
          </>
        ) : (
          <>
            <Tooltip text="Favorite"><button onClick={(e) => { e.stopPropagation(); toggleFavorite(note.id); }} className="p-1.5 rounded-full hover:bg-black/10 dark:hover:bg-white/10"><Star className={`w-4 h-4 transition-colors ${note.isFavorited ? 'text-yellow-500 fill-yellow-400' : 'text-gray-400 dark:text-gray-500'}`} /></button></Tooltip>
            <Tooltip text="Play"><button onClick={(e) => { e.stopPropagation(); playNote(note.text); }} className="p-1.5 rounded-full hover:bg-black/10 dark:hover:bg-white/10"><Play className="w-4 h-4 text-gray-400 dark:text-gray-500" /></button></Tooltip>
            <Tooltip text="Delete"><button onClick={(e) => { e.stopPropagation(); handleDeleteRequest(note.id); }} className="p-1.5 rounded-full hover:bg-black/10 dark:hover:bg-white/10"><Trash2 className="w-4 h-4 text-red-500" /></button></Tooltip>
          </>
        )}
      </div>
    </div>
  );

  return (
    <>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700&display=swap'); body { font-family: 'Poppins', sans-serif; }`}</style>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950 text-gray-900 dark:text-gray-100 transition-colors duration-300">
        <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
          
          <header className="flex flex-col sm:flex-row justify-between items-center gap-4 mb-8">
            <div className="flex items-center self-start gap-3">
              <NotebookText className="w-8 h-8 text-blue-500" />
              <div>
                <h1 className="text-3xl sm:text-4xl font-bold">TalkNote</h1>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">AI-powered voice notes</p>
              </div>
            </div>
            <div className="w-full flex flex-col sm:flex-row items-center gap-2 sm:w-auto">
              <div className="relative w-full sm:w-auto">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input type="search" placeholder="Search notes..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full sm:w-48 pl-10 pr-4 py-2 rounded-full bg-gray-100 dark:bg-gray-800 border-2 border-transparent focus:border-blue-500 focus:bg-white dark:focus:bg-gray-900 focus:outline-none transition-all"/>
              </div>
              <div className="flex items-center justify-end w-full sm:w-auto gap-2">
                <Tooltip text="Keyboard Shortcuts (Cmd/Ctrl+K)"><button onClick={() => setShowKeyboardShortcuts(true)} className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-800"><Keyboard className="w-5 h-5"/></button></Tooltip>
                <Tooltip text="Export Notes"><button onClick={exportNotes} className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-800"><Download className="w-5 h-5" /></button></Tooltip>
                <Tooltip text="Import Notes"><label className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-800 cursor-pointer"><Upload className="w-5 h-5" /><input type="file" accept=".json" onChange={importNotes} className="hidden" /></label></Tooltip>
                <button onClick={toggleTheme} className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-800" aria-label="Toggle theme">{theme === 'light' ? <Moon /> : <Sun />}</button>
              </div>
            </div>
          </header>

          <div className="mb-6">
            <div className="flex items-center gap-2 mb-4"><Filter className="w-5 h-5" /><h3 className="font-semibold">Categories</h3></div>
            <div className="flex flex-wrap gap-2">
              {CATEGORIES.map(category => (
                <button key={category.id} onClick={() => setSelectedCategory(category.id)} className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${selectedCategory === category.id ? 'bg-blue-500 text-white shadow-md' : 'bg-gray-200 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-700'}`}>{category.icon} {category.name}</button>
              ))}
            </div>
          </div>

          <main>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold">{CATEGORIES.find(c=>c.id === selectedCategory)?.name}</h2>
              <span className="text-sm text-gray-500 dark:text-gray-400">{currentNotes.length} note{currentNotes.length !== 1 ? 's' : ''}</span>
            </div>
            {isLoading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {[...Array(8)].map((_, i) => <div key={i} className="h-64 bg-gray-200 dark:bg-gray-800 rounded-lg animate-pulse"></div>)}
              </div>
            ) : currentNotes.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {currentNotes.map(note => <NoteCard key={note.id} note={note} isDeleted={selectedCategory === 'trash'} />)}
              </div>
            ) : (
              <div className="text-center py-16 px-6"><h3 className="text-lg font-medium">No notes here.</h3><p className="mt-1 text-base text-gray-500 dark:text-gray-400">{searchQuery ? 'Try adjusting your search or category filter.' : `This category is empty. Try creating a new note!`}</p></div>
            )}
          </main>
        </div>
        
        <div className="fixed bottom-8 right-8 flex flex-col gap-3">
          <Tooltip text="Add Text Note (Ctrl+N)"><button onClick={() => setIsTextModalOpen(true)} className="w-16 h-16 bg-green-500 hover:bg-green-600 text-white rounded-full flex items-center justify-center shadow-lg focus:outline-none focus:ring-4 focus:ring-green-300 dark:focus:ring-green-800 transition-all hover:scale-105"><Edit size={24} /></button></Tooltip>
          <Tooltip text="Record Voice Note (Ctrl+R)"><button onClick={() => setIsRecordingModalOpen(true)} className="w-16 h-16 bg-blue-500 hover:bg-blue-600 text-white rounded-full flex items-center justify-center shadow-lg focus:outline-none focus:ring-4 focus:ring-blue-300 dark:focus:ring-blue-800 transition-all hover:scale-105"><Mic size={24} /></button></Tooltip>
        </div>
      </div>

      {isRecordingModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-xl p-8 w-full max-w-md m-4">
            <h3 className="text-xl font-semibold text-center mb-2 text-gray-900 dark:text-gray-100">Record a new note</h3>
            <p className="text-center text-gray-500 dark:text-gray-400 mb-6">{isTranscribing ? "Gemini is transcribing..." : isRecording ? "Recording in progress..." : "Click the button to start recording."}</p>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Category</label>
              <select value={newNoteCategory} onChange={(e) => setNewNoteCategory(e.target.value)} className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500" disabled={isRecording || isTranscribing}>
                {CATEGORIES.filter(c => c.id !== 'all' && c.id !== 'trash' && c.id !== 'favorites').map(category => (<option key={category.id} value={category.id}>{category.icon} {category.name}</option>))}
              </select>
            </div>
            <div className="flex justify-center items-center my-8">
                <button onClick={handleRecordingStart} className={`w-20 h-20 rounded-full text-white flex items-center justify-center transition-all duration-300 shadow-lg focus:outline-none focus:ring-4 ${isRecording ? 'bg-red-500 hover:bg-red-600 focus:ring-red-300 dark:focus:ring-red-800' : 'bg-blue-500 hover:bg-blue-600 focus:ring-blue-300 dark:focus:ring-blue-800'}`}>{isTranscribing ? <LoaderCircle className="animate-spin" size={32} /> : isRecording ? <Square size={32} /> : <Mic size={32} />}</button>
            </div>
            <button onClick={() => setIsRecordingModalOpen(false)} disabled={isTranscribing} className="w-full mt-4 px-4 py-2 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 rounded-lg font-semibold disabled:opacity-50">Cancel</button>
          </div>
        </div>
      )}

      {isTextModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-xl p-8 w-full max-w-md m-4">
            <h3 className="text-xl font-semibold text-center mb-2 text-gray-900 dark:text-gray-100">Add a new note</h3>
            <div className="mb-4 mt-6">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Title</label>
              <input type="text" value={newNoteTitle} onChange={(e) => setNewNoteTitle(e.target.value)} placeholder="Enter note title..." className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"/>
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Category</label>
              <select value={newNoteCategory} onChange={(e) => setNewNoteCategory(e.target.value)} className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500">
                {CATEGORIES.filter(c => c.id !== 'all' && c.id !== 'trash' && c.id !== 'favorites').map(category => (<option key={category.id} value={category.id}>{category.icon} {category.name}</option>))}
              </select>
            </div>
            <textarea value={newNoteText} onChange={(e) => setNewNoteText(e.target.value)} placeholder="Enter your note here..." className="w-full h-32 p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"/>
            <div className="flex gap-3 mt-6">
              <button onClick={() => setIsTextModalOpen(false)} className="flex-1 px-4 py-2 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 rounded-lg font-semibold">Cancel</button>
              <button onClick={() => saveNote(newNoteText, newNoteTitle)} disabled={!newNoteText.trim()} className="flex-1 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-semibold disabled:opacity-50">Save Note</button>
            </div>
          </div>
        </div>
      )}

      {showKeyboardShortcuts && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-xl p-8 w-full max-w-md m-4">
            <h3 className="text-xl font-semibold text-center mb-6 text-gray-900 dark:text-gray-100">Keyboard Shortcuts</h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center"><p className="text-gray-900 dark:text-gray-100">New Text Note</p><kbd className="px-2 py-1 bg-gray-200 dark:bg-gray-800 rounded text-sm font-sans text-gray-900 dark:text-gray-200">Cmd/Ctrl + N</kbd></div>
              <div className="flex justify-between items-center"><p className="text-gray-900 dark:text-gray-100">Record Voice Note</p><kbd className="px-2 py-1 bg-gray-200 dark:bg-gray-800 rounded text-sm font-sans text-gray-900 dark:text-gray-200">Cmd/Ctrl + R</kbd></div>
              <div className="flex justify-between items-center"><p className="text-gray-900 dark:text-gray-100">Save Note (while editing)</p><kbd className="px-2 py-1 bg-gray-200 dark:bg-gray-800 rounded text-sm font-sans text-gray-900 dark:text-gray-200">Cmd/Ctrl + S</kbd></div>
              <div className="flex justify-between items-center"><p className="text-gray-900 dark:text-gray-100">Search Notes</p><kbd className="px-2 py-1 bg-gray-200 dark:bg-gray-800 rounded text-sm font-sans text-gray-900 dark:text-gray-200">Cmd/Ctrl + F</kbd></div>
              <div className="flex justify-between items-center"><p className="text-gray-900 dark:text-gray-100">Toggle Shortcuts</p><kbd className="px-2 py-1 bg-gray-200 dark:bg-gray-800 rounded text-sm font-sans text-gray-900 dark:text-gray-200">Cmd/Ctrl + K</kbd></div>
            </div>
            <button onClick={() => setShowKeyboardShortcuts(false)} className="w-full mt-6 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-semibold">Close</button>
          </div>
        </div>
      )}
      
      {viewingNote && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col">
            <header className="p-4 border-b border-black/10 dark:border-white/10 flex justify-between items-center">
              {editingNoteId === viewingNote.id ? <input type="text" value={editingTitle} onChange={(e) => setEditingTitle(e.target.value)} className="text-lg font-bold bg-transparent focus:outline-none w-full text-gray-900 dark:text-gray-100"/> : <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100">{viewingNote.title}</h3>}
              <button onClick={() => { setViewingNote(null); setEditingNoteId(null); }} className="p-1 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700"><X size={20}/></button>
            </header>
            <main className="p-6 flex-grow overflow-y-auto">
              {editingNoteId === viewingNote.id ? (
                <textarea value={editingText} onChange={(e) => setEditingText(e.target.value)} className="w-full h-full text-base bg-transparent focus:outline-none resize-none text-gray-800 dark:text-gray-100"/>
              ) : viewingNote.category === 'todo' ? (
                  <div className="space-y-2">
                    {viewingNote.text.split('\n').map((line, index) => (
                      <div key={index} className="flex items-center gap-3">
                        <input type="checkbox" checked={line.startsWith('[x] ')} onChange={() => handleTodoToggle(viewingNote.id, index)} className="h-5 w-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer"/>
                        <span className={`flex-1 cursor-pointer text-gray-900 dark:text-gray-100 ${line.startsWith('[x] ') ? 'line-through text-gray-500' : ''}`} onClick={() => handleTodoToggle(viewingNote.id, index)}>{line.replace(/\[[x ]\] /, '')}</span>
                      </div>
                    ))}
                  </div>
              ) : (
                <p className="text-base whitespace-pre-wrap text-gray-900 dark:text-gray-100">{viewingNote.text}</p>
              )}
            </main>
            <footer className="p-4 border-t border-black/10 dark:border-white/10 flex justify-end gap-3">
              <button onClick={() => playNote(viewingNote.text)} className="px-4 py-2 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 rounded-lg font-semibold flex items-center gap-2"><Play size={18}/> Play</button>
              {editingNoteId === viewingNote.id ? (
                <button onClick={() => saveEditing(viewingNote.id)} className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-semibold flex items-center gap-2"><Save size={18}/> Save</button>
              ) : (
                <button onClick={() => startEditing(viewingNote)} className="px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg font-semibold flex items-center gap-2"><Edit size={18}/> Edit</button>
              )}
            </footer>
          </div>
        </div>
      )}

      {noteToDelete && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-xl p-6 w-full max-w-sm m-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Delete Note</h3>
            <p className="text-gray-500 dark:text-gray-400 mt-2">Are you sure you want to move this note to the trash?</p>
            <div className="flex justify-end gap-3 mt-6">
              <button onClick={() => setNoteToDelete(null)} className="px-4 py-2 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 rounded-lg font-semibold">Cancel</button>
              <button onClick={confirmDelete} className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg font-semibold">Delete</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
