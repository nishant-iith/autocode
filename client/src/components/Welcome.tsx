
import React, { useState } from 'react';
import {
  Code,
  Zap,
  Rocket,
  LayoutTemplate,
  DownloadCloud,
  Cpu,
  Globe,
  Keyboard
} from 'lucide-react';
import CreateProjectModal from './modals/CreateProjectModal';
import ImportModal from './modals/ImportModal';
import TemplateModal from './modals/TemplateModal';

/**
 * Welcome screen component
 * Displays when no project is open
 * Single project mode - creating/importing a new project replaces any existing one
 */
const Welcome: React.FC = () => {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [showTemplateModal, setShowTemplateModal] = useState(false);

  const ActionCard = ({
    title,
    description,
    icon: Icon,
    colorClass,
    onClick
  }: {
    title: string;
    description: string;
    icon: React.ElementType;
    colorClass: string;
    onClick: () => void;
  }) => (
    <button
      onClick={onClick}
      className="group relative flex flex-col items-start p-6 h-full bg-vscode-panel/40 border border-vscode-border rounded-2xl hover:bg-vscode-panel/80 hover:border-vscode-accent/50 transition-all duration-300 hover:shadow-2xl hover:-translate-y-1 overflow-hidden"
    >
      <div className={`absolute top-0 right-0 p-32 opacity-[0.03] transform translate-x-12 -translate-y-12 group-hover:scale-110 transition-transform duration-700 ${colorClass}`}>
        <Icon size={200} />
      </div>

      <div className={`p-4 rounded-xl mb-6 bg-vscode-bg/50 border border-vscode-border/50 group-hover:scale-110 transition-transform duration-300 ${colorClass} bg-opacity-10`}>
        <Icon size={32} className={colorClass.replace('bg-', 'text-')} />
      </div>

      <h3 className="text-xl font-bold text-vscode-text mb-2 group-hover:text-white transition-colors">
        {title}
      </h3>

      <p className="text-sm text-vscode-text-muted leading-relaxed text-left group-hover:text-vscode-text-muted/80">
        {description}
      </p>
    </button>
  );

  const FeatureItem = ({ icon: Icon, label }: { icon: React.ElementType, label: string }) => (
    <div className="flex items-center space-x-2 text-vscode-text-muted/60 bg-vscode-panel/30 px-3 py-1.5 rounded-full border border-vscode-border/30">
      <Icon size={14} />
      <span className="text-xs font-medium">{label}</span>
    </div>
  );

  return (
    <div className="h-full bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-vscode-panel via-vscode-editor to-vscode-editor flex items-center justify-center overflow-auto">
      <div className="max-w-5xl mx-auto p-6 sm:p-12 w-full animate-in fade-in duration-700">

        {/* Hero Section */}
        <div className="text-center mb-16 space-y-6">
          <div className="inline-flex items-center justify-center p-2 bg-vscode-panel/50 rounded-full border border-vscode-border/50 mb-4 backdrop-blur-sm animate-in slide-in-from-top-4 fade-in duration-1000">
            <span className="relative flex h-2 w-2 mr-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
            </span>
            <span className="text-xs font-medium text-vscode-text-muted tracking-wide uppercase">System Online</span>
          </div>

          <h1 className="text-5xl sm:text-7xl font-extrabold tracking-tight text-transparent bg-clip-text bg-gradient-to-b from-white via-gray-200 to-gray-500 drop-shadow-sm">
            AutoCode
          </h1>

          <p className="text-lg sm:text-xl text-vscode-text-muted max-w-2xl mx-auto leading-relaxed font-light">
            The next-generation browser IDE. <br className="hidden sm:block" />
            Build, run, and deploy Node.js applications instantly.
          </p>
        </div>

        {/* Actions Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16 max-w-4xl mx-auto">
          <ActionCard
            title="New Project"
            description="Initialize a fresh Node.js environment with zero configuration."
            icon={Rocket}
            colorClass="text-blue-400"
            onClick={() => setShowCreateModal(true)}
          />

          <ActionCard
            title="Use Template"
            description="Jumpstart with pre-built stacks like React, Vue, or Express."
            icon={LayoutTemplate}
            colorClass="text-green-400"
            onClick={() => setShowTemplateModal(true)}
          />

          <ActionCard
            title="Import Project"
            description="Bring your own code from a ZIP archive or GitHub repository."
            icon={DownloadCloud}
            colorClass="text-purple-400"
            onClick={() => setShowImportModal(true)}
          />
        </div>

        {/* Footer Features */}
        <div className="flex flex-wrap justify-center gap-4 animate-in slide-in-from-bottom-4 fade-in duration-1000 delay-300">
          <FeatureItem icon={Cpu} label="WebContainer Engine" />
          <FeatureItem icon={Code} label="Monaco Editor" />
          <FeatureItem icon={Zap} label="Instant HMR" />
          <FeatureItem icon={Globe} label="Offline Capable" />
          <FeatureItem icon={Keyboard} label="Vim Mode Support" />
        </div>

      </div>

      {showCreateModal && (
        <CreateProjectModal
          onClose={() => setShowCreateModal(false)}
          onSuccess={() => setShowCreateModal(false)}
        />
      )}

      {showImportModal && (
        <ImportModal
          onClose={() => setShowImportModal(false)}
          onSuccess={() => setShowImportModal(false)}
        />
      )}

      {showTemplateModal && (
        <TemplateModal
          onClose={() => setShowTemplateModal(false)}
          onSuccess={() => setShowTemplateModal(false)}
        />
      )}
    </div>
  );
};

export default Welcome;
