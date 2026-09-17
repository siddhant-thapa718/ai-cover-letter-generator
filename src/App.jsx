import React, { useState } from 'react';
import { GoogleGenerativeAI } from '@google/generative-ai';
import * as pdfjsLib from 'pdfjs-dist';
import './App.css'; // Yahan humne CSS ko link kar liya hai

pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.mjs`;

export default function App() {
  const [name, setName] = useState('');
  const [role, setRole] = useState('');
  const [company, setCompany] = useState('');
  const [skills, setSkills] = useState('');
  const [output, setOutput] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [resumeText, setResumeText] = useState('');

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (file) {
      const arrayBuffer = await file.arrayBuffer();
      const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
      let text = '';
      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const textContent = await page.getTextContent();
        text += textContent.items.map(s => s.str).join(' ');
      }
      setResumeText(text);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsGenerating(true);
    
    const apiKey = import.meta.env.VITE_API_KEY;

    if (!apiKey || apiKey === 'your_gemini_api_key_here') {
      const simulatedText = `Dear Hiring Manager at ${company},\n\nI am ${name}, applying for the ${role} position. My key skills include ${skills}.`;
      setOutput(simulatedText);
      setIsGenerating(false);
      return;
    }

    try {
      const genAI = new GoogleGenerativeAI(apiKey);
      const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

      const prompt = `Write a professional cover letter.
      Candidate Name: ${name}
      Job Role: ${role}
      Target Company: ${company}
      Key Skills: ${skills}
      Resume Context: ${resumeText}`;

      const result = await model.generateContent(prompt);
      setOutput(result.response.text());
    } catch (error) {
      console.error(error);
      setOutput("Error generating cover letter. Please check your API Key.");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(output);
    alert("Copied to clipboard!");
  };

  const renderParagraphs = (text) => {
    return text.split('\n').filter(p => p.trim() !== '').map((para, index) => (
      <p key={index}>{para}</p>
    ));
  };

  return (
    <div className="container">
      <div className="header">
        <h1>AI Cover Letter Generator</h1>
        <p>Phase 1, 2 & 3 Completed</p>
      </div>
      
      <div className="card">
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Candidate Name</label>
            <input placeholder="e.g. Rahul Kumar" value={name} onChange={(e) => setName(e.target.value)} required />
          </div>
          <div className="form-group">
            <label>Job Role</label>
            <input placeholder="e.g. Frontend Developer" value={role} onChange={(e) => setRole(e.target.value)} required />
          </div>
          <div className="form-group">
            <label>Target Company</label>
            <input placeholder="e.g. Google" value={company} onChange={(e) => setCompany(e.target.value)} required />
          </div>
          <div className="form-group">
            <label>Key Skills</label>
            <textarea placeholder="React, Node.js, etc." value={skills} onChange={(e) => setSkills(e.target.value)} required rows="3" />
          </div>
          <div className="form-group">
            <label>Upload Resume (PDF) - Optional</label>
            <input type="file" accept="application/pdf" onChange={handleFileUpload} />
          </div>
          
          <button type="submit" className="btn" disabled={isGenerating}>
            {isGenerating ? 'Generating AI Letter...' : 'Generate Cover Letter'}
          </button>
        </form>
      </div>

      <div className="card">
        <h2 style={{marginTop: '0'}}>Result</h2>
        <div className="result-box">
          {isGenerating ? (
            <p className="loading">AI is writing your cover letter... Please wait.</p>
          ) : (
            <div>
              {output ? renderParagraphs(output) : <p style={{ color: '#94a3b8', textAlign: 'center', marginTop: '50px' }}>Your output will appear here.</p>}
            </div>
          )}
        </div>
        
        {output && !isGenerating && (
          <button className="copy-btn" onClick={handleCopy}>
            Copy to Clipboard
          </button>
        )}
      </div>
    </div>
  );
}