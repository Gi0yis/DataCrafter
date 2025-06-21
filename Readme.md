# ✨ DataCrafter: Bring Your Documents to Life with Generative AI and Azure

Can you imagine being able to ask your documents questions and get clear, precise, and instant answers?  
**DataCrafter** makes that vision a reality.  
It turns mountains of PDFs, images, and complex files into useful, searchable, and actionable knowledge, thanks to Azure's artificial intelligence.

---

## 🚀 What is DataCrafter?

**DataCrafter** is much more than a document processor:  
It's your intelligent assistant, capable of reading, understanding, and answering questions about any file you upload.  
Forget about manually searching through hundreds of pages: ask in natural language and get contextual answers, with exact references to the original document.

---

## 🧠 How does it work?

- **Upload any document**: PDFs, scanned images, contracts, reports, manuals—anything you want!
- **Intelligent processing**: Advanced OCR, layout analysis, semantic chunking, and normalization.
- **State-of-the-art embeddings**: Azure OpenAI turns text into vectors that “understand” meaning.
- **Vector indexing**: Azure Cognitive Search enables ultra-fast, relevant searches.
- **Retrieval-Augmented Generation (RAG)**: Ask anything and receive AI-generated answers, always backed by your actual document content.
- **API ready to integrate**: Bring the power of DataCrafter to your apps, bots, intranets, or workflows.

---

## 🌟 Why will you love it?

- **Save hours of work**: Find key information in seconds.
- **Reduce errors**: Accurate answers, always based on your own documents.
- **Scalable and secure**: Leverage the robustness and privacy of Azure.
- **Flexible**: Use it in legal, finance, healthcare, education, HR… wherever there are documents, there’s value!

---

## 🏗️ Visual Architecture

![Architecture](img/Arquitectura.png)

---

## 📂 Project Structure

```
DataCrafter/
├── app.py                  # Main API (Flask)
├── clients.py              # Azure clients initialization
├── config.py               # Configuration and environment variables
├── requirements.txt        # Python dependencies
├── processing/             # Document processing logic
│   ├── analyzer.py         # OCR and layout analysis
│   ├── chunking.py         # Chunking and normalization
│   ├── embeddings.py       # Embeddings generation
│   ├── metrics.py          # Processing metrics
│   ├── pipeline.py         # Pipeline orchestration
│   └── rag_module.py       # RAG search logic
├── search/                 # Indexing and upload to Azure Search
│   ├── index.py            # Index creation
│   └── uploader.py         # Upload of indexed data
├── utils/                  # General utilities
│   ├── helpers.py
│   └── logging_config.py
└── .env                    # Environment variables (do not version)
```

---

## ⚡ Try it in minutes!

1. **Clone the repository**  
   ```sh
   git clone https://github.com/arthurgab03/project-datasage.git
   cd DataCrafter
   ```

2. **Install dependencies**  
   ```sh
   pip install -r requirements.txt
   ```

3. **Configure your `.env` file** with your Azure credentials.

4. **Launch the API**  
   ```sh
   python app.py
   ```

5. **Upload a document and ask your first question**  
   ```sh
   curl -X POST http://localhost:5000/upload -F "file=@/path/to/your/document.pdf"
   curl -X POST http://localhost:5000/query -H "Content-Type: application/json" -d '{"question": "What is a report?"}'
   ```

---

## 💡 Use Cases That Transform Your Day-to-Day

- **Legal**: Analyze contracts and find critical clauses in seconds.
- **Finance**: Extract figures and conclusions from extensive reports.
- **Healthcare**: Query medical records and protocols.
- **Education**: Index and explore academic materials.
- **And much more!**

---

## 🔒 Security and Trust

Your data is always under your control, processed and stored in your own Azure infrastructure, complying with the highest privacy standards.

---

## 🤝 Join the Document Revolution

Do you have ideas, suggestions, or want to contribute?  
You’re welcome! Open an issue, fork the repo, or contact the team.

---

## 📢 Credits

#### Developed by: 
![AZC](img/logoAZC.png)  
Inspired by the passion to turn information into useful knowledge.

---

> **Don’t forget:** Never upload your `.env` file or credentials to the public repository.

---

**DataCrafter: Make your documents**