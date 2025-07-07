from fastapi import FastAPI, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
import os, shutil, fitz
from uuid import uuid4
from llama_cpp import Llama
from sentence_transformers import SentenceTransformer
import faiss
import numpy as np
import re
import traceback

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

UPLOAD_DIR = "uploaded_pdfs"
os.makedirs(UPLOAD_DIR, exist_ok=True)

doc_store = {}         # doc_id -> list of chunks
embedding_store = {}   # doc_id -> { "index": faiss.Index, "texts": [chunk1, chunk2, ...] }

try:
    print("🚀 Loading Phi-1.5 model...")
    llm = Llama(model_path="models/phi-1_5-Q4_K_M.gguf", n_ctx=2048, n_threads=4)
    print("✅ Model loaded successfully.")
except Exception as e:
    print(f"❌ Failed to load model: {e}")
    llm = None

print("🔎 Loading embedding model...")
embedder = SentenceTransformer("all-MiniLM-L6-v2")
print("✅ Embedding model loaded.")

def fallback_sent_tokenize(text):
    return re.split(r'(?<=[.!?])\s+', text.strip())

@app.post("/upload/")
async def upload_pdf(file: UploadFile = File(...)):
    if not file.filename.endswith(".pdf"): 
        return {"error": "Only PDF files are allowed."}

    doc_id = str(uuid4())
    file_path = os.path.join(UPLOAD_DIR, f"{doc_id}.pdf")
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    all_sentences = []
    try:
        with fitz.open(file_path) as doc:
            for i, page in enumerate(doc):
                text = page.get_text()
                if text.strip():
                    sentences = fallback_sent_tokenize(text)
                    all_sentences.extend(sentences)
    except Exception as e:
        return {"error": f"PDF parsing failed: {e}"}

    if not all_sentences:
        return {"error": "No extractable text found in PDF."}

    try:
        doc_store[doc_id] = all_sentences
        embeddings = embedder.encode(all_sentences)
        dimension = embeddings.shape[1]
        index = faiss.IndexFlatL2(dimension)
        index.add(np.array(embeddings))
        embedding_store[doc_id] = {"index": index, "texts": all_sentences}
    except Exception as e:
        return {"error": f"Embedding generation failed: {e}"}

    return {"message": "File uploaded successfully.", "doc_id": doc_id, "total_chunks": len(all_sentences)}


@app.post("/ask/")
async def ask_question(doc_id: str = Form(...), question: str = Form(...)):
    try:
        if llm is None:
            return {"error": "Language model not loaded."}

        if doc_id not in embedding_store:
            return {"error": "Invalid document ID."}

        question_embedding = embedder.encode([question])[0]
        index = embedding_store[doc_id]["index"]
        texts = embedding_store[doc_id]["texts"]

        D, I = index.search(np.array([question_embedding]), k=6)
        selected_texts = [texts[i] for i in I[0] if i < len(texts)]

        context = "\n".join(selected_texts)
        max_prompt_tokens = 2048 - 200
        while len(context.split()) > max_prompt_tokens:
            selected_texts = selected_texts[:-1]
            context = "\n".join(selected_texts)

        prompt = (
            "Use the following document context to answer the question.\n"
            "Answer strictly based on the text. Do not guess.\n"
            f"Context:\n{context}\n\nQuestion: {question}\nAnswer:"
        )

        output = llm(prompt, max_tokens=200, stop=["\nQ:", "\nQuestion:"], echo=False)

        if "choices" not in output or not output["choices"]:
            return {"error": "Model returned no choices."}

        answer = output["choices"][0].get("text", "").strip()

        return {
            "answer": answer,
            "source_chunks": selected_texts
        }

    except Exception as e:
        traceback_str = traceback.format_exc()
        print("❌ Exception during /ask/:", traceback_str)
        return {
            "error": "Internal server error",
            "details": str(e),
            "trace": traceback_str
        }
