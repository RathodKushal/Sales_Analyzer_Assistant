# Sales Team AI Assistant & Analytics Platform

This project aims to build a comprehensive platform for a sales team, integrating custom data analytics, custom Power BI dashboards, automated PDF reporting, and AI-driven content generation for social media.

## Project Phases & Priorities

### Phase 1: Machine Learning Model (Completed ✅)
The custom analytics reinforcement learning model has been successfully trained and evaluated.
- **Data Ingestion:** Processed the SALES.xlsx dataset.
- **Model Training:** Trained a Deep Q-Network (DQN) agent.
- **Evaluation:** Achieved a ~302% estimated profit improvement over historical data.
- **Continuous Learning:** Ready to integrate with the backend pipeline.

### Phase 2: Full-Stack Web Application
Once the model is built and verified, we will integrate it into a web application with the following stack

#### Frontend (Web Application)
- **Framework:** React JS, standard JS, HTML.
- **Styling:** Custom Vanilla CSS with a focus on modern, rich aesthetics, vibrant color palettes, and micro-animations to create a premium feel.
- **Features:** 
  - Authentication & Role management.
  - Custom-built Dashboard for Power BI integration.
  - Social Media Campaign Dashboard (Content & Image generation).
  - Downloadable PDF Reports interface.

#### Backend & API Services
- **Framework:** Python (FastAPI) - Ideal for serving ML models, handling concurrent API requests, and communicating with databases.
- **Database:** SQLite (for structured data and metadata, if needed).
- **Integrations:**
  - **Custom Analytics Model:** The model developed in Phase 1, including data ingestion endpoints to feed new daily records into the continuous learning pipeline.
  - **Power BI API:** For generating and embedding dashboards built from scratch.
  - **Google Gemini API:** Utilized for generating social media text content *and* generating images based on the content.

## User Review Required

> [!IMPORTANT]
> **Phase 1 (Machine Learning Model) is complete!** 
> The next step is to begin **Phase 2: Full-Stack Web Application**.
> 
> Our immediate next actions will be:
> 1. Setting up a **Python FastAPI backend** to serve the ML model.
> 2. Initializing a **SQLite database** to store daily sales records for the continuous learning pipeline.
> 3. Scaffolding the **React JS frontend** with a modern, vibrant UI.
> 
> Would you like to proceed with setting up the FastAPI backend now?

## Verification Plan

### Automated Tests
- Model validation scripts to calculate accuracy metrics (e.g., RMSE, R-squared, F1-score depending on the model type).
- Unit tests for the FastAPI endpoints once Phase 2 begins.

### Manual Verification
- Review the model's accuracy metrics together.
- Test the frontend-backend communication in Phase 2.
- Verify the Gemini and Power BI integrations.
