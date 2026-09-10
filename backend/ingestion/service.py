import json
from pypdf import PdfReader
from sqlalchemy.orm import Session
import google.generativeai as genai
import os
from .models import DocumentAnalysis
from backend.config import get_settings

# Initialize Gemini
api_key = get_settings().GEMINI_API_KEY or os.getenv("GEMINI_API_KEY", "")
genai.configure(api_key=api_key)

import pandas as pd

def parse_document(file_path: str) -> str:
    """Extracts text from PDF, CSV, or Excel files."""
    text = ""
    if file_path.endswith('.pdf'):
        reader = PdfReader(file_path)
        for page in reader.pages:
            text += page.extract_text() + "\n"
    elif file_path.endswith('.csv'):
        df = pd.read_csv(file_path)
        text = df.to_string()
    elif file_path.endswith(('.xls', '.xlsx')):
        df = pd.read_excel(file_path)
        text = df.to_string()
    else:
        with open(file_path, "r", encoding="utf-8") as f:
            text = f.read()
    return text

def analyze_document_with_gemini(text: str) -> dict:
    """
    Sends the raw text to Gemini to extract structured JSON data.
    """
    api_key = get_settings().GEMINI_API_KEY or os.getenv("GEMINI_API_KEY")
    if not api_key:
        # Fallback mock if no API key is provided
        return {
            "summary": "⚠️ Gemini API key is missing in your .env file! AI analysis was skipped, but your file was successfully saved to the Dashboard.",
            "entities": ["API Key Missing"],
            "key_metrics": {"Status": "Offline Mode", "Mock Value": "₹1,00,000"},
            "sentiment": "N/A",
            "dashboard_charts": [
                {
                    "title": "Mock Data (API Key Missing)",
                    "type": "bar",
                    "labels": ["Item A", "Item B", "Item C"],
                    "values": [10, 20, 30]
                }
            ]
        }

    try:
        model = genai.GenerativeModel('gemini-flash-latest')
        prompt = f"""
        You are an enterprise AI data analyst. Analyze the following document text and extract key business insights.
        CRITICAL: DO NOT copy the example placeholders. You MUST generate real insights based on the provided text.
        If the document is a generic dataset, summarize its columns, rows, or general topic.
        
        You must also act as a Visualization Engine. Based on the data, design 2-4 charts that would best represent the data in a dashboard.
        Supported chart types: "bar", "line", "pie", "doughnut".
        
        Return ONLY a raw JSON object exactly matching this structure, with no markdown wrappers:
        {{
            "summary": "<Write a 2-3 sentence actual summary of the data here>",
            "entities": ["<Entity 1>", "<Entity 2>"],
            "key_metrics": {{"<Actual Metric Name>": "<Actual Value>"}},
            "sentiment": "<Positive/Neutral/Negative>",
            "dashboard_charts": [
                {{
                    "title": "<Chart Title>",
                    "type": "<bar/line/pie/doughnut>",
                    "labels": ["<Label 1>", "<Label 2>"],
                    "values": [100, 200]
                }}
            ]
        }}

        Document Text:
        {text[:15000]}  # limit text length for safety
        """
        response = model.generate_content(prompt)
        # Strip potential markdown blocks if the model ignored instructions
        clean_text = response.text.strip()
        if clean_text.startswith("```json"):
            clean_text = clean_text[7:-3].strip()
        elif clean_text.startswith("```"):
            clean_text = clean_text[3:-3].strip()
            
        return json.loads(clean_text)
    except Exception as e:
        print(f"Gemini API Error: {e}")
        return {"error": "Failed to extract insights using AI."}

def process_and_save_document(db: Session, file_path: str, filename: str, user_id: int) -> DocumentAnalysis:
    """
    Parses the document, analyzes it, and saves it to the database.
    """
    raw_text = parse_document(file_path)
    
    # Determine file type from extension
    file_type = filename.split('.')[-1].lower() if '.' in filename else "unknown"

    if file_type in ['csv', 'xls', 'xlsx']:
        from backend.analytics.service import ModelService
        try:
            insights = ModelService.get_instance().evaluate_dataset(file_path)
        except Exception as e:
            # Fallback to Gemini if the file is a generic dataset that doesn't match the Sales schema
            insights = analyze_document_with_gemini(raw_text)
        
        # Save to the Dashboard Sales Record!
        from backend.sales.router import process_and_save_sales_data
        try:
            process_and_save_sales_data(db, file_path, user_id)
        except Exception as e:
            print(f"Error inserting into SalesRecord: {e}")
            
    else:
        insights = analyze_document_with_gemini(raw_text)

    db_doc = DocumentAnalysis(
        user_id=user_id,
        filename=filename,
        file_type=file_type,
        raw_text=raw_text,
        structured_insights=insights
    )
    
    db.add(db_doc)
    db.commit()
    db.refresh(db_doc)
    
    return db_doc
