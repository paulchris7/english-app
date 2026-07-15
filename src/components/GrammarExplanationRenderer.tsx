import React from "react";
import { 
  BookOpen, 
  Sparkles, 
  Compass, 
  Layers, 
  HelpCircle, 
  ChevronRight, 
  Info,
  CheckCircle2,
  Terminal,
  MessageSquareCode
} from "lucide-react";

interface GrammarExplanationRendererProps {
  explanation: string;
}

interface parsedElement {
  label: string;
  value: string;
}

interface parsedConcept {
  id: string;
  title: string;
  description: string;
  elements: parsedElement[];
}

export const GrammarExplanationRenderer: React.FC<GrammarExplanationRendererProps> = ({ explanation }) => {
  if (!explanation) return null;

  // Helper to remove custom divider lines that overflow screens
  const sanitizeText = (txt: string) => {
    return txt
      .replace(/### ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━/g, "")
      .replace(/━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━/g, "")
      .trim();
  };

  const lines = explanation.split("\n").map(l => l.trim()).filter(Boolean);
  
  // Let's identify the intro paragraph(s)
  let introParagraphs: string[] = [];
  let conceptBlocksRaw: string[][] = [];
  let currentBlock: string[] = [];
  
  let parsingConcepts = false;

  for (const line of lines) {
    const cleanLine = sanitizeText(line);
    if (!cleanLine) continue;

    // Detect concept boundaries
    const isConceptHeader = 
      cleanLine.toLowerCase().includes("concept ") || 
      cleanLine.startsWith("###") || 
      /^\d+\.\s+\*\*/.test(cleanLine); // Numbered lists like 1. **Title**

    if (isConceptHeader) {
      parsingConcepts = true;
      if (currentBlock.length > 0) {
        conceptBlocksRaw.push(currentBlock);
        currentBlock = [];
      }
    }

    if (!parsingConcepts) {
      introParagraphs.push(cleanLine);
    } else {
      currentBlock.push(cleanLine);
    }
  }
  
  if (currentBlock.length > 0) {
    conceptBlocksRaw.push(currentBlock);
  }

  // Parse each raw block into structured concept
  const parsedConcepts: parsedConcept[] = conceptBlocksRaw.map((block, idx) => {
    let title = "";
    let descriptionLines: string[] = [];
    let elements: parsedElement[] = [];

    // The first line should be the title
    let firstLine = block[0] || "";
    
    // Clean markdown headings from title
    title = firstLine
      .replace(/^###\s*/, "")
      .replace(/^💡\s*/, "")
      .replace(/^\d+\.\s*\*\*/, "") // Remove '1. **'
      .replace(/\*\*\s*$/, "") // Remove trailing '**'
      .replace(/\*\*:\s*/, "") // Remove '**: '
      .trim();

    // If title doesn't specify concept index, let's prepend one for consistency
    if (!title.toLowerCase().includes("concept")) {
      title = `Concept ${idx + 1}: ${title}`;
    }

    for (let i = 1; i < block.length; i++) {
      const line = block[i];
      
      // Check if it's a list item (Formula, Signal words, Example, etc.)
      const isListItem = line.startsWith("*") || line.startsWith("-") || line.startsWith("•");
      if (isListItem) {
        // Strip out leading bullet marker
        const itemContent = line.replace(/^[\*\-\•]\s*/, "").trim();
        
        // Try to find a label (e.g. **Formula:** or **Example:**)
        const labelMatch = itemContent.match(/^\*\*([^*:]+):\*\*\s*(.*)/);
        if (labelMatch) {
          elements.push({
            label: labelMatch[1].trim(),
            value: labelMatch[2].trim()
          });
        } else {
          // No clear label, might be a general example
          if (itemContent.toLowerCase().startsWith("example")) {
            const cleanEx = itemContent.replace(/^example:\s*/i, "").trim();
            elements.push({ label: "Example", value: cleanEx });
          } else {
            elements.push({ label: "Note", value: itemContent });
          }
        }
      } else {
        descriptionLines.push(line);
      }
    }

    return {
      id: `concept-${idx}`,
      title,
      description: descriptionLines.join(" "),
      elements
    };
  });

  // Render a nice clean text highlight formatting helper
  const renderTextWithHighlights = (text: string) => {
    if (!text) return "";
    
    // Replace markdown bold '**text**' with styled bold spans
    // Replace italic '*text*' or '_text_' with styled italic spans
    // Replace inline code '`code`' with code blocks
    
    let parts: React.ReactNode[] = [];
    let currentStr = text;
    
    // Let's do a simple regex mapping for high-quality inline styling
    // We will render it directly by substituting tokens
    // For safety, let's return a nicely formatted output
    
    // Remove starting/ending quotes if any
    let cleanText = text.replace(/^["'“”‘](.*)["'“”’]$/, "$1");
    
    // Simple inline parser for markdown inside our structured blocks
    const regex = /(\*\*[^*]+\*\*|`[^`]+`|\*[^*]+\*)/g;
    const tokens = cleanText.split(regex);
    
    return tokens.map((token, i) => {
      if (token.startsWith("**") && token.endsWith("**")) {
        return <strong key={i} className="text-indigo-950 font-bold bg-indigo-50/70 px-1 py-0.5 rounded text-indigo-900 border border-indigo-100/30">{token.slice(2, -2)}</strong>;
      }
      if (token.startsWith("`") && token.endsWith("`")) {
        return <code key={i} className="font-mono text-xs text-rose-600 bg-rose-50 border border-rose-100 px-1.5 py-0.5 rounded-md mx-0.5 font-bold">{token.slice(1, -1)}</code>;
      }
      if (token.startsWith("*") && token.endsWith("*")) {
        return <em key={i} className="text-slate-800 not-italic font-medium bg-emerald-50/50 text-emerald-900 border-b-2 border-emerald-300/40 px-1">{token.slice(1, -1)}</em>;
      }
      return <span key={i}>{token}</span>;
    });
  };

  return (
    <div className="space-y-8 mt-4">
      {/* Intro section if present */}
      {introParagraphs.length > 0 && (
        <div className="bg-slate-50 border border-slate-100 rounded-2xl p-5 shadow-xs flex items-start gap-4">
          <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
            <Compass className="w-5 h-5 animate-pulse" />
          </div>
          <div className="space-y-1">
            <h5 className="text-xs font-bold text-slate-400 uppercase tracking-widest font-mono">Overview & Context</h5>
            <p className="text-sm font-medium text-slate-600 leading-relaxed">
              {introParagraphs.join(" ")}
            </p>
          </div>
        </div>
      )}

      {/* Structured concept list */}
      {parsedConcepts.length > 0 ? (
        <div className="space-y-6">
          {parsedConcepts.map((concept, cIdx) => (
            <div 
              key={concept.id}
              className="bg-white border border-rose-100/60 rounded-3xl p-6 shadow-xs relative overflow-hidden flex flex-col md:flex-row gap-6 hover:shadow-sm transition-all"
            >
              {/* Vertical side badge for active concept */}
              <div className="absolute top-0 left-0 w-2 h-full bg-gradient-to-b from-indigo-500 to-violet-500" />
              
              {/* Left visual signifier block */}
              <div className="md:w-12 shrink-0 flex md:flex-col items-center justify-between md:justify-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold text-sm shadow-xs border border-indigo-100/30">
                  0{cIdx + 1}
                </div>
                <div className="hidden md:block h-full border-l-2 border-dashed border-indigo-100/60 my-2" />
              </div>

              {/* Right content container */}
              <div className="flex-1 space-y-4">
                <div className="space-y-1.5">
                  <h4 className="font-display font-black text-lg text-slate-900 tracking-tight flex items-center gap-2">
                    <span className="text-indigo-600">💡</span> {concept.title}
                  </h4>
                  {concept.description && (
                    <p className="text-sm text-slate-600 leading-relaxed font-medium">
                      {renderTextWithHighlights(concept.description)}
                    </p>
                  )}
                </div>

                {/* Elements lists (Formulas, Signal words, Examples) rendered beautifully */}
                {concept.elements.length > 0 && (
                  <div className="grid grid-cols-1 gap-3 mt-3">
                    {concept.elements.map((el, eIdx) => {
                      const labelLower = el.label.toLowerCase();
                      
                      // Custom styled containers depending on the element label
                      if (labelLower.includes("formula")) {
                        return (
                          <div 
                            key={eIdx}
                            className="bg-indigo-50/30 border border-indigo-100/80 rounded-2xl p-4.5 space-y-2 flex items-start gap-4"
                          >
                            <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0 border border-indigo-100/50">
                              <Terminal className="w-4 h-4" />
                            </div>
                            <div className="space-y-1">
                              <span className="text-[10px] font-extrabold uppercase text-indigo-500 tracking-widest font-mono">Structural Pattern</span>
                              <div className="text-sm font-mono font-bold text-indigo-950 bg-white/70 border border-indigo-100/30 px-3 py-1.5 rounded-xl inline-block shadow-xxs">
                                {renderTextWithHighlights(el.value)}
                              </div>
                            </div>
                          </div>
                        );
                      }

                      if (labelLower.includes("signal") || labelLower.includes("marker")) {
                        return (
                          <div 
                            key={eIdx}
                            className="bg-amber-50/20 border border-amber-100/50 rounded-2xl p-4.5 space-y-2 flex items-start gap-4"
                          >
                            <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center shrink-0 border border-amber-100/40">
                              <Sparkles className="w-4 h-4 animate-pulse" />
                            </div>
                            <div className="space-y-1">
                              <span className="text-[10px] font-extrabold uppercase text-amber-600 tracking-widest font-mono">Trigger Words & Keys</span>
                              <p className="text-sm text-slate-700 leading-relaxed font-medium">
                                {renderTextWithHighlights(el.value)}
                              </p>
                            </div>
                          </div>
                        );
                      }

                      if (labelLower.includes("example")) {
                        return (
                          <div 
                            key={eIdx}
                            className="bg-rose-50/20 border border-rose-100/60 rounded-2xl p-4.5 space-y-2 flex items-start gap-4 relative overflow-hidden"
                          >
                            <div className="absolute right-2 bottom-0 text-rose-100/30 font-black text-6xl pointer-events-none select-none font-display">”</div>
                            <div className="w-8 h-8 rounded-lg bg-rose-50 text-rose-500 flex items-center justify-center shrink-0 border border-rose-100/40">
                              <MessageSquareCode className="w-4 h-4" />
                            </div>
                            <div className="space-y-1 relative z-10">
                              <span className="text-[10px] font-extrabold uppercase text-rose-500 tracking-widest font-mono">Contextual Example</span>
                              <p className="text-sm text-slate-900 leading-relaxed font-semibold italic">
                                {renderTextWithHighlights(el.value)}
                              </p>
                            </div>
                          </div>
                        );
                      }

                      // Default fall-back card style
                      return (
                        <div 
                          key={eIdx} 
                          className="bg-slate-50/50 border border-slate-100 rounded-2xl p-4.5 space-y-2 flex items-start gap-4"
                        >
                          <div className="w-8 h-8 rounded-lg bg-slate-100 text-slate-500 flex items-center justify-center shrink-0 border border-slate-200/50">
                            <Info className="w-4 h-4" />
                          </div>
                          <div className="space-y-0.5">
                            <span className="text-[10px] font-extrabold uppercase text-slate-500 tracking-widest font-mono">{el.label}</span>
                            <p className="text-sm text-slate-700 leading-relaxed font-medium">
                              {renderTextWithHighlights(el.value)}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* Fallback if parsing didn't create chunks */
        <div className="bg-white border border-rose-50 rounded-3xl p-6 leading-relaxed text-sm text-slate-600 whitespace-pre-wrap font-medium">
          {explanation}
        </div>
      )}
    </div>
  );
};
