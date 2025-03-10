
import React from 'react';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { Brain, FileText, Lightbulb, GraduationCap, ChevronRight, ArrowRight } from 'lucide-react';

const Landing = () => {
  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      {/* Header */}
      <header className="container mx-auto px-4 py-6 flex justify-between items-center">
        <div className="flex items-center gap-2">
          <Brain className="text-blue-600" size={28} />
          <span className="font-bold text-xl">InsightGrowth</span>
        </div>
        <div className="space-x-4">
          <Button variant="outline" asChild>
            <Link to="/auth">Sign In</Link>
          </Button>
          <Button asChild>
            <Link to="/auth">Get Started</Link>
          </Button>
        </div>
      </header>

      {/* Hero section */}
      <section className="container mx-auto px-4 py-20 text-center">
        <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight mb-6 animate-fade-in">
          Understand Research Papers <br className="hidden md:inline" />
          <span className="text-blue-600">One Concept at a Time</span>
        </h1>
        <p className="text-xl text-gray-600 max-w-3xl mx-auto mb-10 animate-fade-in" style={{ animationDelay: "0.1s" }}>
          Upload any arXiv paper and we'll help you understand it completely, from basics to mastery, with personalized learning paths and interactive quizzes.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center animate-fade-in" style={{ animationDelay: "0.2s" }}>
          <Button size="lg" asChild>
            <Link to="/auth">
              Get Started Free
              <ArrowRight className="ml-2 h-5 w-5" />
            </Link>
          </Button>
          <Button size="lg" variant="outline">
            Learn More
          </Button>
        </div>
        
        <div className="mt-16 rounded-xl bg-white shadow-xl overflow-hidden border border-gray-100 max-w-5xl mx-auto animate-fade-in" style={{ animationDelay: "0.3s" }}>
          <img 
            src="https://placehold.co/1200x600/e9f2ff/1d4ed8?text=InsightGrowth+Demo" 
            alt="InsightGrowth app screenshot" 
            className="w-full h-auto"
          />
        </div>
      </section>

      {/* Features section */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">How It Works</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-blue-50 rounded-xl p-6 text-center animate-slide-up">
              <div className="bg-blue-100 text-blue-600 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                <FileText size={28} />
              </div>
              <h3 className="text-xl font-semibold mb-3">Upload Paper</h3>
              <p className="text-gray-600">
                Simply paste an arXiv link or upload a PDF, and we'll analyze the paper for you.
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
            <Button size="lg" asChild>
              <Link to="/auth">
                Start Learning Now
                <ChevronRight className="ml-1 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      </section>
      
      {/* Footer */}
      <footer className="py-10 border-t border-gray-100">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="flex items-center gap-2 mb-4 md:mb-0">
              <Brain className="text-blue-600" size={24} />
              <span className="font-bold text-lg">InsightGrowth</span>
            </div>
            <div className="text-sm text-gray-500">
              © {new Date().getFullYear()} InsightGrowth. All rights reserved.
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Landing;
