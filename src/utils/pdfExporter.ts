interface VocabularyItem {
  word: string;
  definition: string;
}

interface Verb {
  base: string;
  past_simple: string;
  past_participle: string;
  meaning: string;
  example: string;
}

interface Lesson {
  id: number;
  title: string;
  grammar: {
    title: string;
    explanation: string;
  };
  vocabulary: {
    theme: string;
    items: VocabularyItem[];
  };
  verbs: Verb[];
}

// Helper to remove custom divider lines
const sanitizeTextForPrint = (txt: string) => {
  return txt
    .replace(/### ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━/g, "")
    .replace(/━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━/g, "")
    .trim();
};

export const exportLessonToPrintPDF = (lesson: Lesson) => {
  if (!lesson) return;

  // --- PARSE GRAMMAR EXPLANATION INTO CONCEPTS (SAME ROBUST PARSER AS RENDERER) ---
  const explanation = lesson.grammar.explanation || "";
  const lines = explanation.split("\n").map(l => l.trim()).filter(Boolean);
  
  let introParagraphs: string[] = [];
  let conceptBlocksRaw: string[][] = [];
  let currentBlock: string[] = [];
  let parsingConcepts = false;

  for (const line of lines) {
    const cleanLine = sanitizeTextForPrint(line);
    if (!cleanLine) continue;

    const isConceptHeader = 
      cleanLine.toLowerCase().includes("concept ") || 
      cleanLine.startsWith("###") || 
      /^\d+\.\s+\*\*/.test(cleanLine);

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

  interface PrintElement {
    label: string;
    value: string;
  }
  interface PrintConcept {
    title: string;
    description: string;
    elements: PrintElement[];
  }

  const parsedConcepts: PrintConcept[] = conceptBlocksRaw.map((block, idx) => {
    let title = "";
    let descriptionLines: string[] = [];
    let elements: PrintElement[] = [];

    let firstLine = block[0] || "";
    title = firstLine
      .replace(/^###\s*/, "")
      .replace(/^💡\s*/, "")
      .replace(/^\d+\.\s*\*\*/, "")
      .replace(/\*\*\s*$/, "")
      .replace(/\*\*:\s*/, "")
      .trim();

    if (!title.toLowerCase().includes("concept")) {
      title = `Concept ${idx + 1}: ${title}`;
    }

    for (let i = 1; i < block.length; i++) {
      const line = block[i];
      const isListItem = line.startsWith("*") || line.startsWith("-") || line.startsWith("•");
      if (isListItem) {
        const itemContent = line.replace(/^[\*\-\•]\s*/, "").trim();
        const labelMatch = itemContent.match(/^\*\*([^*:]+):\*\*\s*(.*)/);
        if (labelMatch) {
          elements.push({
            label: labelMatch[1].trim(),
            value: labelMatch[2].trim()
          });
        } else {
          if (itemContent.toLowerCase().startsWith("example")) {
            elements.push({ label: "Example", value: itemContent.replace(/^example:\s*/i, "").trim() });
          } else {
            elements.push({ label: "Note", value: itemContent });
          }
        }
      } else {
        descriptionLines.push(line);
      }
    }

    return {
      title,
      description: descriptionLines.join(" "),
      elements
    };
  });

  // Simple HTML inline markdown replacement helper for high-quality printing
  const formatTextHtml = (text: string) => {
    if (!text) return "";
    let clean = text.replace(/^["'“”‘](.*)["'“”’]$/, "$1");
    // **bold** -> <strong>
    clean = clean.replace(/\*\*([^*]+)\*\*/g, '<strong style="color: #1e1b4b; font-weight: 700;">$1</strong>');
    // *italic* -> <em>
    clean = clean.replace(/\*([^*]+)\*/g, '<em style="color: #0d9488; font-style: italic;">$1</em>');
    // `code` -> <code>
    clean = clean.replace(/`([^`]+)`/g, '<code style="font-family: monospace; font-size: 0.9em; background-color: #f3f4f6; color: #b91c1c; padding: 1px 4px; border-radius: 4px;">$1</code>');
    return clean;
  };

  // Build the print iframe contents
  const iframe = document.createElement("iframe");
  iframe.style.position = "fixed";
  iframe.style.right = "0";
  iframe.style.bottom = "0";
  iframe.style.width = "0";
  iframe.style.height = "0";
  iframe.style.border = "0";
  iframe.id = "lesson-pdf-iframe";
  
  document.body.appendChild(iframe);

  const doc = iframe.contentDocument || iframe.contentWindow?.document;
  if (!doc) return;

  const grammarHtml = parsedConcepts.map((concept, cIdx) => `
    <div style="background-color: #ffffff; border-left: 4px solid #4f46e5; border-radius: 8px; padding: 16px; margin-bottom: 20px; box-shadow: 0 1px 3px rgba(0,0,0,0.05); page-break-inside: avoid;">
      <h3 style="font-family: 'Outfit', 'Inter', sans-serif; font-size: 1.15rem; color: #0f172a; margin-top: 0; margin-bottom: 8px; display: flex; align-items: center; font-weight: 700;">
        <span style="margin-right: 8px;">💡</span> ${concept.title}
      </h3>
      ${concept.description ? `<p style="font-size: 0.95rem; color: #475569; margin-top: 0; margin-bottom: 12px; line-height: 1.5;">${formatTextHtml(concept.description)}</p>` : ""}
      
      ${concept.elements.length > 0 ? `
        <div style="display: flex; flex-direction: column; gap: 8px;">
          ${concept.elements.map(el => {
            const isFormula = el.label.toLowerCase().includes("formula");
            const isExample = el.label.toLowerCase().includes("example");
            const bgColor = isFormula ? "#f5f3ff" : isExample ? "#fff1f2" : "#f8fafc";
            const borderCol = isFormula ? "#ddd6fe" : isExample ? "#ffe4e6" : "#e2e8f0";
            const labelCol = isFormula ? "#4f46e5" : isExample ? "#e11d48" : "#64748b";

            return `
              <div style="background-color: ${bgColor}; border: 1px solid ${borderCol}; border-radius: 6px; padding: 10px 14px; display: flex; align-items: flex-start; gap: 10px;">
                <div style="font-size: 0.7rem; font-weight: 800; text-transform: uppercase; letter-spacing: 0.05em; color: ${labelCol}; min-width: 80px; margin-top: 2px;">
                  ${el.label}
                </div>
                <div style="font-size: 0.9rem; color: #1e293b; font-family: ${isFormula ? "monospace" : "inherit"}; font-weight: ${isExample ? "600" : "500"};">
                  ${formatTextHtml(el.value)}
                </div>
              </div>
            `;
          }).join("")}
        </div>
      ` : ""}
    </div>
  `).join("");

  const vocabHtml = lesson.vocabulary.items.map((item, idx) => `
    <div style="background-color: #fafaf9; border: 1px solid #e7e5e4; border-radius: 8px; padding: 12px; page-break-inside: avoid; display: flex; flex-direction: column; gap: 4px;">
      <div style="display: flex; justify-content: space-between; align-items: center;">
        <span style="font-family: 'Outfit', 'Inter', sans-serif; font-weight: 700; font-size: 1rem; color: #1c1917;">
          ${item.word}
        </span>
        <span style="font-size: 0.7rem; font-family: monospace; color: #a8a29e; background-color: #f5f5f4; padding: 2px 6px; border-radius: 4px; font-weight: bold;">
          W-${idx + 1}
        </span>
      </div>
      <p style="font-size: 0.85rem; color: #57534e; margin: 0; line-height: 1.4;">
        ${item.definition}
      </p>
    </div>
  `).join("");

  const verbsHtml = lesson.verbs.map(v => `
    <tr style="border-bottom: 1px solid #f1f5f9; page-break-inside: avoid;">
      <td style="padding: 12px 10px; font-weight: 700; color: #0f172a; font-size: 0.9rem;">${v.base}</td>
      <td style="padding: 12px 10px; font-weight: 600; color: #4f46e5; font-size: 0.9rem; font-family: monospace;">${v.past_simple}</td>
      <td style="padding: 12px 10px; font-weight: 600; color: #0d9488; font-size: 0.9rem; font-family: monospace;">${v.past_participle}</td>
      <td style="padding: 12px 10px; color: #334155; font-size: 0.85rem; line-height: 1.3;">${v.meaning}</td>
      <td style="padding: 12px 10px; color: #64748b; font-style: italic; font-size: 0.82rem; line-height: 1.3;">${formatTextHtml(v.example)}</td>
    </tr>
  `).join("");

  const contentHtml = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>${lesson.title} Study Guide</title>
      <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Outfit:wght@700;800&display=swap" rel="stylesheet">
      <style>
        body {
          font-family: 'Inter', sans-serif;
          color: #334155;
          margin: 0;
          padding: 40px;
          background-color: #ffffff;
          line-height: 1.5;
        }
        @media print {
          body {
            padding: 0;
            margin: 0;
          }
          @page {
            size: A4;
            margin: 1.5cm;
          }
        }
        .header {
          border-bottom: 3px double #e2e8f0;
          padding-bottom: 24px;
          margin-bottom: 30px;
          text-align: center;
        }
        .brand {
          font-family: 'Outfit', sans-serif;
          font-weight: 800;
          font-size: 0.85rem;
          color: #e11d48;
          text-transform: uppercase;
          letter-spacing: 0.15em;
          margin-bottom: 6px;
        }
        .title {
          font-family: 'Outfit', sans-serif;
          font-weight: 700;
          font-size: 1.8rem;
          color: #0f172a;
          margin: 0 0 10px 0;
          letter-spacing: -0.02em;
        }
        .subtitle {
          font-size: 0.9rem;
          color: #64748b;
          margin: 0;
          font-weight: 500;
        }
        .section-title {
          font-family: 'Outfit', sans-serif;
          font-size: 1.25rem;
          color: #0f172a;
          border-bottom: 2px solid #f1f5f9;
          padding-bottom: 6px;
          margin-top: 35px;
          margin-bottom: 18px;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          font-weight: 700;
          page-break-after: avoid;
        }
        .vocab-grid {
          display: grid;
          grid-template-cols: 1fr 1fr;
          gap: 16px;
        }
        @media print {
          .vocab-grid {
            display: grid;
            grid-template-cols: 1fr 1fr;
            gap: 14px;
          }
        }
        .verb-table {
          width: 100%;
          border-collapse: collapse;
          margin-top: 10px;
        }
        .verb-table th {
          background-color: #f8fafc;
          border-bottom: 2px solid #e2e8f0;
          color: #475569;
          font-weight: 700;
          font-size: 0.75rem;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          padding: 10px;
          text-align: left;
        }
        .footer {
          margin-top: 40px;
          border-top: 1px solid #e2e8f0;
          padding-top: 15px;
          text-align: center;
          font-size: 0.75rem;
          color: #94a3b8;
          page-break-inside: avoid;
        }
      </style>
    </head>
    <body>
      <div class="header">
        <div class="brand">English for Biosciences Study Suite</div>
        <h1 class="title">${lesson.title} Study Companion</h1>
        <p class="subtitle">Complete Study & Offline Practice Guide • Self-Acquisition Material</p>
      </div>

      ${introParagraphs.length > 0 ? `
        <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 14px 18px; margin-bottom: 25px;">
          <p style="margin: 0; font-size: 0.9rem; color: #475569; line-height: 1.5; font-weight: 500;">
            <strong style="color: #0f172a;">Overview:</strong> ${introParagraphs.join(" ")}
          </p>
        </div>
      ` : ""}

      <div class="section-title">I. Grammar & Core Mechanisms</div>
      <div>
        ${grammarHtml}
      </div>

      <div class="section-title" style="margin-top: 40px;">II. Themed Vocabulary Core (${lesson.vocabulary.theme})</div>
      <div class="vocab-grid">
        ${vocabHtml}
      </div>

      <div class="section-title" style="margin-top: 40px; page-break-before: auto;">III. Foundational Action Verbs (Core 5)</div>
      <table class="verb-table">
        <thead>
          <tr>
            <th style="width: 12%;">Base</th>
            <th style="width: 16%;">Past Simple</th>
            <th style="width: 16%;">Past Participle</th>
            <th style="width: 28%;">Meaning</th>
            <th style="width: 28%;">Contextual Example</th>
          </tr>
        </thead>
        <tbody>
          ${verbsHtml}
        </tbody>
      </table>

      <div class="footer">
        © 2026 English for Biosciences Study Suite • Designed for offline linguistic fluency.
      </div>
    </body>
    </html>
  `;

  doc.open();
  doc.write(contentHtml);
  doc.close();

  iframe.onload = () => {
    // Let style sheets & fonts load briefly, then open printer
    setTimeout(() => {
      if (iframe.contentWindow) {
        iframe.contentWindow.focus();
        iframe.contentWindow.print();
        // Remove iframe after user closes print prompt
        setTimeout(() => {
          document.body.removeChild(iframe);
        }, 60000); // Keep it around a bit in case they retry printing
      }
    }, 500);
  };
};
