import React, { useState } from 'react';
import { Brain, FileQuestion, FunctionSquare, ChevronRight, FileText, BookOpen, GraduationCap } from 'lucide-react';
import SolveQuestion from './components/SolveQuestion';
import GenerateMindmap from './components/GenerateMindmap';
import FormulaInterpreter from './components/FormulaInterpreter';

type Tab = 'solve' | 'mindmap' | 'formula';

function App() {
  const [activeTab, setActiveTab] = useState<Tab>('solve');

  const tabs = [
    {
      id: 'solve' as const,
      label: 'Problem Solver',
      description: 'Input any physics question for step-by-step solutions',
      icon: FileQuestion,
      component: SolveQuestion
    },
    {
      id: 'mindmap' as const,
      label: 'Concept Mapper',
      description: 'Generate comprehensive mindmaps from your lecture slides',
      icon: Brain,
      component: GenerateMindmap
    },
    {
      id: 'formula' as const,
      label: 'Formula Interpreter',
      description: 'Decode and understand complex physics formulas instantly',
      icon: FunctionSquare,
      component: FormulaInterpreter
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex">
      {/* Sidebar */}
      <div className="w-72 bg-white shadow-xl border-r border-gray-100">
        <div className="p-6">
          <div className="flex items-center space-x-2 mb-8">
            <GraduationCap className="h-8 w-8 text-blue-600" />
            <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-700 to-indigo-700 bg-clip-text text-transparent">
              PhysicsAI Pro
            </h1>
          </div>
          
          <div className="mb-6">
            <h2 className="text-xs uppercase tracking-wider text-gray-500 font-semibold mb-3">
              LEARNING TOOLS
            </h2>
            <nav className="space-y-2">
              {tabs.map(({ id, label, icon: Icon }) => (
                <button
                  key={id}
                  onClick={() => setActiveTab(id)}
                  className={`w-full flex items-center justify-between px-4 py-3 rounded-lg transition-all duration-200 ${
                    activeTab === id
                      ? 'bg-gradient-to-r from-blue-50 to-indigo-50 text-blue-700 border-l-4 border-blue-600'
                      : 'text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <Icon className={`w-5 h-5 ${activeTab === id ? 'text-blue-600' : 'text-gray-500'}`} />
                    <span className="font-medium">{label}</span>
                  </div>
                  {activeTab === id && <ChevronRight className="w-4 h-4 text-blue-600" />}
                </button>
              ))}
            </nav>
          </div>
          
          <div className="pt-4 border-t border-gray-100">
            <div className="bg-blue-50 rounded-lg p-4">
              <div className="flex items-center space-x-2 mb-2">
                <BookOpen className="h-4 w-4 text-blue-600" />
                <h3 className="text-sm font-semibold text-blue-800">Quick Guide</h3>
              </div>
              <p className="text-xs text-gray-600 leading-relaxed">
                Select any tool from the menu to get started with your physics learning journey. Need help? Click on the info icon in each section.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-hidden">
        <div className="h-full flex flex-col">
          {/* Header for current section */}
          <header className="bg-white shadow-sm border-b border-gray-200 px-8 py-4">
            {tabs.map(({ id, label, description, icon: Icon }) => (
              activeTab === id && (
                <div key={id} className="flex items-center justify-between">
                  <div>
                    <div className="flex items-center space-x-3">
                      <Icon className="h-6 w-6 text-blue-600" />
                      <h2 className="text-xl font-bold text-gray-800">{label}</h2>
                    </div>
                    <p className="text-sm text-gray-500 mt-1">{description}</p>
                  </div>
                  <div className="flex space-x-2">
                    <button className="px-4 py-2 bg-white text-gray-600 border border-gray-300 rounded-md text-sm hover:bg-gray-50">
                      Help
                    </button>
                    <button className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm hover:bg-blue-700">
                      New Session
                    </button>
                  </div>
                </div>
              )
            ))}
          </header>
          
          {/* Content area */}
          <div className="flex-1 overflow-auto p-8 bg-white m-6 rounded-xl shadow-sm">
            {tabs.map(({ id, component: Component }) => (
              activeTab === id && <Component key={id} />
            ))}
          </div>
          
          {/* Footer */}
          <footer className="bg-white border-t border-gray-100 px-8 py-3">
            <div className="flex justify-between items-center text-xs text-gray-500">
              <div>PhysicsAI Pro • Student Edition v2.0</div>
              <div className="flex space-x-4">
                <span>Documentation</span>
                <span>Support</span>
                <span>© 2025 PhysicsAI</span>
              </div>
            </div>
          </footer>
        </div>
      </div>
    </div>
  );
}

export default App;