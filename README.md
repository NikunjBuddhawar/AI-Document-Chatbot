# 🔮 NEON SPIRE: AI-Powered PDF Chatbot

A web application that lets users **upload a PDF and chat with it using natural language**. Ask questions like “Summarize this contract” or “What are the key dates?”, and get contextual answers with highlighted sources. The app is powered by an AI backend that understands document structure and extracts relevant information intelligently.

---

## 🚀 Features

- 📄 Upload and preview PDF documents
- 💬 Ask questions about document contents
- ✨ Highlight source text used to generate each answer
- ⚡ Real-time answers using Phi 1.5 model
- 🔐 No cloud upload – runs locally

---

## 🛠️ Tech Stack

| Layer       | Stack Used                         |
|-------------|-------------------------------------|
| Frontend    | React, React-PDF, CSS Modules       |
| Backend     | FastAPI, Uvicorn, Python            |
| AI Model    | Phi 1.5 (Open-source LLM)           |
| PDF Parsing | PyMuPDF or pdfminer.six             |
| File Handling | FormData API, Local Object URLs  |

---

## 📦 Setup Instructions

### 1. Clone the Repository

```bash
git clone https://github.com/your-username/AI-Document-Chatbot.git
cd AI-Document-Chatbot
```

### 2. Frontend Setup (React)

```bash
cd ../frontend
npm install
npm start
```

### 3. Backend Setup (FastAPI)

```bash
cd backend
python -m venv venv
source venv/bin/activate  # or venv\Scripts\activate on Windows
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

## 📁 Project Structure

```text
phi-qa-app/
├── backend/        # FastAPI backend (routes, models, logic)
├── frontend/       # React frontend (UI + chat + PDF viewer)
├── llama-cpp/      # Local Phi 1.5 runner (llama-cpp engine)
├── .gitignore      # Files to ignore in version control
└── README.md       # This file
```

## 🌱 Future Enhancements

- 💾 **Save to WhatsApp for Revision**  
  Add a "Save" button next to each Q&A that lets users send the selected question-answer pair to their WhatsApp for future review and spaced repetition.

- 🟨 **Answer Highlighting in PDF**  
  Highlight the exact regions in the PDF document that were used to generate the AI answer, providing transparency and context traceability.

- 🧠 **Chat Memory (Session Awareness)**  
  Store chat history per document to enable follow-up questions and maintain context across multiple turns.

- 🗂️ **Support for More File Types**  
  Extend support beyond PDFs to include Word (`.docx`), plain text (`.txt`), and CSV files for broader document compatibility.

- 🌐 **Multi-language Q&A**  
  Add support for asking and answering questions in multiple languages, starting with Hindi, Spanish, and French.


