import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Share2, Download, Sparkles } from 'lucide-react';
import { useDashboard } from '../hooks/useDashboard';
import { generateWeeklyReflection } from '../lib/weeklyGenerator';
import CoverPage from '../components/WeeklyReflection/CoverPage';
import CompanionLetter from '../components/WeeklyReflection/CompanionLetter';
import EmotionalWeather from '../components/WeeklyReflection/EmotionalWeather';
import MoodCalendar from '../components/WeeklyReflection/MoodCalendar';
import DNAEvolution from '../components/WeeklyReflection/DNAEvolution';
import PatternDiscoveries from '../components/WeeklyReflection/PatternDiscoveries';
import EmotionalTriggers from '../components/WeeklyReflection/EmotionalTriggers';
import FeaturedMemory from '../components/WeeklyReflection/FeaturedMemory';
import GentleDirection from '../components/WeeklyReflection/GentleDirection';
import MemoryOrbArtifact from '../components/WeeklyReflection/MemoryOrbArtifact';
import { useAuth } from '../context/AuthContext';

const WeeklyReflection: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const { userProfile } = useAuth();
  const { data: dashboardData } = useDashboard();
  
  const data = React.useMemo(() => {
    return generateWeeklyReflection(
      dashboardData?.recentEntries || [],
      userProfile?.companionName || 'Mira'
    );
  }, [dashboardData, userProfile?.companionName]);

  const [isExporting, setIsExporting] = useState(false);

  const getFullScrollNode = () => document.getElementById('weekly-reflection-content');

  const captureFullPdfBase64 = async () => {
    const node = getFullScrollNode();
    if (!node) throw new Error('Content not found');
    
    // Temporarily apply export-mode class to force visibility of all scroll content
    node.classList.add('export-mode');
    
    // Allow DOM to process the class
    await new Promise(r => setTimeout(r, 100));

    try {
      const htmlToImage = await import('html-to-image');
      const { jsPDF } = await import('jspdf');

      const width = node.scrollWidth;
      const height = node.scrollHeight;

      // Capture as PNG
      const dataUrl = await htmlToImage.toPng(node, { 
        cacheBust: true, 
        pixelRatio: 2,
        backgroundColor: '#0a0a0a',
        width: width,
        height: height,
        style: { 
          transform: 'scale(1)', 
          opacity: '1', 
          visibility: 'visible',
          margin: '0',
          position: 'static'
        }
      });

      // Create PDF matching dimensions
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'px',
        format: [width, height]
      });

      pdf.addImage(dataUrl, 'PNG', 0, 0, width, height);
      return pdf.output('datauristring');
    } finally {
      node.classList.remove('export-mode');
    }
  };

  const handleShare = async () => {
    try {
      setIsExporting(true);
      const dataUrl = await captureFullPdfBase64();
      if (!dataUrl) throw new Error('Failed to generate PDF');

      const response = await fetch(dataUrl);
      const blob = await response.blob();
      const file = new File([blob], 'MoodMirror-Weekly-Reflection.pdf', { type: 'application/pdf' });

      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({
          title: 'My Weekly Reflection',
          text: 'Check out my weekly emotional journey on MoodMirror.',
          files: [file]
        });
      } else {
        alert("Native sharing isn't supported on this device. You can download the image instead.");
      }
    } catch (err: any) {
      console.error('Share failed', err);
      alert(`Failed to share image: ${err.message}`);
    } finally {
      setIsExporting(false);
    }
  };

  const handleDownload = async () => {
    try {
      setIsExporting(true);
      const dataUrl = await captureFullPdfBase64();
      if (!dataUrl) throw new Error('Failed to generate PDF');
      
      const { Capacitor } = await import('@capacitor/core');
      if (Capacitor.isNativePlatform()) {
        const { Filesystem, Directory } = await import('@capacitor/filesystem');
        
        // Extract base64 part
        const base64Data = dataUrl.split(',')[1];
        
        const fileName = `MoodMirror-Weekly-Reflection-${Date.now()}.pdf`;
        await Filesystem.writeFile({
          path: fileName,
          data: base64Data,
          directory: Directory.Documents
        });
        
        alert(`Saved successfully to Documents folder as ${fileName}`);
      } else {
        const a = document.createElement('a');
        a.style.display = 'none';
        a.href = dataUrl;
        a.download = `MoodMirror-Weekly-Reflection.pdf`;
        document.body.appendChild(a);
        a.click();
        setTimeout(() => {
          document.body.removeChild(a);
        }, 100);
      }
    } catch (err: any) {
      console.error('Download failed', err);
      alert(`Failed to save image: ${err.message}`);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, transition: { duration: 0.5 } }}
      className="fixed inset-0 z-50 flex flex-col h-[100dvh] w-full bg-[#0a0a0a] overflow-hidden font-sans text-white"
    >
      {/* Dynamic Ambient Background */}
      <div className="absolute inset-0 z-0 pointer-events-none opacity-40 mix-blend-screen"
        style={{
          background: 'radial-gradient(circle at 50% 50%, rgba(143, 120, 104, 0.15) 0%, transparent 70%)',
        }}
      />

      {/* Floating Header */}
      <div className="absolute top-0 left-0 right-0 p-6 flex justify-between items-center z-50 bg-gradient-to-b from-black/80 to-transparent">
        <Sparkles size={18} className="text-white/70" />
        <div className="flex gap-4">
          <button onClick={handleDownload} className="w-10 h-10 flex items-center justify-center rounded-full bg-white/10 backdrop-blur-md hover:bg-white/20 transition-colors">
            <Download size={18} />
          </button>
          <button onClick={handleShare} className="w-10 h-10 flex items-center justify-center rounded-full bg-white/10 backdrop-blur-md hover:bg-white/20 transition-colors">
            <Share2 size={18} />
          </button>
          <button 
            onClick={onClose}
            className="w-10 h-10 flex items-center justify-center rounded-full bg-white/10 backdrop-blur-md hover:bg-white/20 transition-colors"
          >
            <X size={20} />
          </button>
        </div>
      </div>

      {/* Continuous Scroll Container */}
      <div id="weekly-reflection-content" className="flex-1 overflow-y-auto overflow-x-hidden scroll-smooth relative z-10 hide-scrollbar pb-32">
        <CoverPage data={data} />
        <CompanionLetter data={data} />
        <EmotionalWeather data={data} />
        <MoodCalendar data={data} />
        <DNAEvolution data={data} />
        <PatternDiscoveries data={data} />
        <EmotionalTriggers data={data} />
        <FeaturedMemory data={data} />
        <GentleDirection data={data} />
        <MemoryOrbArtifact data={data} />
      </div>
    </motion.div>
  );
}

export default WeeklyReflection;
