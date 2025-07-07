import React, { useState, useRef, useMemo } from "react";
import "./App.css";

function App() {
  const [question, setQuestion] = useState("");
  const [conversation, setConversation] = useState([]);
  const [loading, setLoading] = useState(false);
  const [pdfFile, setPdfFile] = useState(null);
  const [docId, setDocId] = useState("");

  const pdfUrl = useMemo(() => {
    return pdfFile ? URL.createObjectURL(pdfFile) : null;
  }, [pdfFile]);

  const fileInputRef = useRef(null);

  const handleAsk = async () => {
    if (!question.trim() || !docId) return;

    const newEntry = { question, answer: "Thinking..." };
    setConversation((prev) => [...prev, newEntry]);
    setQuestion("");
    setLoading(true);

    try {
      const formData = new FormData();
      formData.append("doc_id", docId);
      formData.append("question", question);

      const res = await fetch("http://localhost:8000/ask/", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      const answer = data.answer || data.error || "No answer received";

      setConversation((prev) =>
        prev.map((entry, i) =>
          i === prev.length - 1 ? { ...entry, answer } : entry
        )
      );
    } catch (err) {
      setConversation((prev) =>
        prev.map((entry, i) =>
          i === prev.length - 1
            ? { ...entry, answer: "Error: " + err.message }
            : entry
        )
      );
    } finally {
      setLoading(false);
    }
  };

  const handlePdfUpload = async () => {
    if (!pdfFile) return;

    const formData = new FormData();
    formData.append("file", pdfFile);

    try {
      const res = await fetch("http://localhost:8000/upload/", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (data.doc_id) setDocId(data.doc_id);
      alert(data.message || data.error);
    } catch (err) {
      alert("Upload failed: " + err.message);
    }
  };

  return (
    <div className="app-container">
      <div className="navbar">
        <div className="logo">NEON SPIRE</div>
        <div className="upload-box">
          <label className="custom-upload">
            <input
              ref={fileInputRef}
              type="file"
              accept="application/pdf"
              onChange={(e) => setPdfFile(e.target.files[0])}
            />
            <span>{pdfFile ? pdfFile.name : "Upload a file"}</span>
          </label>
          <button onClick={handlePdfUpload}>Upload PDF</button>
        </div>
      </div>

      <div className="main-layout">
        <div className="chat-pane">
          <div className="chat-area">
            {!pdfFile && (
              <div className="chat-placeholder">
                Upload a PDF to simplify, summarize, and chat with your document.
              </div>
            )}
            {conversation.map((entry, index) => (
              <div key={index} className="chat-entry">
                <div className="question-bubble">Q: {entry.question}</div>
                <div className="answer-bubble">A: {entry.answer}</div>
              </div>
            ))}
          </div>

          {/* 🔥 Updated input area (no page number) */}
          <div className="input-area">
            <input
              type="text"
              placeholder="Ask a question..."
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleAsk()}
            />
            <button onClick={handleAsk} disabled={loading || !docId}>
              {loading ? "..." : "Send"}
            </button>
          </div>
        </div>

        <div className="pdf-pane">
          {pdfFile ? (
            <iframe src={pdfUrl} title="PDF Viewer" className="pdf-viewer" />
          ) : (
            <div className="pdf-placeholder-container">
              <div className="upload-circle">Upload a PDF to view it</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default App;
