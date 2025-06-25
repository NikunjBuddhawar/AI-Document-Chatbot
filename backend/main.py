from fastapi import FastAPI, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
import os, shutil, fitz
from uuid import uuid4
from llama_cpp import Llama

## Initialise the app.
app = FastAPI()

## Adds CORS middleware so that frontends(like react) can send request without getting blocked.
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

UPLOAD_DIR = "uploaded_pdfs"
os.makedirs(UPLOAD_DIR, exist_ok=True)

doc_store = {}

# Load local Phi-1.5 model
print("🚀 Loading Phi-1.5 model...")
llm = Llama(model_path="models/phi-1_5-Q4_K_M.gguf", n_ctx=2048, n_threads=4)
print("✅ Model loaded successfully.")


@app.post("/upload/")

async def upload_pdf(file: UploadFile = File(...)):
    if not file.filename.endswith(".pdf"): 
        return {"error": "Only PDF files are allowed."}  ## Checks if the file is a pdf or not.
    
    doc_id = str(uuid4()) ## Creates a uique uuid for the uploaded document.
    file_path = os.path.join(UPLOAD_DIR, f"{doc_id}.pdf")
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer) ## Basically stores the pdf in the uploaded_pdf folder.

    pages = []
    with fitz.open(file_path) as doc:
        for page in doc:
            pages.append(page.get_text()) ## Using fitz it opens every page of the pdf extracts text from it and stores it in the pages list.

    ## then stores that pages list in the doc_store dictionary with doc_id as the key.
    doc_store[doc_id] = pages
    return {"message": "File uploaded successfully.", "doc_id": doc_id, "total_pages": len(pages)}



@app.post("/ask/") ## Endpoint for asking a question.
async def ask_question(
    doc_id: str = Form(...), 
    question: str = Form(...),
    page_number: int = Form(...)

    ## All these values will come from the frontend form once the user enters a question.
):
    try:
        ## Checks if the doc_id is invalid or if the page number given is out of bounds.
        pages = doc_store.get(doc_id)
        if not pages or not (0 <= page_number < len(pages)):
            return {"error": "Invalid document ID or page number."}

        # Include the page and its surrounding pages (previous and next)
        start = max(page_number - 1, 0)
        end = min(page_number + 2, len(pages))  # end is non-inclusive
        selected_text = "\n".join(pages[start:end])

        prompt = (
            f"Use the following context from a PDF to answer the question.\n"
            f"Context:\n{selected_text}\n\nQuestion: {question}\nAnswer:"
        )

        output = llm(prompt, max_tokens=200, stop=["\nQ:", "\nQuestion:"], echo=False) ## We are calling the model and passing it the prompt,token limit and we are telling it that it should stop generating if the model starts a new question.
        answer = output["choices"][0]["text"].strip()

        return {"answer": answer}
    except Exception as e:
        return {"error": "Internal server error", "details": str(e)} ##Incase of an exception.
