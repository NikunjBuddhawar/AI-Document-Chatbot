// Import React and required hooks
import React, { useState, useRef, useEffect, useMemo } from "react";
import "./App.css";

function App() {
  // State to store the user's question
  const [question, setQuestion] = useState("");
  
  // State to store the page number entered by user
  const [pageNumber, setPageNumber] = useState("");

  // State to store the ongoing Q&A conversation
  const [conversation, setConversation] = useState([]);

  // State to handle loading status during API calls
  const [loading, setLoading] = useState(false);

  // State to store the uploaded PDF file
  const [pdfFile, setPdfFile] = useState(null);

  // State to hold the document ID returned by backend after upload
  const [docId, setDocId] = useState("");

  // Memoized URL to view the uploaded PDF
  const pdfUrl = useMemo(() => {
    return pdfFile ? URL.createObjectURL(pdfFile) : null;
  }, [pdfFile]);

  // Ref to handle the file input element
   const fileInputRef = useRef(null);
  // Function to handle asking a question about the uploaded PDF(checks if user entered a question,page number and if the pdf is uploaded or not.)
  const handleAsk = async () => {
    if (!question.trim() || !docId || pageNumber === "") return;

    // Add a placeholder "Thinking..." entry to the conversation
    const newEntry = { question: `(${pageNumber}) ${question}`, answer: "Thinking..." };
    setConversation((prev) => [...prev, newEntry]);
    setQuestion("");
    setLoading(true);

    try {
      // Prepare form data for the backend request
      const formData = new FormData();
      formData.append("doc_id", docId);
      formData.append("question", question);
      formData.append("page_number", parseInt(pageNumber) - 1); 

      // Send POST request to ask question
      const res = await fetch("http://localhost:8000/ask/", {
        method: "POST",
        body: formData,
      });

      // Handle response and update answer
      const data = await res.json();
      const answer = data.answer || data.error || "No answer received";

      setConversation((prev) =>
        prev.map((entry, i) =>
          i === prev.length - 1 ? { ...entry, answer } : entry
        )
      );
    } catch (err) {
      // Handle error and display it in chat
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

  // Function to handle uploading a PDF file
  const handlePdfUpload = async () => {
    if (!pdfFile) return;

    const formData = new FormData();
    formData.append("file", pdfFile);

    try {
      // Send POST request to upload PDF
      const res = await fetch("http://localhost:8000/upload/", {
        method: "POST",
        body: formData,
      });

      // Handle response from server
      const data = await res.json();
      if (data.doc_id) setDocId(data.doc_id); // Stores the doc_id for future Q & A.  
      alert(data.message || data.error); // Shows a pop up with sucess or error message.
    } catch (err) {
      alert("Upload failed: " + err.message); // Handles the error.
    }
  };

  return (
    <div className="app-container">
      {/* Navigation bar with logo and upload section */}
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

      {/* Main layout with chat and PDF view panes */}
      <div className="main-layout">
        {/* Chat section */}
        <div className="chat-pane">
          <div className="chat-area">
            {/* Placeholder before file is uploaded */}
            {!pdfFile && (
              <div className="chat-placeholder">
                Upload a PDF to simplify, summarize, and chat with your document.
              </div>
            )}
            {/* Render conversation history */}
            {conversation.map((entry, index) => (
              <div key={index} className="chat-entry">
                <div className="question-bubble">Q: {entry.question}</div>
                <div className="answer-bubble">A: {entry.answer}</div>
              </div>
            ))}
          </div>

          {/* Input area for page number and question */}
          <div className="input-area">
            <input
              type="text"
              placeholder="Page number"
              value={pageNumber}
              onChange={(e) => setPageNumber(e.target.value)}
              style={{ width: "100px", marginRight: "5px" }}
            />
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

        {/* PDF preview pane */}
        <div className="pdf-pane">
          {pdfFile ? (
            <iframe src={pdfUrl} title="PDF Viewer" className="pdf-viewer" />
          ) : (
            <div className="pdf-placeholder-container">
              <div className="upload-circle">Upload a PDF to view at it</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default App;
