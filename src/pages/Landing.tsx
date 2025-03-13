import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Brain, FileText, Lightbulb, GraduationCap, ChevronRight, ArrowRight } from 'lucide-react';
import WaitingListModal from '@/components/WaitingListModal';

const Landing = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const openModal = () => {
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-white">
      {/* Header */}
      <header className="w-full px-4 py-6 flex justify-between items-center backdrop-blur-sm bg-white/50">
        <div className="flex items-center gap-2">
          <Brain className="text-blue-600" size={28} />
          <span className="font-bold text-xl bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">Paper Mastery</span>
        </div>
        <div className="space-x-4">
          <Button className="bg-blue-600 hover:bg-blue-700" onClick={openModal}>
            Join Waiting List
          </Button>
        </div>
      </header>

      {/* Hero section */}
      <section className="w-full px-4 py-20 text-center">
        <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold tracking-tight mb-6 animate-fade-in bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-600 bg-clip-text text-transparent">
          Master Research Papers <br className="hidden md:inline" />
          With Confidence
        </h1>
        <p className="text-xl text-gray-600 max-w-3xl mx-auto mb-10 animate-fade-in" style={{ animationDelay: "0.1s" }}>
          Upload any arXiv paper and we'll guide you through it step by step, from fundamentals to mastery, with an AI-powered learning journey tailored just for you.
        </p>
        <div className="flex justify-center animate-fade-in" style={{ animationDelay: "0.2s" }}>
          <Button size="lg" className="bg-blue-600 hover:bg-blue-700" onClick={openModal}>
            Join Waiting List
            <ArrowRight className="ml-2 h-5 w-5" />
          </Button>
        </div>
        
        <div className="mt-16 rounded-2xl bg-white/50 backdrop-blur-sm shadow-xl overflow-hidden border border-blue-100 max-w-5xl mx-auto animate-fade-in" style={{ animationDelay: "0.3s" }}>
          <img 
            src="https://placehold.co/1200x600/e9f2ff/1d4ed8?text=Paper+Mastery+Demo" 
            alt="Paper Mastery app screenshot" 
            className="w-full h-auto"
          />
        </div>
      </section>

      {/* Features section */}
      <section className="py-20 bg-white/80 backdrop-blur-sm">
        <div className="w-full px-4">
          <h2 className="text-3xl font-bold text-center mb-12 bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">How It Works</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            <div className="bg-white/50 backdrop-blur-sm rounded-xl p-6 text-center animate-slide-up shadow-lg border border-blue-100">
              <div className="bg-blue-100 text-blue-600 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                <FileText size={28} />
              </div>
              <h3 className="text-xl font-semibold mb-3 text-gray-800">Share Paper</h3>
              <p className="text-gray-600">
                Simply paste an arXiv link, and we'll analyze the paper for you using advanced AI.
              </p>
            </div>
            
            <div className="bg-blue-50 rounded-xl p-6 text-center animate-slide-up" style={{ animationDelay: "0.1s" }}>
              <div className="bg-blue-100 text-blue-600 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                <Lightbulb size={28} />
              </div>
              <h3 className="text-xl font-semibold mb-3">Learn Concepts</h3>
              <p className="text-gray-600">
                Follow a personalized learning path that adapts to your skill level and progress.
              </p>
            </div>
            
            <div className="bg-blue-50 rounded-xl p-6 text-center animate-slide-up" style={{ animationDelay: "0.2s" }}>
              <div className="bg-blue-100 text-blue-600 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                <GraduationCap size={28} />
              </div>
              <h3 className="text-xl font-semibold mb-3">Master the Paper</h3>
              <p className="text-gray-600">
                Take quizzes and review related papers to deepen your understanding and track progress.
              </p>
            </div>
          </div>
          
          <div className="text-center mt-12">
            <Button size="lg" className="bg-blue-600 hover:bg-blue-700" onClick={openModal}>
              Join Waiting List
              <ChevronRight className="ml-1 h-4 w-4" />
            </Button>
          </div>
        </div>
      </section>
      
      {/* Footer */}
      <footer className="py-10 border-t border-blue-100 bg-white/50 backdrop-blur-sm">
        <div className="w-full px-4">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="flex items-center gap-2 mb-4 md:mb-0">
              <Brain className="text-blue-600" size={24} />
              <span className="font-bold text-lg bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">Paper Mastery</span>
            </div>
            <div className="text-sm text-gray-500">
              © {new Date().getFullYear()} Paper Mastery. All rights reserved.
            </div>
          </div>
        </div>
      </footer>

      {/* Waiting List Modal */}
      <WaitingListModal isOpen={isModalOpen} onClose={closeModal} />
    </div>
  );
};

export default Landing;
