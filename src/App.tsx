import { useState, useEffect, useRef } from 'react';
import { 
  Sparkles, 
  FileText, 
  Clock, 
  Clapperboard, 
  History, 
  Copy, 
  ChevronRight, 
  ChevronDown,
  ListTree,
  StopCircle, 
  Video, 
  Check, 
  Volume2, 
  Download, 
  Play, 
  Pause, 
  Music, 
  Image, 
  ArrowLeft, 
  Trash2, 
  Sliders,
  Settings,
  Flame,
  VolumeX,
  Volume,
  Edit3,
  Square,
  PlayCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

type View = 'home' | 'script' | 'cinematic' | 'history';

interface StoryLine {
  character: string;
  text: string;
  duration: string;
  type: 'dialogue' | 'sfx';
}

interface StoryPart {
  scene_number: number;
  scene_description: string;
  lines: StoryLine[];
  voice_tone: string;
  ai_background_prompt_bengali?: string;
  character_movement?: string;
  camera_movement: string;
  bgm_tag?: string;
  sfx_tag?: string;
}

interface StoryChapter {
  chapter_number: number;
  chapter_title: string;
  parts: StoryPart[]; // Mapping as parts for component compatibility if needed
  scenes?: StoryPart[];
}

interface Production {
  id: number;
  story_title: string;
  category: string;
  duration: string;
  language: string;
  format: string;
  total_chapters: number;
  chapters: StoryChapter[];
  total_spoken_duration?: string;
  timestamp: string;
}

// Safely convert old format data from localStorage database into new format structure
function normalizeProduction(prod: any): Production {
  if (prod.chapters && prod.chapters.length > 0) {
    // Inject fallback if not present and handle the structural shift
    const updatedChapters = prod.chapters.map((ch: any) => {
      // If it has 'parts' but each part has a 'content' string (old format), we wrap it into 'lines'
      const rawParts = ch.parts || ch.scenes || [];
      const normalizedParts = rawParts.map((p: any) => {
        if (p.content && !p.lines) {
          return {
            ...p,
            scene_number: p.part_number || p.scene_number,
            scene_description: p.scene_description || "Scene setup description.",
            lines: [
              { 
                character: p.character_name || "Narrator", 
                text: p.content, 
                duration: "10s", 
                type: 'dialogue' 
              }
            ],
            ai_background_prompt_bengali: p.ai_background_prompt_bengali || "একটি হালকা নীল ব্যাকগ্রাউন্ড, ৩ডি অ্যানিমেশন স্টাইল।",
            character_movement: p.character_movement || "Standing Calmly.",
            bgm_tag: p.bgm_tag || p.bgm_sfx_tag || "Cinematic mystery ambient BGM",
            sfx_tag: p.sfx_tag || "Subtle cartoon sound effect"
          };
        }
        // If it's already new format (has lines)
        return {
          ...p,
          scene_number: p.scene_number || p.part_number,
          parts: p.parts || p.lines // extra safety
        };
      });

      return {
        ...ch,
        parts: normalizedParts,
        scenes: normalizedParts
      };
    });

    return {
      ...prod,
      chapters: updatedChapters
    } as Production;
  }
  
  // Very old format
  return {
    id: prod.id || Date.now(),
    story_title: prod.title || prod.story_title || "পুরাতন কার্টুন গল্প",
    category: prod.stylePreset || prod.category || "General",
    duration: String(prod.duration || "5m"),
    language: prod.language || "Bengali",
    format: prod.format || "Dialogue",
    total_chapters: 1,
    chapters: [],
    timestamp: prod.timestamp || ""
  };
}

const getCategoryTheme = (cat: string) => {
  switch (cat) {
    case 'Horror':
      return {
        primary: '#f87171', 
        bgGradient: 'from-red-500/10 via-transparent to-transparent',
        badge: 'bg-red-500/10 border-red-500/20 text-red-400',
        activeBtn: 'bg-red-500/20 border-red-500 text-white shadow-[0_4px_15px_rgba(239,68,68,0.25)]',
        colorBadge: 'bg-red-500/15 text-red-400 border-red-500/20',
        accentText: 'text-red-400',
        accentTextHover: 'hover:text-red-300',
        solidBtn: 'bg-gradient-to-r from-red-600 to-red-800 hover:from-red-500 hover:to-red-700 shadow-[0_4px_20px_rgba(239,68,68,0.4)]',
        navText: 'text-red-400',
        accentBorder: 'border-red-500/30 focus:border-red-500/60 focus:ring-red-500/20',
        glowBg: 'rgba(239, 68, 68, 0.1)',
        loadingRing: 'border-t-red-500 border-b-red-500'
      };
    case 'Magic/Fantasy':
      return {
        primary: '#c084fc', 
        bgGradient: 'from-purple-500/10 via-transparent to-transparent',
        badge: 'bg-purple-500/10 border-purple-500/20 text-purple-300',
        activeBtn: 'bg-purple-500/20 border-purple-500 text-white shadow-[0_4px_15px_rgba(168,85,247,0.25)]',
        colorBadge: 'bg-purple-500/15 text-purple-400 border-purple-500/20',
        accentText: 'text-purple-400',
        accentTextHover: 'hover:text-purple-300',
        solidBtn: 'bg-gradient-to-r from-purple-500 to-purple-700 hover:from-purple-400 hover:to-purple-600 shadow-[0_4px_20px_rgba(168,85,247,0.4)]',
        navText: 'text-purple-400',
        accentBorder: 'border-purple-500/30 focus:border-purple-500/60 focus:ring-purple-500/20',
        glowBg: 'rgba(168, 85, 247, 0.1)',
        loadingRing: 'border-t-purple-500 border-b-purple-500'
      };
    case 'Sci-Fi':
      return {
        primary: '#22d3ee', 
        bgGradient: 'from-cyan-500/10 via-transparent to-transparent',
        badge: 'bg-cyan-500/10 border-cyan-500/20 text-cyan-300',
        activeBtn: 'bg-cyan-500/20 border-cyan-500 text-white shadow-[0_4px_15px_rgba(6,182,212,0.25)]',
        colorBadge: 'bg-cyan-500/15 text-cyan-400 border-cyan-500/20',
        accentText: 'text-cyan-400',
        accentTextHover: 'hover:text-cyan-300',
        solidBtn: 'bg-gradient-to-r from-cyan-500 to-cyan-700 hover:from-cyan-400 hover:to-cyan-600 shadow-[0_4px_20px_rgba(6,182,212,0.4)]',
        navText: 'text-cyan-400',
        accentBorder: 'border-cyan-500/30 focus:border-cyan-500/60 focus:ring-cyan-500/20',
        glowBg: 'rgba(6, 182, 212, 0.1)',
        loadingRing: 'border-t-cyan-500 border-b-cyan-500'
      };
    case 'Comedic':
      return {
        primary: '#fbbf24', 
        bgGradient: 'from-amber-500/10 via-transparent to-transparent',
        badge: 'bg-amber-500/10 border-amber-500/20 text-amber-300',
        activeBtn: 'bg-amber-500/20 border-amber-500 text-white shadow-[0_4px_15px_rgba(245,158,11,0.25)]',
        colorBadge: 'bg-amber-500/15 text-amber-400 border-amber-500/20',
        accentText: 'text-amber-400',
        accentTextHover: 'hover:text-amber-300',
        solidBtn: 'bg-gradient-to-r from-amber-500 to-amber-700 hover:from-amber-400 hover:to-amber-600 shadow-[0_4px_20px_rgba(245,158,11,0.4)]',
        navText: 'text-amber-400',
        accentBorder: 'border-amber-500/30 focus:border-amber-500/60 focus:ring-amber-500/20',
        glowBg: 'rgba(245, 158, 11, 0.1)',
        loadingRing: 'border-t-amber-500 border-b-amber-500'
      };
    default: // Moral / General
      return {
        primary: '#34d399', 
        bgGradient: 'from-emerald-500/10 via-transparent to-transparent',
        badge: 'bg-emerald-500/10 border-emerald-500/20 text-emerald-300',
        activeBtn: 'bg-emerald-500/20 border-emerald-500 text-white shadow-[0_4px_15px_rgba(16,185,129,0.25)]',
        colorBadge: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/20',
        accentText: 'text-emerald-400',
        accentTextHover: 'hover:text-emerald-300',
        solidBtn: 'bg-gradient-to-r from-emerald-500 to-[#10b981] hover:from-emerald-400 hover:to-emerald-600 shadow-[0_4px_20px_rgba(16,185,129,0.4)]',
        navText: 'text-emerald-400',
        accentBorder: 'border-emerald-500/30 focus:border-emerald-500/60 focus:ring-emerald-500/20',
        glowBg: 'rgba(16, 185, 129, 0.1)',
        loadingRing: 'border-t-emerald-500 border-b-emerald-500'
      };
  }
};

const getApiUrl = (endpoint: string): string => {
  // 1. Check if there is an override in localStorage
  const savedApiUrl = localStorage.getItem('STORY_GENERATOR_API_URL');
  if (savedApiUrl) {
    return `${savedApiUrl.replace(/\/$/, '')}${endpoint}`;
  }
  
  // 2. Detect if origin is Netlify or any non-original custom host
  const currentHost = window.location.hostname;
  const isOriginalHost = currentHost.includes('run.app') || currentHost === 'localhost' || currentHost === '127.0.0.1';
  
  // If the user deployed to Netlify and didn't configure a proxy or wants robust direct queries:
  if (!isOriginalHost && !window.location.port) {
    const defaultBackendUrl = 'https://ais-pre-qeatm6ccr5dn35vzdkzq2w-88171425959.asia-southeast1.run.app';
    return `${defaultBackendUrl}${endpoint}`;
  }
  
  return endpoint;
};

export default function App() {
  const [currentView, setCurrentView] = useState<View>('home');
  const [storyInput, setStoryInput] = useState('');
  
  // Autodraft Core Settings Hooks
  const [language, setLanguage] = useState<'Bengali' | 'English' | 'Hindi'>('Bengali');
  const [format, setFormat] = useState<'Dialogue' | 'Narration' | 'Combined'>('Dialogue');
  const [category, setCategory] = useState<'Horror' | 'Magic/Fantasy' | 'Moral' | 'Comedic' | 'Sci-Fi'>('Moral');
  const [duration, setDuration] = useState<string>('5m');
  
  // Loading Overlay states
  const [isLoading, setIsLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState(1);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Active Story production
  const [production, setProduction] = useState<Production | null>(null);
  const [productionHistory, setProductionHistory] = useState<Production[]>([]);

  // Generation Phasing & Analysis states
  const [analysisData, setAnalysisData] = useState<any>(null);
  const [timelineData, setTimelineData] = useState<any>(null);
  const [isAnalyzed, setIsAnalyzed] = useState(false);
  const [isTimelineMapped, setIsTimelineMapped] = useState(false);
  const [isFinalGenStarted, setIsFinalGenStarted] = useState(false);

  // Dynamic genre-based styling engine
  const activeTheme = getCategoryTheme(currentView === 'home' ? category : (production?.category || category));

  // Sound Synth states
  const [selectedVoice, setSelectedVoice] = useState('Kore'); // prebuilt options: Kore, Puck, Fenrir, Zephyr
  const [speechRate, setSpeechRate] = useState(1.0); // 0.5 - 2.0
  const [speechPitch, setSpeechPitch] = useState(1.2); // 0.5 - 2.0 (High pitch for cartoon style)
  
  // Character Editing states
  const [editingCharIdx, setEditingCharIdx] = useState<number | null>(null);
  const [tempCharName, setTempCharName] = useState('');
  
  // Audio state
  const [playingId, setPlayingId] = useState<any>(null);
  const [activeChapterIndex, setActiveChapterIndex] = useState<number>(-1);
  const [currentAudio, setCurrentAudio] = useState<HTMLAudioElement | null>(null);

  // Editing States
  const [editingOutline, setEditingOutline] = useState<{chapIdx: number, pIdx: number} | null>(null);
  const [outlineText, setOutlineText] = useState("");
  const [editingScriptLine, setEditingScriptLine] = useState<{sceneIdx: number, lineIdx: number} | null>(null);
  const [scriptLineText, setScriptLineText] = useState("");
  const [isPlayingFullScene, setIsPlayingFullScene] = useState(false);

  // Custom API & Settings states for Netlify / Free custom domains
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [customApiUrl, setCustomApiUrl] = useState(localStorage.getItem('STORY_GENERATOR_API_URL') || '');
  const [customGeminiKey, setCustomGeminiKey] = useState(localStorage.getItem('STORY_GENERATOR_GEMINI_KEY') || '');

  // Copy Feedback
  const [storyCopied, setStoryCopied] = useState(false);
  const [scriptCopied, setScriptCopied] = useState(false);
  const [copiedId, setCopiedId] = useState<string | number | null>(null);

  // Audio queue for full scene playback
  const audioQueueRef = useRef<StoryLine[]>([]);
  const isPlayingQueueRef = useRef(false);

  // Local storage loading for history
  useEffect(() => {
    try {
      const saved = localStorage.getItem('production_history');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          setProductionHistory(parsed.map(item => normalizeProduction(item)));
        }
      }
    } catch (e) {
      console.warn("Could not load history from storage", e);
    }
  }, []);

  // Save to history helper
  const saveToHistory = (item: Production) => {
    try {
      let currentHistory = [...productionHistory];
      // Avoid duplicate matching by ID
      currentHistory = currentHistory.filter(h => h.id !== item.id);
      const updated = [item, ...currentHistory].slice(0, 20); // Keep last 20
      setProductionHistory(updated);
      localStorage.setItem('production_history', JSON.stringify(updated));
    } catch (e) {
      console.warn("Could not save to history", e);
    }
  };

  const deleteHistoryItem = (id: number, e: any) => {
    e.stopPropagation();
    const updated = productionHistory.filter(item => item.id !== id);
    setProductionHistory(updated);
    localStorage.setItem('production_history', JSON.stringify(updated));
  };

  const clearAllHistory = () => {
    if (window.confirm("আপনি কি নিশ্চিত যে সমস্ত হিস্ট্রি ডিলিট করতে চান?")) {
      setProductionHistory([]);
      localStorage.removeItem('production_history');
    }
  };

  // Safe Cancel/Abort Production
  const cancelProduction = () => {
    if (window.confirm('Stop current production / কারেন্ট প্রোডাকশন থামিয়ে দিবেন?')) {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      setIsLoading(false);
      setLoadingStep(1);
    }
  };

  // --- Character Renaming ---
  const handleRenameCharacter = (idx: number, newName: string) => {
    if (!analysisData || !newName.trim()) {
      setEditingCharIdx(null);
      return;
    }
    
    const oldName = analysisData.character_profiles[idx].name;
    const updatedProfiles = [...analysisData.character_profiles];
    updatedProfiles[idx].name = newName;
    
    setAnalysisData((prev: any) => ({
      ...prev,
      character_profiles: updatedProfiles
    }));

    // If timeline already exists, update character names there too
    if (timelineData && timelineData.chapters) {
      const updatedChapters = timelineData.chapters.map((ch: any) => ({
        ...ch,
        parts: (ch.parts || ch.scenes || []).map((p: any) => ({
          ...p,
          lines: (p.lines || []).map((l: any) => ({
            ...l,
            character: l.character === oldName ? newName : l.character
          }))
        }))
      }));
      setTimelineData((prev: any) => ({ ...prev, chapters: updatedChapters }));
    }

    // If final production exists, update character names there too
    if (production && production.chapters) {
      const updatedProdChapters = production.chapters.map((ch: any) => ({
        ...ch,
        parts: (ch.parts || ch.scenes || []).map((p: any) => ({
          ...p,
          lines: (p.lines || []).map((l: any) => ({
            ...l,
            character: l.character === oldName ? newName : l.character
          }))
        }))
      }));
      setProduction((prev: any) => (prev ? { ...prev, chapters: updatedProdChapters } : null));
    }

    setEditingCharIdx(null);
  };

  // --- Outline Editing ---
  const handleEditOutline = (chapIdx: number, pIdx: number, currentText: string) => {
    setEditingOutline({ chapIdx, pIdx });
    setOutlineText(currentText);
  };

  const saveOutlineEdit = () => {
    if (!editingOutline || !timelineData) return;
    const newTimeline = { ...timelineData };
    if (newTimeline.chapters[editingOutline.chapIdx]?.parts[editingOutline.pIdx]) {
      newTimeline.chapters[editingOutline.chapIdx].parts[editingOutline.pIdx].detailed_outline = outlineText;
      setTimelineData(newTimeline);
    }
    setEditingOutline(null);
  };

  // --- Script Editing ---
  const handleEditScriptLine = (sceneIdx: number, lineIdx: number, currentText: string) => {
    setEditingScriptLine({ sceneIdx, lineIdx });
    setScriptLineText(currentText);
  };

  const saveScriptLineEdit = () => {
    if (!editingScriptLine || !production) return;
    const newProd = { ...production };
    const chapter = newProd.chapters[activeChapterIndex];
    if (!chapter) return;

    const parts = chapter.parts || chapter.scenes;
    if (parts && parts[editingScriptLine.sceneIdx]?.lines[editingScriptLine.lineIdx]) {
      parts[editingScriptLine.sceneIdx].lines[editingScriptLine.lineIdx].text = scriptLineText;
      setProduction(newProd);
      saveToHistory(newProd);
    }
    setEditingScriptLine(null);
  };

  // --- Full Scene Playback ---
  const playFullSceneAudio = async (lines: StoryLine[]) => {
    if (isPlayingFullScene) {
      window.speechSynthesis.cancel();
      if (currentAudio) currentAudio.pause();
      setIsPlayingFullScene(false);
      isPlayingQueueRef.current = false;
      return;
    }

    setIsPlayingFullScene(true);
    isPlayingQueueRef.current = true;
    audioQueueRef.current = [...lines];

    const playNext = async () => {
      if (!isPlayingQueueRef.current || audioQueueRef.current.length === 0) {
        setIsPlayingFullScene(false);
        return;
      }

      const line = audioQueueRef.current.shift();
      if (!line) {
        setIsPlayingFullScene(false);
        return;
      }

      if (line.type === 'sfx') {
        // Just a short gap for SFX if we don't have actual SFX files
        await new Promise(r => setTimeout(r, 500));
        playNext();
        return;
      }

      let speechLang = 'bn-BD';
      if (production?.language === 'English') speechLang = 'en-US';
      else if (production?.language === 'Hindi') speechLang = 'hi-IN';

      if (window.speechSynthesis) {
        const utterance = new SpeechSynthesisUtterance(line.text);
        utterance.lang = speechLang;
        utterance.rate = speechRate;
        utterance.pitch = speechPitch;
        
        utterance.onend = () => {
          setTimeout(playNext, 400); // Short gap between lines
        };
        utterance.onerror = () => setIsPlayingFullScene(false);
        window.speechSynthesis.speak(utterance);
      }
    };

    playNext();
  };

  // 1. Generation Step 1: Analysis & Mapping
  const handleStartAnalysis = async () => {
    if (!storyInput.trim()) {
      alert("অনুগ্রহ করে একটি চমৎকার গল্পের আইডিয়া বা ইউটিউব টপিক লিখুন!");
      return;
    }

    setIsLoading(true);
    setLoadingStep(1);
    setIsAnalyzed(false);
    setIsTimelineMapped(false);
    setAnalysisData(null);
    setTimelineData(null);

    abortControllerRef.current = new AbortController();

    try {
      // Step 1: Analyze / Mapping
      const res = await fetch(getApiUrl('/api/analyze-plot'), {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'x-gemini-api-key': localStorage.getItem('STORY_GENERATOR_GEMINI_KEY') || ''
        },
        body: JSON.stringify({ story_plot: storyInput, language, category, duration }),
        signal: abortControllerRef.current.signal
      });

      if (!res.ok) throw new Error("তথ্য বিশ্লেষণ ব্যর্থ হয়েছে!");
      
      const data = await res.json();
      setAnalysisData(data);
      setLoadingStep(2);
      
      await new Promise(resolve => setTimeout(resolve, 800));
      setIsAnalyzed(true);
      setIsLoading(false);
    } catch (err: any) {
      if (err.name === 'AbortError') return;
      alert(`বিশ্লেষণ ব্যর্থ হয়েছে: ${err.message}`);
      setIsLoading(false);
    }
  };

  // 1. Generation Step 2: Timeline Mapping
  const handleMapTimeline = async () => {
    setIsLoading(true);
    setLoadingStep(2);
    setIsTimelineMapped(false);

    try {
      const res = await fetch(getApiUrl('/api/map-timeline'), {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'x-gemini-api-key': localStorage.getItem('STORY_GENERATOR_GEMINI_KEY') || ''
        },
        body: JSON.stringify({ 
          story_plot: storyInput, 
          language, 
          category, 
          duration,
          character_profiles: analysisData?.character_profiles,
          plot_analysis: analysisData?.plot_analysis
        }),
        signal: abortControllerRef.current?.signal
      });

      if (!res.ok) throw new Error("টাইমলাইন ম্যাপিং ব্যর্থ হয়েছে!");
      
      const data = await res.json();
      setTimelineData(data);
      setLoadingStep(3);
      
      await new Promise(resolve => setTimeout(resolve, 800));
      setIsTimelineMapped(true);
      setIsLoading(false);
    } catch (err: any) {
      if (err.name === 'AbortError') return;
      alert(`ম্যাপিং ব্যর্থ হয়েছে: ${err.message}`);
      setIsLoading(false);
    }
  };

  // 1. Generation Step 3: Final Script Production
  const handleFinalizeProduction = async () => {
    setIsLoading(true);
    setLoadingStep(4);
    setIsFinalGenStarted(true);

    try {
      // Step 3: Script generation
      const response = await fetch(getApiUrl('/api/generate-script'), {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'x-gemini-api-key': localStorage.getItem('STORY_GENERATOR_GEMINI_KEY') || ''
        },
        body: JSON.stringify({ 
          story_plot: storyInput, 
          language, 
          format, 
          category, 
          duration,
          story_outline: timelineData 
        }),
        signal: abortControllerRef.current?.signal
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'গল্প স্ক্রিপ্ট তৈরিতে ত্রুটি দেখা দিয়েছে!');
      }

      const data = await response.json();
      setLoadingStep(4);

      await new Promise(resolve => setTimeout(resolve, 800));

      const finalProduct: Production = {
        id: Date.now(),
        story_title: data.story_title || data.title || "নতুন কার্টুন গল্প",
        category: data.category || category,
        duration: data.duration || duration,
        language: data.language || language,
        format: data.format || format,
        total_chapters: data.total_chapters || data.chapters?.length || 1,
        chapters: data.chapters || [],
        timestamp: new Date().toLocaleDateString('bn-BD') + ' - ' + new Date().toLocaleTimeString('bn-BD', { hour: '2-digit', minute: '2-digit' }),
      };

      setProduction(finalProduct);
      saveToHistory(finalProduct);
      
      setIsLoading(false);
      setIsAnalyzed(false);
      setIsTimelineMapped(false);
      setCurrentView('script');
    } catch (err: any) {
      if (err.name === 'AbortError') return;
      console.error(err);
      alert(`প্রোডাকশন ব্যর্থ হয়েছে: ${err.message || "সার্ভার এরর"}. অনুগ্রহ করে আবার চেষ্টা করুন।`);
      setIsLoading(false);
    }
  };

  // High Quality Speech / TTS Voice generation
  const handleVoiceSynthesis = async (partIdx: string, text: string) => {
    // If already playing, toggle stop
    if (playingId === partIdx as any) {
      if (currentAudio) {
        currentAudio.pause();
      }
      window.speechSynthesis.cancel();
      setPlayingId(null);
      return;
    }

    let speechLang = 'bn-BD';
    if (production?.language === 'English') {
      speechLang = 'en-US';
    } else if (production?.language === 'Hindi') {
      speechLang = 'hi-IN';
    }

    // Attempt browser fallback directly for super-fast cartoon-pitch adjustments
    if (window.speechSynthesis) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = speechLang;
      utterance.rate = speechRate;
      utterance.pitch = speechPitch; // High pitch sounds like funny kid or cartoon character!

      const voices = window.speechSynthesis.getVoices();
      const matchVoice = voices.find(v => v.lang.includes(speechLang.split('-')[0]));
      if (matchVoice) {
        utterance.voice = matchVoice;
      }

      setPlayingId(partIdx as any);

      utterance.onend = () => {
        setPlayingId(null);
      };

      utterance.onerror = () => {
        setPlayingId(null);
      };

      window.speechSynthesis.speak(utterance);
      return;
    }

    // If browser TTS is not available or failed, fall back to high-quality server-side model-based synthesized audio!
    setPlayingId(partIdx as any);
    try {
      const res = await fetch(getApiUrl('/api/generate-voice'), {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'x-gemini-api-key': localStorage.getItem('STORY_GENERATOR_GEMINI_KEY') || ''
        },
        body: JSON.stringify({ 
          text: text, 
          voiceName: selectedVoice,
          rate: speechRate,
          pitch: speechPitch
        })
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || "Voice generation error");
      }

      const data = await res.json();
      const audioUrl = `data:audio/mp3;base64,${data.audioBase64}`;
      const audio = new Audio(audioUrl);
      
      if (currentAudio) {
        currentAudio.pause();
      }
      
      setCurrentAudio(audio);
      audio.play();
      
      audio.onended = () => {
        setPlayingId(null);
      };
    } catch (err) {
      console.warn("Server voice synthesis fallback failed. Ensure you are on a compatible audio browser context.", err);
      setPlayingId(null);
    }
  };

  // Copy helper
  const handleCopyText = async (text: string, type: string, blockId?: string | number) => {
    try {
      await navigator.clipboard.writeText(text);
      if (type === 'story') {
        setStoryCopied(true);
        setTimeout(() => setStoryCopied(false), 2000);
      } else if (type === 'script') {
        setScriptCopied(true);
        setTimeout(() => setScriptCopied(false), 2000);
      } else if ((type === 'block' || type === 'prompt') && blockId !== undefined) {
        setCopiedId(blockId);
        setTimeout(() => setCopiedId(null), 2000);
      }
    } catch (err) {
      console.error('Copy failed:', err);
      // Fallback for iframe constraints
      try {
        const textArea = document.createElement("textarea");
        textArea.value = text;
        textArea.style.position = "fixed";
        textArea.style.left = "-9999px";
        textArea.style.top = "0";
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        const successful = document.execCommand('copy');
        document.body.removeChild(textArea);
        
        if (successful && blockId !== undefined) {
          setCopiedId(blockId);
          setTimeout(() => setCopiedId(null), 2000);
        }
      } catch (err2) {
        console.error('execCommand copy failed:', err2);
      }
    }
  };

  const getFullStoryText = () => {
    if (!production || !production.chapters) return "";
    return production.chapters
      .map(ch => `${ch.chapter_title}:\n` + (ch.parts || ch.scenes || []).map((p: any) => {
        let sceneText = `Scene ${p.scene_number || p.part_number}\nScene Description: ${p.scene_description || p.part_description}\n`;
        const linesText = (p.lines || []).map((l: any) => `${l.character}: "${l.text}" (${l.duration})`).join("\n");
        return sceneText + linesText;
      }).join("\n\n"))
      .join("\n\n") + `\ntotal spoken duration: ${production.total_spoken_duration || 'Unknown'}`;
  };

  const getProductionWordCount = (prod: Production | null) => {
    if (!prod || !prod.chapters) return 0;
    let count = 0;
    prod.chapters.forEach(ch => {
      const parts = ch.parts || ch.scenes || [];
      parts.forEach((p: any) => {
        if (p.lines) {
          p.lines.forEach((l: any) => {
            count += l.text.trim().split(/\s+/).length;
          });
        }
      });
    });
    return count;
  };

  // Full Voice narration play for the complete story
  const [fullStoryPlaying, setFullStoryPlaying] = useState(false);
  const handleToggleFullStoryPlay = () => {
    if (!production) return;
    if (fullStoryPlaying) {
      window.speechSynthesis.cancel();
      setFullStoryPlaying(false);
      return;
    }

    if (window.speechSynthesis) {
      window.speechSynthesis.cancel();
      
      let speechLang = 'bn-BD';
      if (production?.language === 'English') {
        speechLang = 'en-US';
      } else if (production?.language === 'Hindi') {
        speechLang = 'hi-IN';
      }

      const rawText = getFullStoryText();
      const utterance = new SpeechSynthesisUtterance(rawText);
      utterance.lang = speechLang;
      utterance.rate = speechRate;
      utterance.pitch = speechPitch;
      setFullStoryPlaying(true);
      utterance.onend = () => setFullStoryPlaying(false);
      utterance.onerror = () => setFullStoryPlaying(false);
      window.speechSynthesis.speak(utterance);
    }
  };

  return (
    <div className="relative max-w-md mx-auto min-h-screen flex flex-col bg-[#050505] text-white overflow-hidden pb-18 select-none custom-scrollbar shadow-2xl border-x border-white/5">
      
      {/* 3D Radiant Background Blobs */}
      <div 
        className="bg-blob blob-1 transition-all duration-1000" 
        style={{ background: `radial-gradient(circle, ${activeTheme.primary}12 0%, transparent 70%)` }}
      ></div>
      <div 
        className="bg-blob blob-2 transition-all duration-1000" 
        style={{ background: `radial-gradient(circle, ${activeTheme.primary}0a 0%, transparent 70%)` }}
      ></div>
      <div 
        className="bg-blob blob-3 transition-all duration-1000" 
        style={{ background: `radial-gradient(circle, ${activeTheme.primary}10 0%, transparent 70%)` }}
      ></div>

      {/* Top Banner App Header */}
      <header className="fixed top-0 left-1/2 -translate-x-1/2 w-full max-w-md p-5 flex items-center justify-between bg-[#050505]/80 backdrop-blur-2xl z-40 border-b border-white/5">
        <div className="flex items-center gap-3">
          <div 
            className="w-11 h-11 rounded-[16px] flex items-center justify-center transition-all duration-500 shadow-xl"
            style={{
              background: `linear-gradient(135deg, ${activeTheme.primary}aa 0%, #151518 100%)`,
              boxShadow: `0 0 15px ${activeTheme.primary}22`
            }}
          >
            <Video className="text-white w-5 h-5 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <h1 className="text-lg font-black tracking-tighter uppercase leading-none text-white font-display">STORY GENERATOR</h1>
              <span 
                className="text-[8px] px-1.5 py-0.5 rounded font-black transition-all duration-500"
                style={{
                  backgroundColor: `${activeTheme.primary}20`,
                  color: activeTheme.primary
                }}
              >
                V3.0
              </span>
            </div>
            <p 
              className="text-[9px] font-bold tracking-[0.2em] uppercase mt-1 transition-all duration-500"
              style={{ color: activeTheme.primary }}
            >
              Bengali Cartoon Studio
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          {currentView !== 'home' && (
            <button 
              onClick={() => setCurrentView('home')} 
              className="px-3 py-2 rounded-xl bg-white/5 text-xs font-bold text-white/70 hover:bg-white/10 transition-colors flex items-center gap-1.5 border border-white/5"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              ফিরে যান
            </button>
          )}
          <button 
            onClick={() => setCurrentView('history')} 
            className="w-11 h-11 rounded-[16px] flex items-center justify-center transition-all duration-300 border"
            style={{
              backgroundColor: currentView === 'history' ? `${activeTheme.primary}20` : 'rgba(255,255,255,0.05)',
              borderColor: currentView === 'history' ? activeTheme.primary : 'rgba(255,255,255,0.05)',
              color: currentView === 'history' ? '#ffffff' : 'rgba(255,255,255,0.7)'
            }}
          >
            <History className="w-4 h-4" />
          </button>
          <button 
            onClick={() => setShowSettingsModal(true)} 
            className="w-11 h-11 rounded-[16px] flex items-center justify-center transition-all duration-300 border"
            style={{
              backgroundColor: showSettingsModal ? `${activeTheme.primary}20` : 'rgba(255,255,255,0.05)',
              borderColor: showSettingsModal ? activeTheme.primary : 'rgba(255,255,255,0.05)',
              color: showSettingsModal ? '#ffffff' : 'rgba(255,255,255,0.7)'
            }}
            title="API Settings"
          >
            <Settings className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 px-5 pt-26 pb-12 overflow-y-auto">
        <AnimatePresence mode="wait">
          
          {/* VIEW: HOME (INPUT, TONE, DURATION) */}
          {currentView === 'home' && (
            <motion.div 
              key="home" 
              initial={{ opacity: 0, y: 15 }} 
              animate={{ opacity: 1, y: 0 }} 
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.3 }}
              className="space-y-6"
            >
              
              {/* Introduction Banner Card */}
              <div className="glass-card rounded-[24px] p-5 border border-white/10 bg-gradient-to-br from-[#121216]/90 to-[#0a0a0c]/90 relative overflow-hidden shadow-lg">
                <div 
                  className="absolute top-0 right-0 w-28 h-28 rounded-full blur-2xl transition-all duration-700"
                  style={{ backgroundColor: `${activeTheme.primary}12` }}
                ></div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs">✨</span>
                  <span className="text-[10px] font-black uppercase tracking-[0.2em] transition-all duration-500" style={{ color: activeTheme.primary }}>ORIGINAL STORY STUDIO</span>
                </div>
                <h2 className="text-lg font-black text-white leading-snug tracking-tight">ইউটিউব আইডিয়া থেকে সম্পূর্ণ চমৎকার নতুন কার্টুন গল্প তৈরি করুন!</h2>
              </div>


              {/* Story Prompt Input Box */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <FileText 
                      className="w-4 h-4 transition-all duration-500" 
                      style={{ color: activeTheme.primary }}
                    />
                    <label 
                      className="text-[10px] font-bold uppercase tracking-[0.2em] font-sans transition-all duration-500"
                      style={{ color: activeTheme.primary }}
                    >
                      গল্পের টপিক / স্ক্রিপ্ট আইডিয়া
                    </label>
                  </div>
                  <span className="text-[10px] text-white/40 bg-white/5 px-2 py-0.5 rounded-full font-bold">{storyInput.length} chars</span>
                </div>
                <div className="relative">
                  <textarea 
                    value={storyInput}
                    onChange={(e) => setStoryInput(e.target.value)}
                    className="w-full bg-[#151518]/90 border rounded-[22px] p-5 text-white/90 text-sm min-h-[160px] focus:outline-none focus:ring-1 transition-all placeholder:text-white/20 custom-scrollbar leading-relaxed" 
                    style={{ borderColor: 'rgba(255,255,255,0.1)' }}
                    placeholder="এখানে আপনার আইডিয়া বা কোনো গল্পের মূল কথা লিখুন... (যেমন: টুনি পাখির বুদ্ধি বা বোকা বাঘের মজার কান্ড)"
                  />
                  {storyInput && (
                    <button 
                      onClick={() => setStoryInput('')}
                      className="absolute bottom-4 right-4 bg-white/5 hover:bg-white/10 text-white/40 hover:text-white/60 rounded-full px-2 py-1 text-[10px] transition-colors"
                    >
                      Clear
                    </button>
                  )}
                </div>
              </div>

              {/* Language Selection */}
              <div className="space-y-3">
                <div className="flex items-center gap-1.5">
                  <span className="text-sm">🌐</span>
                  <label 
                    className="text-[10px] font-bold uppercase tracking-[0.2em] transition-all duration-500"
                    style={{ color: activeTheme.primary }}
                  >
                    গল্পের ভাষা (Story Language)
                  </label>
                </div>
                <div className="flex items-center gap-2 mb-1 px-1">
                  <span className="text-[10px] text-emerald-400 font-bold flex items-center gap-1">
                    <Check className="w-3 h-3" />
                    আঞ্চলিক ভাষা (Village Dialect) এখন স্বয়ংক্রিয়ভাবে সক্রিয়!
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: 'Bengali', label: 'বাংলা 🇧🇩' },
                    { id: 'English', label: 'English 🇺🇸' },
                    { id: 'Hindi', label: 'हिंदी 🇮🇳' }
                  ].map((lang) => {
                    const isSel = language === lang.id;
                    return (
                      <button
                        key={lang.id}
                        onClick={() => setLanguage(lang.id as any)}
                        type="button"
                        className={`py-3 rounded-xl border text-xs font-bold transition-all duration-300 cursor-pointer`}
                        style={{
                          backgroundColor: isSel ? activeTheme.primary : '#151518',
                          borderColor: isSel ? activeTheme.primary : 'rgba(255,255,255,0.05)',
                          color: isSel ? '#ffffff' : 'rgba(255,255,255,0.5)'
                        }}
                      >
                        {lang.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Format Selection */}
              <div className="space-y-3">
                <div className="flex items-center gap-1.5">
                  <span className="text-sm">🗣️</span>
                  <label 
                    className="text-[10px] font-bold uppercase tracking-[0.2em] transition-all duration-500"
                    style={{ color: activeTheme.primary }}
                  >
                    স্ক্রিপ্ট ফরম্যাট (Format Style)
                  </label>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: 'Dialogue', label: 'সংলাপ (Dialogue) 💬', desc: 'চরিত্র কথোপকথন' },
                    { id: 'Narration', label: 'বর্ণনা (Narration) 🎤', desc: 'একক ধারাভাষ্য' },
                    { id: 'Combined', label: 'ফুল স্ক্রিপ্ট (Combined) 🎬', desc: 'সংলাপ ও বর্ণনা মিশিয়ে' }
                  ].map((f) => {
                    const isSel = format === f.id;
                    return (
                      <button
                        key={f.id}
                        onClick={() => setFormat(f.id as any)}
                        type="button"
                        className={`p-2.5 rounded-xl border text-left transition-all duration-300 cursor-pointer flex flex-col justify-between h-[75px]`}
                        style={{
                          backgroundColor: isSel ? `${activeTheme.primary}12` : '#151518',
                          borderColor: isSel ? activeTheme.primary : 'rgba(255,255,255,0.05)',
                          boxShadow: isSel ? `0 4px 15px ${activeTheme.primary}20` : 'none'
                        }}
                      >
                        <div className="font-bold text-[10px]" style={{ color: isSel ? activeTheme.primary : 'rgba(255,255,255,0.8)' }}>{f.label}</div>
                        <div className="text-[8px] text-white/40 mt-1 leading-tight">{f.desc}</div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Category selector */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 transition-all duration-500" style={{ color: activeTheme.primary }} />
                    <label 
                      className="text-[10px] font-bold uppercase tracking-[0.2em] transition-all duration-500"
                      style={{ color: activeTheme.primary }}
                    >
                      ভিডিও ক্যাটাগরি (Category)
                    </label>
                  </div>
                  <span className="text-[9px] text-white/40 font-bold uppercase tracking-wider animate-pulse flex items-center gap-1">🌐 ডানে স্ক্রল করুন ➔</span>
                </div>
                <div className="flex gap-3 overflow-x-auto pb-3 pt-0.5 px-0.5 custom-scrollbar-horizontal snap-x snap-mandatory">
                  {[
                    { id: 'Moral', label: 'নৈতিক শিক্ষা ও লোককথা 🧚‍♂️', desc: 'শিক্ষণীয় বার্তা ও নীতিগল্প', color: 'bg-emerald-500/10 border-emerald-500 text-emerald-400 shadow-[0_4px_15px_rgba(16,185,129,0.15)]' },
                    { id: 'Horror', label: 'ভুতুড়ে রোমাঞ্চ (Horror) 👻', desc: 'ভীতিকর ও লোমহর্ষক আবহ', color: 'bg-red-500/10 border-red-500 text-red-400 shadow-[0_4px_15px_rgba(239,68,68,0.15)]' },
                    { id: 'Magic/Fantasy', label: 'জাদু ও রূপকথা (Fantasy) ✨', desc: 'উপকথা ও কাল্পনিক অ্যাডভেঞ্চার', color: 'bg-purple-500/10 border-purple-500 text-purple-400 shadow-[0_4px_15px_rgba(168,85,247,0.15)]' },
                    { id: 'Sci-Fi', label: 'মহাকাশ ও বিজ্ঞান কথাসাহিত্য 🚀', desc: 'ভবিষ্যত প্রযুক্তি ও সায়েন্স ফিকশন', color: 'bg-cyan-500/10 border-cyan-500 text-cyan-400 shadow-[0_4px_15px_rgba(6,182,212,0.15)]' },
                    { id: 'Comedic', label: 'হাস্যরসাত্মক ও মজার 😆', desc: 'মজার সংলাপ ও কৌতুকপূর্ণ কান্ড', color: 'bg-amber-500/10 border-amber-500 text-amber-400 shadow-[0_4px_15px_rgba(245,158,11,0.15)]' }
                  ].map((cat) => {
                    const isSel = category === cat.id;
                    return (
                      <button
                        key={cat.id}
                        onClick={() => setCategory(cat.id as any)}
                        type="button"
                        className={`text-left p-3.5 rounded-[18px] border transition-all duration-300 relative overflow-hidden cursor-pointer flex-shrink-0 w-[180px] snap-start ${isSel ? cat.color : 'bg-[#151518] border-white/5 hover:border-white/10 text-white/50'}`}
                      >
                        <div className="font-bold text-xs truncate">{cat.label}</div>
                        <div className="text-[9px] text-white/40 mt-1.5 leading-tight line-clamp-2 h-7">{cat.desc}</div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Duration choice with pacing specs */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <Clock className="w-4 h-4 transition-all duration-500" style={{ color: activeTheme.primary }} />
                    <label 
                      className="text-[10px] font-bold uppercase tracking-[0.2em] transition-all duration-500"
                      style={{ color: activeTheme.primary }}
                    >
                      ভিডিওর দৈর্ঘ্য ও দৃশ্যসংখ্যা (Duration)
                    </label>
                  </div>
                  <span className="text-[9px] text-white/40 font-bold uppercase tracking-wider animate-pulse flex items-center gap-1">⏱️ ডানে স্ক্রল করুন ➔</span>
                </div>
                
                <div className="flex gap-3 overflow-x-auto pb-3 pt-0.5 px-0.5 custom-scrollbar-horizontal snap-x snap-mandatory">
                  {[
                    { id: '5m', label: '5 Minutes', spec: '৩ চ্যাপ্টার (১২ পার্ট) - ~৬৫০ শব্দ' },
                    { id: '10m', label: '10 Minutes', spec: '৫ চ্যাপ্টার (২০ পার্ট) - ~১৩০০ শব্দ' },
                    { id: '15m', label: '15 Minutes', spec: '৭ চ্যাপ্টার (২৮ পার্ট) - ~১৯৫০ শব্দ' },
                    { id: '20m', label: '20 Minutes', spec: '৯ চ্যাপ্টার (৩৬ পার্ট) - ~২৬০০ শব্দ' },
                    { id: '25m', label: '25 Minutes', spec: '১১ চ্যাপ্টার (৪৪ পার্ট) - ~৩২৫০ শব্দ' },
                    { id: '30m', label: '30 Minutes', spec: '১৩ চ্যাপ্টার (৫২ পার্ট) - ~৩৯০০ শব্দ' },
                    { id: '40m', label: '40 Minutes', spec: '১৭ চ্যাপ্টার (৬৮ পার্ট) - ~৫২০০ শব্দ' }
                  ].map((t) => {
                    const isSel = duration === t.id;
                    return (
                      <button 
                        key={t.id}
                        onClick={() => setDuration(t.id)}
                        type="button"
                        className={`p-3.5 rounded-[18px] text-left border transition-all duration-300 cursor-pointer flex-shrink-0 w-[170px] snap-start`}
                        style={{
                          backgroundColor: isSel ? `${activeTheme.primary}15` : 'rgba(21,21,24,0.6)',
                          borderColor: isSel ? activeTheme.primary : 'rgba(255,255,255,0.05)',
                          color: isSel ? '#ffffff' : 'rgba(255,255,255,0.5)',
                          boxShadow: isSel ? `0 4px 15px ${activeTheme.primary}25` : 'none'
                        }}
                      >
                        <div className="font-bold text-xs flex items-center justify-between">
                          <span>{t.label}</span>
                          {isSel && <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: activeTheme.primary }} />}
                        </div>
                        <div className="text-[8px] font-semibold mt-1.5 leading-tight h-6 line-clamp-2" style={{ color: isSel ? 'rgba(255,255,255,0.8)' : 'rgba(255,255,255,0.45)' }}>{t.spec}</div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Trigger Button Logic: Analyzed -> Timeline Mapped -> Final Gen */}
              {!isAnalyzed ? (
                <button 
                  onClick={handleStartAnalysis}
                  type="button"
                  className="w-full text-white py-5 rounded-[22px] font-black uppercase tracking-[0.15em] text-xs flex items-center justify-center gap-3.5 transition-all duration-300 hover:scale-[1.01] hover:-translate-y-0.5 active:scale-95 shadow-xl mt-4 cursor-pointer"
                  style={{
                    background: `linear-gradient(135deg, ${activeTheme.primary}cc, ${activeTheme.primary})`,
                    boxShadow: `0 10px 30px ${activeTheme.primary}25`
                  }}
                >
                  <Sparkles className="w-4.5 h-4.5 text-white animate-pulse" />
                  তথ্য বিশ্লেষণ ও ক্যারেক্টার প্ল্যান করুন (Analyze)
                </button>
              ) : isTimelineMapped ? (
                <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
                  {/* Timeline Result Card (Step 3) */}
                  <div className="glass-card rounded-[22px] p-5 border border-white/5 bg-[#121215]/60">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></div>
                        <span className="text-[10px] font-black uppercase tracking-wider text-emerald-400">মাস্টার স্টোরি আউটলাইন সম্পন্ন (Story Outline Mapped)</span>
                      </div>
                      <div className="flex gap-2">
                        <span className="text-[8px] font-bold bg-white/5 px-1.5 py-0.5 rounded text-white/40">{timelineData?.total_chapters} চ্যাপ্টার</span>
                        <span className="text-[8px] font-bold bg-white/5 px-1.5 py-0.5 rounded text-white/40">{timelineData?.total_scenes} পার্টস</span>
                      </div>
                    </div>
                    
                    <div className="space-y-4 max-h-[320px] overflow-y-auto pr-1 custom-scrollbar">
                      {timelineData?.chapters?.map((chapter: any, chapIdx: number) => (
                        <div key={chapIdx} className="space-y-2.5">
                          <div className="flex items-center gap-2 sticky top-0 bg-[#121215] z-10 py-1.5">
                            <span className="text-[10px] font-black uppercase text-white/40 tracking-[0.2em]">Chapter {chapter.chapter_number}</span>
                            <div className="flex-1 h-[1px] bg-white/10"></div>
                            <span className="text-[10px] font-black text-[#7c79e5]">{chapter.chapter_title}</span>
                          </div>
                          <div className="grid grid-cols-1 gap-2.5 pl-2 border-l border-white/5">
                            {chapter.parts?.map((part: any, pIdx: number) => {
                              const isEditing = editingOutline?.chapIdx === chapIdx && editingOutline?.pIdx === pIdx;
                              return (
                                <div key={pIdx} className="flex flex-col gap-2 p-3.5 rounded-[18px] bg-white/5 border border-white/5 hover:bg-white/[0.08] transition-all group relative">
                                  <div className="flex items-center justify-between">
                                    <span className="text-[9px] font-black text-white/20 uppercase tracking-widest">Part {part.part_number}</span>
                                    <div className="flex items-center gap-2">
                                      <span className="text-[10px] font-bold text-white/70">{part.part_title}</span>
                                      <button 
                                        onClick={() => handleCopyText(part.detailed_outline, 'block', `part_copy_${chapIdx}_${pIdx}`)}
                                        className="transition-opacity p-1 bg-white/10 rounded-md hover:bg-white/20 border border-white/10"
                                      >
                                        {copiedId === `part_copy_${chapIdx}_${pIdx}` ? <Check className="w-2.5 h-2.5 text-green-400" /> : <Copy className="w-2.5 h-2.5 text-white/50" />}
                                      </button>
                                      <button 
                                        onClick={() => handleEditOutline(chapIdx, pIdx, part.detailed_outline)}
                                        className="transition-opacity p-1 bg-white/10 rounded-md hover:bg-white/20 border border-white/10"
                                      >
                                        <Edit3 className="w-2.5 h-2.5 text-white/50" />
                                      </button>
                                    </div>
                                  </div>
                                  {isEditing ? (
                                    <div className="space-y-2 mt-1">
                                      <textarea 
                                        value={outlineText}
                                        onChange={(e) => setOutlineText(e.target.value)}
                                        className="w-full bg-black/40 border border-white/10 rounded-lg p-2 text-[11px] text-white/90 min-h-[80px] focus:outline-none focus:border-emerald-500/50"
                                      />
                                      <div className="flex justify-end gap-2">
                                        <button onClick={() => setEditingOutline(null)} className="px-2 py-1 text-[9px] text-white/40 hover:text-white">Cancel</button>
                                        <button onClick={saveOutlineEdit} className="px-3 py-1 text-[9px] bg-emerald-500/20 text-emerald-400 rounded-md border border-emerald-500/30">Save Outline</button>
                                      </div>
                                    </div>
                                  ) : (
                                    <p className="text-[11px] text-white/50 leading-relaxed font-medium">
                                      {part.detailed_outline}
                                    </p>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <button 
                    onClick={handleFinalizeProduction}
                    type="button"
                    className="w-full text-white py-5 rounded-[22px] font-black uppercase tracking-[0.15em] text-xs flex items-center justify-center gap-3.5 transition-all duration-300 hover:scale-[1.01] hover:-translate-y-0.5 active:scale-95 shadow-xl cursor-pointer"
                    style={{
                      background: `linear-gradient(135deg, ${activeTheme.primary}, #151518)`,
                      boxShadow: `0 10px 30px ${activeTheme.primary}15`
                    }}
                  >
                    <Clapperboard className="w-4.5 h-4.5 text-white" />
                    সম্পূর্ণ মূল চিত্রনাট্য তৈরি শুরু করুন (Final Script)
                  </button>

                  <button 
                    onClick={() => { setIsTimelineMapped(false); setTimelineData(null); }}
                    className="w-full py-3 text-[10px] font-bold uppercase tracking-widest text-white/30 hover:text-white/60 transition-colors"
                  >
                    টাইমলাইন পরিবর্তন করতে চান? (Reset Timeline)
                  </button>
                </div>
              ) : (
                <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
                  {/* Analysis Result Card (Step 2) */}
                  <div className="glass-card rounded-[22px] p-5 border border-white/5 bg-[#121215]/60">
                    <div className="flex items-center gap-2 mb-4">
                      <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse"></div>
                      <span className="text-[10px] font-black uppercase tracking-wider text-green-400">বিশ্লেষণ সম্পন্ন হয়েছে! (Analysis Success)</span>
                    </div>
                    
                    <div className="space-y-4">
                      {/* Character Preview */}
                      <div>
                        <span className="text-[9px] font-bold text-white/40 uppercase block mb-2">ক্যারেক্টার প্রোফাইল (Characters)</span>
                        <div className="flex flex-wrap gap-2">
                          {analysisData?.character_profiles?.map((char: any, i: number) => {
                            const isEditing = editingCharIdx === i;
                            
                            return (
                              <div key={i} className="bg-white/5 border border-white/5 px-3 py-1.5 rounded-lg flex items-center gap-2 group/char relative min-h-[40px]">
                                {isEditing ? (
                                  <div className="flex items-center gap-1 animate-in zoom-in-95 duration-200">
                                    <input 
                                      autoFocus
                                      className="bg-black/40 border border-emerald-500/50 rounded-md px-1.5 py-1 text-[10px] text-white focus:outline-none focus:ring-1 focus:ring-emerald-500/30 w-[90px]"
                                      value={tempCharName}
                                      onChange={(e) => setTempCharName(e.target.value)}
                                      onKeyDown={(e) => {
                                        if (e.key === 'Enter') handleRenameCharacter(i, tempCharName);
                                        if (e.key === 'Escape') setEditingCharIdx(null);
                                      }}
                                      placeholder="Character name"
                                    />
                                    <button 
                                      onClick={() => handleRenameCharacter(i, tempCharName)} 
                                      className="p-1.5 bg-emerald-500/20 hover:bg-emerald-500/30 rounded-md border border-emerald-500/30 transition-colors"
                                    >
                                      <Check className="w-3 h-3 text-emerald-400" />
                                    </button>
                                  </div>
                                ) : (
                                  <div className="flex items-center gap-3">
                                    <div>
                                      <div className="text-[10px] font-bold text-white">{char.name}</div>
                                      <div className="text-[8px] text-white/40">{char.role}</div>
                                    </div>
                                    <div className="flex items-center gap-1.5 opacity-100 transition-opacity">
                                      <button 
                                        onClick={() => { setEditingCharIdx(i); setTempCharName(char.name); }}
                                        className="p-1 bg-white/10 hover:bg-white/20 rounded-md border border-white/5 transition-colors"
                                        title="Rename Character / ক্যারেক্টার নাম পরিবর্তন করুন"
                                      >
                                        <Edit3 className="w-2.5 h-2.5 text-white/50 hover:text-white" />
                                      </button>
                                      <button 
                                        onClick={() => handleCopyText(`${char.name}: ${char.role}`, 'block', `char_${i}`)}
                                        className="p-1 bg-white/10 hover:bg-white/20 rounded-md border border-white/5 transition-colors"
                                      >
                                        {copiedId === `char_${i}` ? <Check className="w-2.5 h-2.5 text-green-400" /> : <Copy className="w-2.5 h-2.5 text-white/50" />}
                                      </button>
                                    </div>
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>

                      {/* Map/Climax Preview */}
                      <div className="p-3 rounded-xl bg-white/5 border border-white/5 relative group/climax">
                        <span className="text-[9px] font-bold text-white/40 uppercase block mb-1.5">গল্পের মূল টুইস্ট ও মোড় (Climax Mapping)</span>
                        <p className="text-[11px] text-white/80 leading-relaxed italic">"{analysisData?.plot_analysis?.climax_description}"</p>
                        <button 
                          onClick={() => handleCopyText(analysisData?.plot_analysis?.climax_description, 'block', 'climax_copy')}
                          className="absolute right-2 top-2 transition-opacity p-1.5 bg-black/40 rounded-lg hover:bg-black/60 border border-white/10"
                        >
                          {copiedId === 'climax_copy' ? <Check className="w-3 h-3 text-green-400" /> : <Copy className="w-3 h-3 text-white/50" />}
                        </button>
                      </div>
                    </div>
                  </div>

                  <button 
                    onClick={handleMapTimeline}
                    type="button"
                    className="w-full text-white py-5 rounded-[22px] font-black uppercase tracking-[0.15em] text-xs flex items-center justify-center gap-3.5 transition-all duration-300 hover:scale-[1.01] hover:-translate-y-0.5 active:scale-95 shadow-xl cursor-pointer"
                    style={{
                      background: `linear-gradient(135deg, ${activeTheme.primary}, #151518)`,
                      boxShadow: `0 10px 30px ${activeTheme.primary}15`
                    }}
                  >
                    <ListTree className="w-4.5 h-4.5 text-white" />
                    স্টোরি আউটলাইন ও দৃশ্য বিন্যাস করুন (Story Outline)
                  </button>
                  
                  <button 
                    onClick={() => { setIsAnalyzed(false); setAnalysisData(null); }}
                    className="w-full py-3 text-[10px] font-bold uppercase tracking-widest text-white/30 hover:text-white/60 transition-colors"
                  >
                    আবার বিশ্লেষণ করতে চান? (Reset Analysis)
                  </button>
                </div>
              )}

            </motion.div>
          )}
          {currentView === 'script' && production && (
            <motion.div 
              key="script" 
              initial={{ opacity: 0, x: 20 }} 
              animate={{ opacity: 1, x: 0 }} 
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
              className="space-y-6"
            >
              
              {/* Back to Input & Content Header */}
              <div className="flex items-start justify-between">
                <div>
                  <span className="text-[9px] font-bold tracking-[0.2em] uppercase transition-all duration-500" style={{ color: activeTheme.primary }}>Phase 1: Story Layout</span>
                  <h2 className="text-2xl font-black text-white leading-tight mt-1 tracking-tight">{production.story_title}</h2>
                  <div className="flex items-center gap-2 mt-2">
                    <span className="text-[10px] bg-white/5 border border-white/5 text-white/50 px-2 py-0.5 rounded-full font-bold">⏱️ {production.duration} Video</span>
                    <span className="text-[10px] bg-white/5 border border-white/5 text-white/50 px-2 py-0.5 rounded-full font-bold">✨ Category: {production.category || 'Moral'}</span>
                    <span 
                      className="text-[10px] border px-2 py-0.5 rounded-full font-bold transition-all duration-500"
                      style={{
                        backgroundColor: `${activeTheme.primary}15`,
                        borderColor: `${activeTheme.primary}25`,
                        color: activeTheme.primary
                      }}
                    >
                      🌐 {production.language || 'Bengali'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Stats Card */}
              <div className="grid grid-cols-2 gap-3">
                <div className="glass-card p-4 rounded-2xl flex flex-col justify-center">
                  <div className="text-[9px] text-white/40 uppercase font-bold tracking-wider">মোট চ্যাপ্টার</div>
                  <div className="text-2xl font-black mt-0.5 transition-all duration-500" style={{ color: activeTheme.primary }}>
                    {production.total_chapters || production.chapters?.length || 0} <span className="text-xs font-normal text-white/50">Chapters</span>
                  </div>
                </div>
                <div className="glass-card p-4 rounded-2xl flex flex-col justify-center">
                  <div className="text-[9px] text-white/40 uppercase font-bold tracking-wider">ভয়েস ডিউরেশান (Voice)</div>
                  <div className="text-sm font-black mt-1 transition-all duration-500" style={{ color: activeTheme.primary }}>
                    ⏱️ {production.total_spoken_duration || production.duration || "N/A"}
                  </div>
                </div>
              </div>

              {/* Chapter Selector Tabs */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-2 scrollbar-none">
                <button
                  type="button"
                  onClick={() => setActiveChapterIndex(-1)}
                  className="px-4 py-2 text-xs font-bold rounded-xl border transition-all duration-300 flex-shrink-0"
                  style={{
                    backgroundColor: activeChapterIndex === -1 ? activeTheme.primary : 'rgba(21,21,24,0.6)',
                    borderColor: activeChapterIndex === -1 ? activeTheme.primary : 'rgba(255,255,255,0.05)',
                    color: activeChapterIndex === -1 ? '#ffffff' : 'rgba(255,255,255,0.4)'
                  }}
                >
                  📖 সম্পূর্ণ গল্প (Full Read)
                </button>
                {(production?.chapters || []).map((ch, idx) => (
                  <button
                    key={ch.chapter_number || idx}
                    type="button"
                    onClick={() => setActiveChapterIndex(idx)}
                    className="px-4 py-2 text-xs font-bold rounded-xl border transition-all duration-300 flex-shrink-0"
                    style={{
                      backgroundColor: activeChapterIndex === idx ? activeTheme.primary : 'rgba(21,21,24,0.6)',
                      borderColor: activeChapterIndex === idx ? activeTheme.primary : 'rgba(255,255,255,0.05)',
                      color: activeChapterIndex === idx ? '#ffffff' : 'rgba(255,255,255,0.4)'
                    }}
                  >
                    🎬 চ্যাপ্টার {ch.chapter_number || idx + 1}
                  </button>
                ))}
              </div>

              {/* Story Narrative block */}
              <div 
                className="glass-card rounded-[28px] p-6 relative bg-gradient-to-br from-[#121215] to-[#0a0a0c] border transition-all duration-500"
                style={{ borderColor: `${activeTheme.primary}22` }}
              >
                <div className="flex items-center justify-between mb-4 border-b border-white/5 pb-3">
                  <span className="text-xs font-black text-white/80 flex items-center gap-2">
                    <FileText className="w-4 h-4" style={{ color: activeTheme.primary }} />
                    {activeChapterIndex === -1 ? "সম্পূর্ণ গল্পের স্ক্রিপ্ট" : `চ্যাপ্টার ${production.chapters?.[activeChapterIndex]?.chapter_number || activeChapterIndex+1}: ${production.chapters?.[activeChapterIndex]?.chapter_title || ""}`}
                  </span>
                  
                  <div className="flex items-center gap-2">
                    {/* narration playback player */}
                    <button 
                      type="button"
                      onClick={handleToggleFullStoryPlay}
                      className={`text-xs px-2.5 py-1.5 rounded-xl border flex items-center gap-1 transition-all ${fullStoryPlaying ? 'bg-red-500/10 border-red-500/20 text-red-400' : 'bg-white/5 border-white/5 hover:bg-white/10 text-white/60'}`}
                    >
                      {fullStoryPlaying ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
                      {fullStoryPlaying ? 'Stop' : 'শুনুন'}
                    </button>
                    
                    <button 
                      type="button"
                      onClick={() => handleCopyText(getFullStoryText(), 'story')} 
                      className="text-white/40 hover:text-white p-1 rounded-lg hover:bg-white/5 transition-colors"
                    >
                      {storyCopied ? <Check className="text-green-400 w-4 h-4" /> : <Copy className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div className="text-white/80 leading-relaxed text-[15px] whitespace-pre-wrap max-h-[380px] overflow-y-auto pr-2 custom-scrollbar font-sans space-y-4">
                  {activeChapterIndex === -1 ? (
                    (production?.chapters || []).map((ch, idx) => (
                      <div key={idx} className="space-y-4 border-b border-white/5 pb-4 last:border-0 last:pb-0">
                        <h4 className="text-sm font-black transition-all duration-500 uppercase tracking-widest" style={{ color: activeTheme.primary }}>Chapter {ch.chapter_number || idx + 1}: {ch.chapter_title}</h4>
                        <div className="space-y-4 pl-2 border-l border-white/5">
                          {(ch.parts || ch.scenes || []).map((p: any) => (
                            <div key={p.scene_number || p.part_number} className="space-y-1.5">
                              <span className="text-[10px] font-black text-white/20 uppercase tracking-widest block">Scene {p.scene_number || p.part_number}</span>
                              <p className="text-[11px] text-white/40 italic mb-1">{p.scene_description || p.part_description}</p>
                              <div className="space-y-1">
                                {p.lines?.map((line: any, lIdx: number) => (
                                  <div key={lIdx} className="text-xs flex gap-2">
                                    <span className="font-bold text-white/50 min-w-[60px]">{line.character}:</span>
                                    <span className="text-white/85">"{line.text}"</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="space-y-4">
                      <h4 className="text-sm font-black transition-all duration-500 uppercase tracking-widest" style={{ color: activeTheme.primary }}>
                        Chapter {production?.chapters?.[activeChapterIndex]?.chapter_number || activeChapterIndex + 1}: {production?.chapters?.[activeChapterIndex]?.chapter_title}
                      </h4>
                      <div className="space-y-4 pl-2 border-l border-white/5">
                        {(production?.chapters?.[activeChapterIndex]?.parts || production?.chapters?.[activeChapterIndex]?.scenes || []).map((p: any) => (
                          <div key={p.scene_number || p.part_number} className="space-y-1.5">
                            <span className="text-[10px] font-black text-white/20 uppercase tracking-widest block">Scene {p.scene_number || p.part_number}</span>
                            <p className="text-[11px] text-white/40 italic mb-1">{p.scene_description || p.part_description}</p>
                            <div className="space-y-1">
                              {p.lines?.map((line: any, lIdx: number) => (
                                <div key={lIdx} className="text-xs flex gap-2">
                                  <span className="font-bold text-white/50 min-w-[60px]">{line.character}:</span>
                                  <span className="text-white/85">"{line.text}"</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Go to Cinematic Script tab trigger */}
              <button 
                type="button"
                onClick={() => {
                  setActiveChapterIndex(0);
                  setCurrentView('cinematic');
                }}
                className="w-full text-white py-5 rounded-[22px] font-black uppercase text-xs tracking-wider flex items-center justify-center gap-2 active:scale-98 shadow-lg transition-all duration-300"
                style={{
                  background: `linear-gradient(135deg, ${activeTheme.primary}cc, ${activeTheme.primary})`,
                  boxShadow: `0 10px 30px ${activeTheme.primary}25`
                }}
              >
                <Clapperboard className="w-4.5 h-4.5" />
                সংলাপ ও ভয়েস সিন্টিসাইজার দেখুন
              </button>

            </motion.div>
          )}

          {/* VIEW: CINEMATIC DIALOGUE SCRIPT */}
          {currentView === 'cinematic' && production && (
            <motion.div 
              key="cinematic" 
              initial={{ opacity: 0, x: 20 }} 
              animate={{ opacity: 1, x: 0 }} 
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
              className="space-y-6"
            >
              
              <div className="flex items-center justify-between pb-2">
                <div>
                  <span className="text-[9px] font-bold tracking-[0.2em] uppercase transition-all duration-500" style={{ color: activeTheme.primary }}>Phase 2: Animated Voice & Dialogues</span>
                  <h2 className="text-xl font-black text-white tracking-tight mt-1">সংলাপ ও নেপথ্য কণ্ঠ</h2>
                </div>
                <div className="flex items-center gap-2">
                  <button 
                    type="button"
                    onClick={() => {
                      // Gather all lines from all chapters
                      const allLines: StoryLine[] = [];
                      production.chapters.forEach(ch => {
                        const parts = ch.parts || ch.scenes || [];
                        parts.forEach(p => {
                          if (p.lines) allLines.push(...p.lines);
                        });
                      });
                      playFullSceneAudio(allLines);
                    }}
                    className={`px-3 py-1.5 rounded-xl border text-[10px] font-bold uppercase flex items-center gap-1 transition-all ${isPlayingFullScene ? 'bg-red-500/10 border-red-500/20 text-red-400' : 'bg-[#10b981]/10 border-[#10b981]/20 text-[#10b981] hover:bg-[#10b981]/20'}`}
                  >
                    {isPlayingFullScene ? <Square className="w-3 h-3" /> : <PlayCircle className="w-3 h-3" />}
                    {isPlayingFullScene ? 'শব্দ থামান' : 'সবগুলো শুনুন'}
                  </button>
                  <button 
                    type="button"
                    onClick={() => handleCopyText(getFullStoryText(), 'script')}
                    className="px-3 py-1.5 bg-white/5 border border-white/5 hover:border-white/10 rounded-xl text-[10px] font-bold uppercase text-white/60 flex items-center gap-1 transition-colors"
                  >
                  {scriptCopied ? <Check className="text-green-400  w-3 h-3" /> : <Copy className="w-3 h-3" />}
                  {scriptCopied ? 'কпи সফল' : 'সব কপি'}
                </button>
              </div>
            </div>

              {/* Custom Cartoon Voice synthesis settings panel */}
              <div 
                className="glass-card rounded-[22px] p-4.5 bg-[#151518]/40 space-y-3.5 border transition-all duration-500"
                style={{ borderColor: `${activeTheme.primary}20` }}
              >
                <div className="flex items-center justify-between border-b border-white/5 pb-2">
                  <div className="flex items-center gap-1.5">
                    <Sliders className="w-4 h-4" style={{ color: activeTheme.primary }} />
                    <span className="text-[10px] font-black uppercase tracking-wider text-white/95">কার্টুন ভয়েস কাস্টমাইজেশন টুল</span>
                  </div>
                  <Settings className="w-3.5 h-3.5 text-white/30 animate-spin" />
                </div>

                <div className="space-y-3">
                  {/* Prebuilt voices choice */}
                  <div>
                    <label className="text-[9px] text-white/40 block font-bold uppercase mb-1">এআই ভয়েস মডেল জেন্ডার</label>
                    <div className="grid grid-cols-4 gap-1.5">
                      {[
                        { id: 'Kore', label: '👩 Kore' },
                        { id: 'Puck', label: '👦 Puck' },
                        { id: 'Fenrir', label: '👹 Fenrir' },
                        { id: 'Zephyr', label: '🎙️ Zephyr' }
                      ].map(v => {
                        const isSel = selectedVoice === v.id;
                        return (
                          <button
                            key={v.id}
                            type="button"
                            onClick={() => setSelectedVoice(v.id)}
                            className="py-1.5 px-1 bg-[#101012] border rounded-lg text-[9px] font-bold text-center transition-all duration-300"
                            style={{
                              borderColor: isSel ? activeTheme.primary : 'rgba(255,255,255,0.05)',
                              color: isSel ? '#ffffff' : 'rgba(255,255,255,0.5)',
                              backgroundColor: isSel ? `${activeTheme.primary}15` : 'transparent'
                            }}
                          >
                            {v.label}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Pitch / Pitch control allows voice to sound funny or like comic cartoons! */}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <div className="flex justify-between text-[9px] text-white/40 font-bold uppercase mb-1">
                        <span>কার্টুন পিচ (গলার স্বর)</span>
                        <span style={{ color: activeTheme.primary }}>{speechPitch}x</span>
                      </div>
                      <input 
                        type="range" 
                        min="0.5" 
                        max="2.0" 
                        step="0.1" 
                        value={speechPitch} 
                        onChange={(e) => setSpeechPitch(parseFloat(e.target.value))}
                        className="w-full"
                        style={{ accentColor: activeTheme.primary }}
                      />
                    </div>
                    <div>
                      <div className="flex justify-between text-[9px] text-white/40 font-bold uppercase mb-1">
                        <span>পড়ার গতি (Pacing)</span>
                        <span style={{ color: activeTheme.primary }}>{speechRate}x</span>
                      </div>
                      <input 
                        type="range" 
                        min="0.5" 
                        max="1.8" 
                        step="0.1" 
                        value={speechRate} 
                        onChange={(e) => setSpeechRate(parseFloat(e.target.value))}
                        className="w-full"
                        style={{ accentColor: activeTheme.primary }}
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Chapter Selector Tabs */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-2 scrollbar-none border-b border-white/5">
                {(production.chapters || []).map((ch, idx) => (
                  <div key={ch.chapter_number} className="relative group/tab flex-shrink-0">
                    <button
                      type="button"
                      onClick={() => setActiveChapterIndex(idx >= 0 ? idx : 0)}
                      className="px-4 py-2 text-xs font-bold rounded-xl border transition-all duration-300 pr-9"
                      style={{
                        backgroundColor: activeChapterIndex === idx ? activeTheme.primary : 'rgba(21,21,24,0.6)',
                        borderColor: activeChapterIndex === idx ? activeTheme.primary : 'rgba(255,255,255,0.05)',
                        color: activeChapterIndex === idx ? '#ffffff' : 'rgba(255,255,255,0.4)'
                      }}
                    >
                      🎬 চ্যাপ্টার {ch.chapter_number}
                    </button>
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        // Copy Chapter title + all lines in it
                        const chapterText = `Chapter ${ch.chapter_number}: ${ch.chapter_title}\n` + 
                          (ch.parts || ch.scenes || []).map(p => {
                            const sceneDesc = `Scene ${p.scene_number}\nDescription: ${p.scene_description}\n`;
                            const lines = (p.lines || []).map(l => `${l.character}: ${l.text}`).join("\n");
                            return sceneDesc + lines;
                          }).join("\n\n");
                        handleCopyText(chapterText, 'block', `copy_chap_${idx}`);
                      }}
                      className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 bg-black/20 rounded-lg hover:bg-black/40 border border-white/10 opacity-0 group-hover/tab:opacity-100 transition-opacity"
                      title="Copy Entire Chapter"
                    >
                      {copiedId === `copy_chap_${idx}` ? <Check className="w-2.5 h-2.5 text-green-400" /> : <Copy className="w-2.5 h-2.5 text-white/40" />}
                    </button>
                  </div>
                ))}
              </div>

              {/* Dynamic Line-by-Line storyboard / script list */}
              <div className="space-y-6 max-h-[520px] overflow-y-auto pr-1.5 custom-scrollbar">
                {production.chapters && production.chapters[activeChapterIndex] && 
                 (production.chapters[activeChapterIndex].parts || production.chapters[activeChapterIndex].scenes) ? (
                  (production.chapters[activeChapterIndex].parts || production.chapters[activeChapterIndex].scenes || []).map((scene, sIdx) => {
                    return (
                      <div 
                        key={scene.scene_number}
                        className="glass-card rounded-[22px] p-5 border border-white/5 bg-[#121215]/80 hover:border-white/10 transition-all space-y-4 relative group"
                      >
                        <div className="flex items-center justify-between border-b border-white/5 pb-2">
                           <div className="flex items-center gap-3">
                             <span 
                                className="inline-flex items-center gap-1 border px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider transition-all duration-500"
                                style={{
                                  backgroundColor: `${activeTheme.primary}15`,
                                  borderColor: `${activeTheme.primary}25`,
                                  color: activeTheme.primary
                                }}
                              >
                                🎬 সিন {scene.scene_number} (Scene)
                              </span>
                              <button 
                                onClick={() => playFullSceneAudio(scene.lines || [])}
                                className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-[9px] font-bold uppercase transition-all ${isPlayingFullScene ? 'bg-red-500/20 text-red-400 border border-red-500/30' : 'bg-white/5 text-white/60 border border-white/10 hover:bg-white/10'}`}
                              >
                                {isPlayingFullScene ? <Square className="w-2.5 h-2.5 fill-current" /> : <PlayCircle className="w-2.5 h-2.5" />}
                                {isPlayingFullScene ? 'শব্দ থামান' : 'ফুল সিন অডিও'}
                              </button>
                           </div>
                             <div className="flex items-center gap-2">
                               <button 
                                type="button"
                                onClick={() => handleCopyText(scene.scene_description, 'block', scene.scene_number + 1000)}
                                className="bg-white/5 hover:bg-white/10 p-1 rounded-lg text-white/30 hover:text-white/60 transition-colors"
                                title="Copy Scene Description"
                              >
                                {copiedId === scene.scene_number + 1000 ? <Check className="w-3 h-3 text-green-400" /> : <Copy className="w-3 h-3" />}
                              </button>
                             </div>
                        </div>

                        {/* Scene Description */}
                        <div className="p-3.5 bg-white/3 rounded-[16px] border border-white/5">
                           <span className="text-[8px] font-black text-white/20 uppercase tracking-widest block mb-1.5">দৃশ্য বর্ণনা (Visual Setup)</span>
                           <p className="text-[12px] text-white/60 italic leading-relaxed">{scene.scene_description}</p>
                        </div>

                        {/* Dialogue Lines */}
                        <div className="space-y-2.5">
                          {scene.lines?.map((line, lIdx) => {
                             const uniqueLineId = `line_${activeChapterIndex}_${scene.scene_number}_${lIdx}`;
                             const isSFX = line.type === 'sfx' || line.character === 'SFX NOTE';
                             const isNarration = line.type === 'narration' || line.character === 'Narrator' || line.character === 'বর্ণনাকারী';
                             const isEditing = editingScriptLine?.sceneIdx === sIdx && editingScriptLine?.lineIdx === lIdx;
                             
                             return (
                               <div key={lIdx} className={`p-3 rounded-xl flex items-start gap-3 transition-all ${isSFX ? 'bg-amber-500/5 border border-amber-500/10' : isNarration ? 'bg-blue-500/5 border border-blue-500/10' : 'bg-white/5 border border-white/5 hover:bg-white/10'}`}>
                                  <div className="flex-1">
                                    <div className="flex items-center justify-between mb-1">
                                      <span className={`text-[10px] font-black uppercase tracking-tighter ${isSFX ? 'text-amber-400' : isNarration ? 'text-blue-400' : ''}`} style={{ color: (isSFX || isNarration) ? '' : activeTheme.primary }}>
                                        {line.character}
                                      </span>
                                      <div className="flex items-center gap-2">
                                        <button 
                                          onClick={() => handleEditScriptLine(sIdx, lIdx, line.text)}
                                          className="text-[9px] text-white/20 hover:text-white/50 transition-colors"
                                        >
                                          <Edit3 className="w-2.5 h-2.5" />
                                        </button>
                                        <span className="text-[9px] font-mono text-white/20">{line.duration}</span>
                                      </div>
                                    </div>
                                    {isEditing ? (
                                      <div className="space-y-2 mt-1">
                                        <textarea 
                                          value={scriptLineText}
                                          onChange={(e) => setScriptLineText(e.target.value)}
                                          className="w-full bg-black/40 border border-white/10 rounded-lg p-2 text-[12px] text-white/90 min-h-[60px] focus:outline-none focus:border-blue-500/50"
                                        />
                                        <div className="flex justify-end gap-2">
                                          <button onClick={() => setEditingScriptLine(null)} className="px-2 py-0.5 text-[9px] text-white/40 hover:text-white">Cancel</button>
                                          <button onClick={saveScriptLineEdit} className="px-2 py-0.5 text-[9px] bg-blue-500/20 text-blue-400 rounded-md border border-blue-500/30">Save</button>
                                        </div>
                                      </div>
                                    ) : (
                                      <p className={`text-sm ${isSFX ? 'text-amber-400/80 font-bold italic' : isNarration ? 'text-blue-100/90 italic font-medium' : 'text-white/90'}`}>
                                        {isSFX ? line.text : isNarration ? line.text : `"${line.text}"`}
                                      </p>
                                    )}
                                  </div>
                                  <div className="flex flex-col gap-2 flex-shrink-0">
                                    {!isSFX && !isEditing && (
                                      <button 
                                        type="button"
                                        onClick={() => handleVoiceSynthesis(uniqueLineId, line.text)}
                                        className="w-8 h-8 rounded-full flex items-center justify-center transition-all duration-300"
                                        style={{
                                          backgroundColor: playingId === uniqueLineId ? 'rgba(239, 68, 68, 0.2)' : `${activeTheme.primary}20`,
                                          color: playingId === uniqueLineId ? '#f87171' : activeTheme.primary
                                        }}
                                      >
                                        {playingId === uniqueLineId ? <VolumeX className="w-3.5 h-3.5 animate-pulse" /> : <Volume2 className="w-3.5 h-3.5" />}
                                      </button>
                                    )}
                                    {!isEditing && (
                                      <button 
                                        type="button"
                                        onClick={() => handleCopyText(line.text, 'block', `line_copy_${uniqueLineId}`)}
                                        className="w-8 h-8 rounded-full flex items-center justify-center bg-white/5 hover:bg-white/10 text-white/30 hover:text-white/50 transition-all border border-white/5"
                                        title="Copy Dialogue"
                                      >
                                        {copiedId === `line_copy_${uniqueLineId}` ? <Check className="w-3 h-3 text-green-400" /> : <Copy className="w-3 h-3" />}
                                      </button>
                                    )}
                                  </div>
                               </div>
                             );
                          })}
                        </div>

                        {/* Cinematic details & Extra Meta */}
                        <div className="pt-3 border-t border-white/5 space-y-2.5">
                           <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                             {/* Camera Movement */}
                             <div className="flex flex-col gap-0.5 bg-black/20 p-3 rounded-[12px] border border-white/5 relative hover:border-white/10 transition-colors">
                                <span className="text-[8px] text-white/30 uppercase font-black tracking-widest">🎥 ক্যামেরা মুভমেন্ট (Camera)</span>
                                <span className="text-[10px] text-white/70 font-bold pr-8">{scene.camera_movement}</span>
                                <button 
                                  type="button"
                                  onClick={() => handleCopyText(scene.camera_movement || '', 'prompt', `cam_${scene.scene_number}`)}
                                  className="absolute right-2 top-1/2 -translate-y-1/2 transition-all p-1.5 bg-white/10 rounded-lg hover:bg-white/20 border border-white/5"
                                  title="Copy Camera Movement"
                                >
                                  {copiedId === `cam_${scene.scene_number}` ? <Check className="w-3 h-3 text-green-400" /> : <Copy className="w-3 h-3 text-white/50" />}
                                </button>
                              </div>

                              {/* BGM Info */}
                              <div className="flex flex-col gap-0.5 bg-black/20 p-3 rounded-[12px] border border-white/5 relative hover:border-white/10 transition-colors">
                                <span className="text-[8px] text-white/30 uppercase font-black tracking-widest">🎵 ব্যাকগ্রাউন্ড মিউজিক (BGM)</span>
                                <span className="text-[10px] text-white/70 font-bold pr-8">{scene.bgm_tag || "Atmospheric Cinematic BGM"}</span>
                                <button 
                                  type="button"
                                  onClick={() => handleCopyText(scene.bgm_tag || 'Atmospheric Cinematic BGM', 'prompt', `bgm_${scene.scene_number}`)}
                                  className="absolute right-2 top-1/2 -translate-y-1/2 transition-all p-1.5 bg-white/10 rounded-lg hover:bg-white/20 border border-white/5"
                                  title="Copy BGM Description"
                                >
                                  {copiedId === `bgm_${scene.scene_number}` ? <Check className="w-3 h-3 text-green-400" /> : <Copy className="w-3 h-3 text-white/50" />}
                                </button>
                              </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                              {/* Character Actions/Movements */}
                              <div className="flex flex-col gap-0.5 bg-black/20 p-3 rounded-[12px] border border-white/5 group/action relative hover:border-white/10 transition-colors">
                                <span className="text-[8px] text-white/30 uppercase font-black tracking-widest">🏃 চরিত্রের কাজ ও মুভমেন্ট (Actions)</span>
                                <span className="text-[10px] text-white/70 font-bold pr-8">{scene.character_movement || "Static pose."}</span>
                                <button 
                                  type="button"
                                  onClick={() => handleCopyText(scene.character_movement || 'Static pose.', 'prompt', `action_${scene.scene_number}`)}
                                  className="absolute right-2 top-1/2 -translate-y-1/2 transition-all p-1.5 bg-white/10 rounded-lg hover:bg-white/20 border border-white/5"
                                  title="Copy Actions"
                                >
                                  {copiedId === `action_${scene.scene_number}` ? <Check className="w-3 h-3 text-green-400" /> : <Copy className="w-3 h-3 text-white/50" />}
                                </button>
                              </div>

                              {/* Voice Tone Info */}
                              <div className="flex flex-col gap-0.5 bg-black/20 p-3 rounded-[12px] border border-white/5 group/tone relative hover:border-white/10 transition-colors">
                                <span className="text-[8px] text-white/30 uppercase font-black tracking-widest">🎭 ভয়েস টোন ও মুড (Tone)</span>
                                <span className="text-[10px] text-white/70 font-bold pr-8">{scene.voice_tone || "Natural narrative tone"}</span>
                                <button 
                                  type="button"
                                  onClick={() => handleCopyText(scene.voice_tone || 'Natural narrative tone', 'prompt', `tone_${scene.scene_number}`)}
                                  className="absolute right-2 top-1/2 -translate-y-1/2 transition-all p-1.5 bg-white/10 rounded-lg hover:bg-white/20 border border-white/5"
                                  title="Copy Voice Tone"
                                >
                                  {copiedId === `tone_${scene.scene_number}` ? <Check className="w-3 h-3 text-green-400" /> : <Copy className="w-3 h-3 text-white/50" />}
                                </button>
                              </div>
                            </div>

                            {/* Image Generator Prompt (The biggest copy target) */}
                            {scene.ai_background_prompt_bengali && (
                              <div className="bg-emerald-500/5 rounded-xl p-3.5 border border-emerald-500/10 relative group/bgprompt transition-all hover:bg-emerald-500/10 hover:border-emerald-500/20">
                                <span className="text-[8px] font-black tracking-widest text-emerald-400 block uppercase mb-1.5 flex items-center gap-1.5">
                                  <Image className="w-3 h-3" />
                                  ইমেজ জেনারেটর প্রম্পাট (AI Image Prompt)
                                </span>
                                <p className="text-[11px] text-white/60 leading-relaxed pr-10 italic">{scene.ai_background_prompt_bengali}</p>
                                <button
                                  type="button"
                                  onClick={() => handleCopyText(scene.ai_background_prompt_bengali || '', 'prompt', `bgprompt_${scene.scene_number}`)}
                                  className="absolute right-3 top-1/2 -translate-y-1/2 transition-all bg-emerald-400/20 p-2 rounded-xl border border-emerald-400/30 hover:bg-emerald-400/30"
                                >
                                  {copiedId === `bgprompt_${scene.scene_number}` ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4 text-emerald-400" />}
                                </button>
                              </div>
                            )}
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="p-10 text-center text-white/20">
                    <History className="w-10 h-10 mx-auto mb-2 opacity-10" />
                    <p className="text-sm font-bold">চ্যাপ্টার লোড হচ্ছে...</p>
                  </div>
                )}
              </div>

            </motion.div>
          )}

          {/* VIEW: PRODUCTION HISTORY */}
          {currentView === 'history' && (
            <motion.div 
              key="history" 
              initial={{ opacity: 0, y: 15 }} 
              animate={{ opacity: 1, y: 0 }} 
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.3 }}
              className="space-y-6"
            >
              
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-black uppercase tracking-tighter font-display text-white">PRODUCTIONS HISTORY</h2>
                  <p className="text-[9px] text-white/40 uppercase tracking-[0.15em] font-sans">পূর্বের তৈরি কার্টুন স্ক্রিপ্টসমূহ</p>
                </div>
                {productionHistory.length > 0 && (
                  <button 
                    onClick={clearAllHistory}
                    className="text-[10px] text-red-400/70 hover:text-red-400 border border-red-500/10 hover:border-red-500/35 px-3 py-1.5 rounded-xl bg-red-500/5 transition-colors font-bold uppercase tracking-wider"
                  >
                    Clear All
                  </button>
                )}
              </div>

              {/* History listing cards */}
              <div className="space-y-4.5">
                {productionHistory.length > 0 ? (
                  productionHistory.map((item) => {
                    const itemTheme = getCategoryTheme(item.category);
                    return (
                      <div 
                        key={item.id}
                        onClick={() => {
                          setProduction(item);
                          setCurrentView('script');
                        }}
                        className="glass-card rounded-[22px] p-4.5 hover:p-5 flex items-center justify-between cursor-pointer border bg-[#121215]/80 transition-all duration-300 group"
                        style={{ borderColor: 'rgba(255,255,255,0.05)' }}
                        onMouseEnter={(e) => { e.currentTarget.style.borderColor = itemTheme.primary }}
                        onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.05)' }}
                      >
                        <div className="flex items-center gap-3.5 flex-1 min-w-0">
                        <div className="space-y-1 min-w-0 flex-1">
                          <h3 className="text-white font-bold text-sm truncate group-hover:text-[#7c79e5] transition-colors">{item.title}</h3>
                          <div className="flex items-center gap-2">
                            <span className="text-[9px] text-white/40 font-semibold">{item.timestamp}</span>
                            <span className="text-[9px] bg-white/5 border border-white/10 px-1.5 py-0.2 rounded text-white/50">{item.duration}m Video</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <button 
                          onClick={(e) => deleteHistoryItem(item.id, e)}
                          className="p-2 rounded-xl text-white/20 hover:text-red-400 hover:bg-red-500/5 transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                        <ChevronRight className="w-4.5 h-4.5 text-white/20 group-hover:text-white transition-colors" />
                      </div>
                    </div>
                  );
                })
              ) : (
                  <div className="glass-card rounded-[24px] p-12 text-center border border-dashed border-white/10 bg-[#0c0c0e]/40 space-y-3">
                    <Video className="w-8 h-8 text-white/10 mx-auto" />
                    <p className="text-xs text-white/30 font-bold uppercase tracking-widest">খুঁজে পাওয়া যায়নি / No Saved History</p>
                    <button 
                      onClick={() => setCurrentView('home')}
                      className="text-[10px] font-black uppercase tracking-wider bg-white/5 px-4 py-2 rounded-full border border-white/5 hover:bg-white/10"
                      style={{ color: activeTheme.primary }}
                    >
                      নতুন প্রোডাকশন শুরু করুন
                    </button>
                  </div>
                )}
              </div>

            </motion.div>
          )}

        </AnimatePresence>
      </main>

      {/* VIEWPORT OVERLAY / PREFAB ACTIVE STEPS LOADING BAR */}
      <AnimatePresence>
        {isLoading && (
          <motion.div 
            id="loading-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex flex-col items-center justify-center p-6 bg-gradient-to-b from-[#111114] to-[#050505] backdrop-blur-2xl"
          >
            
            {/* Loading 3D ring visual scene */}
            <div className="loading-scene relative w-48 h-48 flex items-center justify-center mb-10 perspective-[1000px]">
              <div 
                className="loading-ring absolute w-full h-full border border-dashed rounded-full animate-spin3d"
                style={{ borderColor: `${activeTheme.primary}33` }}
              ></div>
              <div 
                className="loading-ring-outer absolute w-full h-full border border-dashed rounded-full animate-spin3d"
                style={{
                  borderTopColor: activeTheme.primary,
                  borderBottomColor: activeTheme.primary
                }}
              ></div>
              <div 
                className="loading-ring-inner absolute w-[80%] h-[80%] border-2 border-transparent rounded-full animate-spin3d-reverse"
                style={{
                  borderLeftColor: activeTheme.primary,
                  borderRightColor: activeTheme.primary,
                  boxShadow: `0 0 20px ${activeTheme.primary}25`
                }}
              ></div>
              
              <div 
                className="w-16 h-16 rounded-2xl flex items-center justify-center border animate-pulse shadow-2xl z-10"
                style={{
                  background: `linear-gradient(135deg, ${activeTheme.primary}, #151518)`,
                  borderColor: `${activeTheme.primary}40`
                }}
              >
                <Sparkles className="w-7 h-7 text-white" />
              </div>
            </div>

            <div className="text-center space-y-2 mb-8">
              <h3 className="text-2xl font-black text-white tracking-tight uppercase font-display">AI Production Active</h3>
              <p className="text-white/40 text-[9px] font-bold tracking-[0.2em] uppercase">একটি চমৎকার কার্টুন স্ক্রিপ্ট সৃষ্টি হচ্ছে</p>
            </div>

            {/* Steps Container */}
            <div className="w-full max-w-xs bg-white/3 border border-white/5 rounded-[22px] p-5 space-y-4 shadow-xl">
              <div className={`flex items-center gap-3 transition-opacity duration-300 ${loadingStep >= 1 ? 'opacity-100' : 'opacity-25'}`}>
                <div 
                  className={`w-2 h-2 rounded-full ${loadingStep > 1 ? 'bg-green-400' : 'animate-ping'}`}
                  style={{ backgroundColor: loadingStep > 1 ? '' : activeTheme.primary }}
                />
                <span className={`text-xs font-bold ${loadingStep > 1 ? 'text-green-400' : 'text-white'}`}>তথ্য বিশ্লেষণ ও ক্যারেক্টার প্ল্যান চলছে (Analysis Phase)</span>
              </div>
              <div className={`flex items-center gap-3 transition-opacity duration-300 ${loadingStep >= 2 ? 'opacity-100' : 'opacity-25'}`}>
                <div 
                  className={`w-2 h-2 rounded-full ${loadingStep > 2 ? 'bg-green-400' : (loadingStep === 2 ? 'animate-ping' : 'bg-white/10')}`}
                  style={{ backgroundColor: loadingStep > 2 ? '' : (loadingStep === 2 ? activeTheme.primary : '') }}
                />
                <span className={`text-xs font-bold ${loadingStep > 2 ? 'text-green-400' : (loadingStep === 2 ? 'text-white' : 'text-white/40')}`}>মাস্টর স্টোরি আউটলাইন তৈরি করা হচ্ছে (Story Outline)</span>
              </div>
              <div className={`flex items-center gap-3 transition-opacity duration-300 ${loadingStep >= 3 ? 'opacity-100' : 'opacity-25'}`}>
                <div 
                  className={`w-2 h-2 rounded-full ${loadingStep > 3 ? 'bg-green-400' : (loadingStep === 3 ? 'animate-ping' : 'bg-white/10')}`}
                  style={{ backgroundColor: loadingStep > 3 ? '' : (loadingStep === 3 ? activeTheme.primary : '') }}
                />
                <span className={`text-xs font-bold ${loadingStep > 3 ? 'text-green-400' : (loadingStep === 3 ? 'text-white' : 'text-white/40')}`}>মূল স্ক্রিপ্ট ও সংলাপ তৈরি হচ্ছে (Scripting Phase)</span>
              </div>
              <div className={`flex items-center gap-3 transition-opacity duration-300 ${loadingStep >= 4 ? 'opacity-100' : 'opacity-25'}`}>
                <div className={`w-2 h-2 rounded-full ${loadingStep >= 4 ? 'bg-green-400 animate-pulse' : 'bg-white/10'}`} />
                <span className={`text-xs font-bold ${loadingStep >= 4 ? 'text-green-400' : 'text-white/40'}`}>ফলাফল সাজানো ও সম্পন্ন করা হচ্ছে (Finalizing)</span>
              </div>
            </div>

            <button 
              onClick={cancelProduction}
              className="absolute bottom-10 flex items-center gap-2 px-6 py-3 rounded-full bg-white/5 border border-white/5 text-[9px] font-bold text-white/40 uppercase tracking-[0.15em] hover:bg-red-500/10 hover:text-red-400 hover:border-red-500/20 transition-all active:scale-95"
            >
              <StopCircle className="w-3.5 h-3.5" />
              Cancel Production
            </button>

          </motion.div>
        )}
      </AnimatePresence>

      {/* Styled Bottom Nav Tab Bar */}
      {currentView !== 'home' && currentView !== 'history' && (
        <nav className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-md bg-black/85 backdrop-blur-2xl border-t border-white/5 px-6 py-3 flex justify-around items-center z-40">
          <button 
            onClick={() => setCurrentView('script')} 
            className="flex flex-col items-center gap-1 flex-1 transition-all"
            style={{ color: currentView === 'script' ? activeTheme.primary : 'rgba(255,255,255,0.3)' }}
          >
            <FileText className="w-5 h-5" />
            <span className="text-[9px] font-bold uppercase tracking-wider">রুপান্তরিত গল্প</span>
          </button>
          
          <button 
            onClick={() => setCurrentView('cinematic')} 
            className="flex flex-col items-center gap-1 flex-1 transition-all"
            style={{ color: currentView === 'cinematic' ? activeTheme.primary : 'rgba(255,255,255,0.3)' }}
          >
            <Clapperboard className="w-5 h-5" />
            <span className="text-[9px] font-bold uppercase tracking-wider">সংলাপ ও ভয়েস</span>
          </button>
        </nav>
      )}

      {/* Developer API & Netlify Settings Modal */}
      <AnimatePresence>
        {showSettingsModal && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-[#050505]/95 backdrop-blur-xl z-50 flex flex-col p-6 overflow-y-auto max-w-md mx-auto border-x border-white/10"
          >
            <div className="flex items-center justify-between pb-5 border-b border-white/5">
              <div className="flex items-center gap-2">
                <Settings className="w-5 h-5 animate-spin-slow" style={{ color: activeTheme.primary }} />
                <div>
                  <h2 className="text-sm font-black uppercase tracking-wider text-white">ডোমেইন ও এপিআই সেটিংস</h2>
                  <p className="text-[9px] tracking-wide text-white/40">Domain / Netlify Setup & Free API Keys</p>
                </div>
              </div>
              <button 
                onClick={() => setShowSettingsModal(false)}
                className="px-3 py-1.5 rounded-lg bg-white/5 border border-white/5 text-xs text-white/60 hover:text-white"
              >
                বন্ধ করুন (Close)
              </button>
            </div>

            <div className="mt-5 space-y-6 flex-1">
              
              {/* API URL Override section */}
              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase tracking-widest text-[#7c79e5] block">
                  🌐 ব্যাকএন্ড এপিআই সার্ভার রুট (API Routing)
                </label>
                <p className="text-[10px] text-white/50 leading-relaxed">
                  Netlify বা অন্য কোথাও ডোমেইন পরিবর্তন করলে এটি অটোমেটিক আমাদের অ্যাক্টিভ ক্লাউড রান সার্ভার ব্যবহার করবে। আপনি কাস্টম ব্যাকএন্ড সার্ভার ব্যবহার করতে চাইলে নিচে ইউআরএল দিন:
                </p>
                <div className="flex gap-2">
                  <input 
                    type="text"
                    className="flex-1 bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500/50"
                    placeholder="যেমনঃ https://my-server.com"
                    value={customApiUrl}
                    onChange={(e) => setCustomApiUrl(e.target.value)}
                  />
                  <button 
                    onClick={() => {
                      setCustomApiUrl('');
                      localStorage.removeItem('STORY_GENERATOR_API_URL');
                    }}
                    className="px-3 py-2 bg-white/5 border border-white/10 hover:bg-white/10 text-xs text-white/50 rounded-xl"
                    title="Reset to default background server"
                  >
                    Reset
                  </button>
                </div>
                <div className="bg-white/3 border border-white/5 p-2 rounded-lg text-[9px] text-white/40 font-mono">
                  সক্রিয় রুট: <span className="text-emerald-400">{customApiUrl || 'https://ais-pre-qeatm6ccr5dn35vzdkzq2w-8... (Default)'}</span>
                </div>
              </div>

              {/* Gemini Key section */}
              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase tracking-widest text-[#7c79e5] block">
                  🔑 কাস্টম জেমিনি এপিআই কি (Custom Gemini Key)
                </label>
                <p className="text-[10px] text-white/50 leading-relaxed">
                  একেবারে ফ্রিতে এবং আনলিমিটেড কার্টুন স্ক্রিপ্ট জেনারেট করতে চাইলে আপনার নিজের একটি ফ্রি Gemini API Key ব্যবহার করতে পারেন। এটি আপনার ব্রাউজার-এই সুরক্ষিতভাবে সংরক্ষিত থাকবে।
                </p>
                <input 
                  type="password"
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500/50"
                  placeholder="আপনার AI Studio Gemini API Key দিন..."
                  value={customGeminiKey}
                  onChange={(e) => setCustomGeminiKey(e.target.value)}
                />
                <p className="text-[9px] text-white/35">
                  * এপিআই কি ফাঁকা রাখলে আমাদের ইন্টিগ্রেটেড ফ্রি ডিস্ট্রিবিউটেড কি-পুল স্বয়ংক্রিয়ভাবে কাজ চালিয়ে যাবে।
                </p>
              </div>

              {/* Netlify Guide panel */}
              <div className="bg-gradient-to-br from-[#121216]/50 to-transparent border border-white/5 rounded-2xl p-4 space-y-3">
                <h4 className="text-[11px] font-black text-white uppercase tracking-wider flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-[#7c79e5]" />
                  Netlify ডোমেইন ও ফ্রি হোস্টিং গাইডবুক
                </h4>
                <div className="space-y-2 text-[10px] text-white/60 leading-relaxed">
                  <div className="flex gap-2">
                    <span className="w-4 h-4 rounded-full bg-white/10 flex items-center justify-center font-bold text-[9px]">১</span>
                    <p>
                      <strong>_redirects ফাইলঃ</strong> আপনার সুবিধার জন্য আমরা ইতিমধ্যে <code>/public/_redirects</code> ফাইল কনফিগার করে দিয়েছি। এটি সমস্ত ব্যাকএন্ড কুয়েরিকে প্রক্সি করবে।
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <span className="w-4 h-4 rounded-full bg-white/10 flex items-center justify-center font-bold text-[9px]">২</span>
                    <p>
                      <strong>ডিপ্লয় প্রসেসঃ</strong> এই কোডটি Netlify-তে ড্র্যাগ অ্যান্ড ড্রপ বা গিটহাবের মাধ্যমে সরাসরি ডিপ্লয় করে নিন। কোনো অতিরিক্ত কুয়েরি বা ট্র্যাশ বিল্ড হবে না।
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <span className="w-4 h-4 rounded-full bg-white/10 flex items-center justify-center font-bold text-[9px]">৩</span>
                    <p>
                      <strong>১০০% ফ্রি লাইফটাইমঃ</strong> কোনো ডাটাবেজ ইন্টিগ্রেশানের ঝামেলা ছাড়াই সম্পূর্ণ অ্যাপের ক্যাশ ও হিস্ট্রি ব্রাউজারের লোকাল স্টোরেজে জমা থাকবে ফলে আপনার জিরো ডোমেইন খরচেই চলবে!
                    </p>
                  </div>
                </div>
              </div>

              {/* Action save button */}
              <button 
                onClick={() => {
                  if (customApiUrl.trim()) {
                    localStorage.setItem('STORY_GENERATOR_API_URL', customApiUrl.trim());
                  } else {
                    localStorage.removeItem('STORY_GENERATOR_API_URL');
                  }

                  if (customGeminiKey.trim()) {
                    localStorage.setItem('STORY_GENERATOR_GEMINI_KEY', customGeminiKey.trim());
                  } else {
                    localStorage.removeItem('STORY_GENERATOR_GEMINI_KEY');
                  }
                  setShowSettingsModal(false);
                }}
                className="w-full py-3 rounded-xl text-xs font-black uppercase text-white tracking-widest transition-all duration-300 transform active:scale-[0.98] shadow-lg"
                style={{
                  background: `linear-gradient(135deg, ${activeTheme.primary}ee 0%, ${activeTheme.primary}aa 100%)`,
                  boxShadow: `0 4px 20px ${activeTheme.primary}25`
                }}
              >
                সেটিংস সংরক্ষণ করুন (Save Configuration)
              </button>

            </div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}
