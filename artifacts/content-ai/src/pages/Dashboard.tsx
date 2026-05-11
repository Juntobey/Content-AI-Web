import React, { useState } from "react";
import { useTheme } from "@/components/ThemeProvider";
import { 
  useGenerateContent, 
  useListGenerations, 
  useGetStats,
  useDeleteGeneration,
  getListGenerationsQueryKey,
  getGetStatsQueryKey,
  GenerationInputFeature,
  GenerationResult,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { 
  Moon, Sun, PenTool, Code, Library, Loader2, 
  RefreshCcw, Copy, Download, History, BarChart2 
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useToast } from "@/hooks/use-toast";

// --- Markdown simple renderer ---
const renderMarkdown = (text: string) => {
  const lines = text.split('\n');
  return lines.map((line, i) => {
    if (line.startsWith('## ')) {
      return <h2 key={i} className="text-2xl font-serif italic font-bold mb-4 mt-6 text-foreground">{line.slice(3)}</h2>;
    }
    if (line.startsWith('# ')) {
      return <h1 key={i} className="text-3xl font-serif italic font-bold mb-4 mt-6 text-foreground">{line.slice(2)}</h1>;
    }
    if (line.startsWith('- ') || line.startsWith('* ')) {
      return <li key={i} className="ml-4 list-disc mb-2 text-foreground/90">{line.slice(2)}</li>;
    }
    
    // Bold replacement
    const parts = line.split(/(\*\*.*?\*\*)/g);
    const renderedParts = parts.map((part, j) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return <strong key={j} className="font-bold text-foreground">{part.slice(2, -2)}</strong>;
      }
      return part;
    });

    return line.trim() ? <p key={i} className="mb-4 leading-relaxed text-foreground/90">{renderedParts}</p> : <br key={i} />;
  });
};

export default function Dashboard() {
  const { theme, setTheme } = useTheme();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  const [activeFeature, setActiveFeature] = useState<GenerationInputFeature>("blog_post");
  const [input, setInput] = useState("");
  const [audience, setAudience] = useState("Developers and Tech Enthusiasts");
  const [tone, setTone] = useState("Professional");
  const [keywords, setKeywords] = useState("");
  
  const [currentResult, setCurrentResult] = useState<GenerationResult | null>(null);

  const { data: generations = [] } = useListGenerations();
  const { data: stats } = useGetStats();
  
  const generateMutation = useGenerateContent({
    mutation: {
      onSuccess: (data) => {
        setCurrentResult(data);
        queryClient.invalidateQueries({ queryKey: getListGenerationsQueryKey() });
        queryClient.invalidateQueries({ queryKey: getGetStatsQueryKey() });
        toast({
          title: "Content generated successfully",
          description: "Your new content is ready.",
        });
      },
      onError: () => {
        toast({
          title: "Generation failed",
          description: "Something went wrong. Please try again.",
          variant: "destructive"
        });
      }
    }
  });

  const deleteMutation = useDeleteGeneration({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListGenerationsQueryKey() });
        queryClient.invalidateQueries({ queryKey: getGetStatsQueryKey() });
        toast({
          title: "Generation deleted",
        });
      }
    }
  });

  const handleDelete = (e: React.MouseEvent, id: number) => {
    e.stopPropagation();
    deleteMutation.mutate({ id });
    if (currentResult?.id === id) {
      setCurrentResult(null);
    }
  };

  const handleGenerate = () => {
    if (!input.trim()) {
      toast({
        title: "Input required",
        description: "Please provide a topic or prompt.",
        variant: "destructive"
      });
      return;
    }
    generateMutation.mutate({
      data: {
        feature: activeFeature,
        input,
        audience,
        tone,
        keywords: keywords || undefined
      }
    });
  };

  const copyToClipboard = () => {
    if (currentResult?.result) {
      navigator.clipboard.writeText(currentResult.result);
      toast({ title: "Copied to clipboard" });
    }
  };

  const downloadFile = () => {
    if (currentResult?.result) {
      const blob = new Blob([currentResult.result], { type: "text/plain" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "contentai-output.txt";
      a.click();
      URL.revokeObjectURL(url);
    }
  };

  const getPlaceholder = () => {
    if (activeFeature === "blog_post") return "Enter your blog topic or title... e.g. 'The future of React Server Components'";
    if (activeFeature === "code_explain") return "Paste your code snippet here...";
    if (activeFeature === "prompt_library") return "Enter domain or theme... e.g. 'Customer support responses'";
    return "Enter your input...";
  };

  return (
    <div className="flex h-screen bg-background overflow-hidden text-foreground">
      {/* Sidebar */}
      <div className="w-[270px] flex-shrink-0 bg-sidebar border-r border-sidebar-border flex flex-col hidden lg:flex shadow-sm z-10">
        <div className="p-6 pb-2">
          <h1 className="text-3xl font-serif italic text-primary font-bold tracking-tight">ContentAI</h1>
        </div>
        
        <div className="px-4 py-4 space-y-2 flex-grow overflow-y-auto">
          <div className="text-xs font-semibold text-sidebar-foreground/50 uppercase tracking-wider mb-2 px-2">Tools</div>
          <button
            onClick={() => setActiveFeature("blog_post")}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-md transition-all duration-200 ${activeFeature === "blog_post" ? "bg-primary/10 text-primary border-l-2 border-primary shadow-sm" : "text-sidebar-foreground hover:bg-sidebar-accent border-l-2 border-transparent"}`}
            data-testid="btn-tool-blog"
          >
            <PenTool size={18} className={activeFeature === "blog_post" ? "text-primary" : "text-muted-foreground"} />
            <span className="font-medium">Blog Generator</span>
          </button>
          <button
            onClick={() => setActiveFeature("code_explain")}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-md transition-all duration-200 ${activeFeature === "code_explain" ? "bg-primary/10 text-primary border-l-2 border-primary shadow-sm" : "text-sidebar-foreground hover:bg-sidebar-accent border-l-2 border-transparent"}`}
            data-testid="btn-tool-code"
          >
            <Code size={18} className={activeFeature === "code_explain" ? "text-primary" : "text-muted-foreground"} />
            <span className="font-medium">Code Explainer</span>
          </button>
          <button
            onClick={() => setActiveFeature("prompt_library")}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-md transition-all duration-200 ${activeFeature === "prompt_library" ? "bg-primary/10 text-primary border-l-2 border-primary shadow-sm" : "text-sidebar-foreground hover:bg-sidebar-accent border-l-2 border-transparent"}`}
            data-testid="btn-tool-prompt"
          >
            <Library size={18} className={activeFeature === "prompt_library" ? "text-primary" : "text-muted-foreground"} />
            <span className="font-medium">Prompt Library</span>
          </button>

          <div className="mt-8 mb-2 px-2 flex items-center gap-2 text-xs font-semibold text-sidebar-foreground/50 uppercase tracking-wider">
            <History size={14} /> Recent
          </div>
          <div className="space-y-1">
            {generations.slice(0, 5).map(gen => (
              <div key={gen.id} className="relative group w-full text-left px-3 py-2 rounded-md hover:bg-sidebar-accent transition-colors text-sm text-sidebar-foreground/80 flex items-center justify-between">
                <button 
                  className="truncate flex-1 text-left"
                  onClick={() => {
                    setActiveFeature(gen.feature as GenerationInputFeature);
                    setInput(gen.input);
                    setCurrentResult(gen as unknown as GenerationResult); // cast to match result structure
                  }}
                  data-testid={`btn-history-${gen.id}`}
                >
                  {gen.input.substring(0, 25)}{gen.input.length > 25 ? '...' : ''}
                </button>
                <button
                  className="opacity-0 group-hover:opacity-100 p-1 text-muted-foreground hover:text-destructive transition-all"
                  onClick={(e) => handleDelete(e, gen.id)}
                  data-testid={`btn-delete-${gen.id}`}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinelinejoin="round">
                    <path d="M3 6h18"></path>
                    <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path>
                    <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path>
                  </svg>
                </button>
              </div>
            ))}
            {generations.length === 0 && (
              <div className="px-3 py-2 text-sm text-muted-foreground italic">No history yet</div>
            )}
          </div>
        </div>

        <div className="p-4 border-t border-sidebar-border bg-sidebar/50">
          <div className="flex items-center gap-2 text-xs font-semibold text-sidebar-foreground/50 uppercase tracking-wider mb-3">
            <BarChart2 size={14} /> Stats
          </div>
          <div className="flex justify-between text-sm mb-2">
            <span className="text-muted-foreground">Generations</span>
            <span className="font-semibold text-foreground">{stats?.totalGenerations || 0}</span>
          </div>
          <div className="flex justify-between text-sm mb-4">
            <span className="text-muted-foreground">Words</span>
            <span className="font-semibold text-foreground">{stats?.totalWords || 0}</span>
          </div>
        </div>
      </div>

      {/* Main Workspace */}
      <div className="flex-1 flex flex-col overflow-hidden relative">
        {/* Theme toggle — fixed corner icon */}
        <button
          onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
          className="absolute bottom-5 right-5 z-50 w-10 h-10 flex items-center justify-center rounded-full bg-card border border-border shadow-md hover:shadow-lg hover:scale-105 transition-all duration-200 text-foreground"
          data-testid="btn-theme-toggle"
          title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
        >
          {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
        </button>
        <header className="h-16 border-b border-border flex items-center px-6 bg-card/50 backdrop-blur-sm lg:hidden">
          <h1 className="text-2xl font-serif italic text-primary font-bold">ContentAI</h1>
        </header>

        <div className="flex-1 overflow-auto p-4 md:p-8 flex flex-col xl:flex-row gap-6">
          {/* Generator Form */}
          <div className={`w-full ${currentResult ? 'xl:w-1/3' : 'xl:w-1/2 mx-auto'} flex flex-col gap-5 transition-all duration-500`}>
            <div className="bg-card/80 backdrop-blur-md border border-border rounded-xl p-6 shadow-sm">
              <h2 className="text-xl font-serif italic font-semibold mb-6 flex items-center gap-2">
                <span className="w-1.5 h-6 bg-primary rounded-full inline-block"></span>
                Configure Generation
              </h2>
              
              <div className="space-y-5">
                <div>
                  <label className="block text-sm font-medium text-foreground/80 mb-1.5">Input</label>
                  <textarea
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder={getPlaceholder()}
                    className="w-full h-32 px-3 py-2 bg-background border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary text-sm resize-none transition-colors"
                    data-testid="input-generator"
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-foreground/80 mb-1.5">Audience</label>
                    <select 
                      value={audience}
                      onChange={(e) => setAudience(e.target.value)}
                      className="w-full px-3 py-2 bg-background border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary/50 text-sm"
                    >
                      <option value="Developers and Tech Enthusiasts">Developers & Tech Enthusiasts</option>
                      <option value="Beginner developers">Beginner Developers</option>
                      <option value="Students">Students</option>
                      <option value="Small business owners">Small Business Owners</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-foreground/80 mb-1.5">Tone</label>
                    <select 
                      value={tone}
                      onChange={(e) => setTone(e.target.value)}
                      className="w-full px-3 py-2 bg-background border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary/50 text-sm"
                    >
                      <option value="Professional">Professional</option>
                      <option value="Creative">Creative</option>
                      <option value="Beginner-friendly">Beginner-friendly</option>
                      <option value="Technical">Technical</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground/80 mb-1.5">Keywords (optional)</label>
                  <input
                    type="text"
                    value={keywords}
                    onChange={(e) => setKeywords(e.target.value)}
                    placeholder="react, web dev, performance"
                    className="w-full px-3 py-2 bg-background border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary/50 text-sm"
                  />
                </div>

                <button
                  onClick={handleGenerate}
                  disabled={generateMutation.isPending}
                  className="w-full py-3 px-4 bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary text-primary-foreground font-semibold rounded-lg shadow-md hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed disabled:transform-none"
                  data-testid="btn-generate"
                >
                  {generateMutation.isPending ? (
                    <><Loader2 size={18} className="animate-spin" /> Generating...</>
                  ) : (
                    <>Generate Content</>
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Results Display */}
          <AnimatePresence>
            {currentResult && (
              <motion.div 
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="flex-1 flex flex-col xl:flex-row gap-6 min-h-0"
              >
                {/* Generated Content Card */}
                <div className="flex-1 bg-card/80 backdrop-blur-md border border-border rounded-xl shadow-sm flex flex-col overflow-hidden">
                  <div className="p-4 border-b border-border flex items-center justify-between bg-card/50">
                    <h3 className="font-semibold text-foreground flex items-center gap-2">
                      Output Result
                    </h3>
                    <div className="flex gap-2">
                      <button 
                        onClick={handleGenerate}
                        disabled={generateMutation.isPending}
                        className="p-1.5 text-muted-foreground hover:text-foreground hover:bg-secondary rounded-md transition-colors"
                        title="New Version"
                      >
                        <RefreshCcw size={16} />
                      </button>
                      <button 
                        onClick={copyToClipboard}
                        className="p-1.5 text-muted-foreground hover:text-foreground hover:bg-secondary rounded-md transition-colors"
                        title="Copy"
                      >
                        <Copy size={16} />
                      </button>
                      <button 
                        onClick={downloadFile}
                        className="p-1.5 text-muted-foreground hover:text-foreground hover:bg-secondary rounded-md transition-colors"
                        title="Download"
                      >
                        <Download size={16} />
                      </button>
                    </div>
                  </div>
                  <div className="p-6 overflow-y-auto flex-1 prose dark:prose-invert max-w-none text-foreground bg-background/50">
                    {renderMarkdown(currentResult.result)}
                  </div>
                </div>

                {/* Score Card */}
                <div className="w-full xl:w-72 bg-card/80 backdrop-blur-md border border-border rounded-xl shadow-sm p-6 flex flex-col gap-6">
                  <h3 className="font-serif italic font-semibold text-lg text-center">Optimization Score</h3>
                  
                  <div className="flex justify-center my-4">
                    <div className="relative w-32 h-32">
                      <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                        <circle cx="50" cy="50" r="45" fill="none" stroke="currentColor" className="text-secondary" strokeWidth="8" />
                        <circle 
                          cx="50" cy="50" r="45" 
                          fill="none" 
                          stroke="currentColor" 
                          className="text-accent transition-all duration-1000 ease-out" 
                          strokeWidth="8" 
                          strokeDasharray="283" 
                          strokeDashoffset={283 - (283 * (currentResult.seoScore || 0)) / 100}
                        />
                      </svg>
                      <div className="absolute inset-0 flex items-center justify-center flex-col">
                        <span className="text-3xl font-bold">{currentResult.seoScore}</span>
                        <span className="text-xs text-muted-foreground">SEO</span>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4 flex-1">
                    <div className="flex justify-between items-center py-2 border-b border-border/50">
                      <span className="text-sm text-muted-foreground">Readability</span>
                      <span className="text-sm font-medium">{currentResult.readability}</span>
                    </div>
                    <div className="flex justify-between items-center py-2 border-b border-border/50">
                      <span className="text-sm text-muted-foreground">Tone Match</span>
                      <span className="text-sm font-medium">{currentResult.toneMatch}</span>
                    </div>
                    <div className="flex justify-between items-center py-2 border-b border-border/50">
                      <span className="text-sm text-muted-foreground">Word Count</span>
                      <span className="text-sm font-medium">{currentResult.wordCount}</span>
                    </div>
                    <div className="pt-2">
                      <span className="text-sm text-muted-foreground block mb-1">Keywords Used</span>
                      <div className="flex flex-wrap gap-1">
                        {currentResult.keywordsUsed.split(',').map((kw, i) => (
                          <span key={i} className="text-xs bg-secondary text-secondary-foreground px-2 py-1 rounded-md">
                            {kw.trim()}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
