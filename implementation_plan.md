# Sales Team AI Assistant & Analytics Platform

This project aims to build a comprehensive platform for a sales team, integrating custom data analytics, custom Power BI dashboards, automated PDF reporting, and AI-driven content generation for social media.

## Project Phases & Priorities

### Phase 1: Machine Learning Model (Current Focus)
The immediate priority is to build, train, and evaluate the custom analytics model.
1. **Data Ingestion:** Receive and preprocess the dataset provided by the user.
2. **Model Training:** Build and train the custom machine learning model using Python.
3. **Evaluation:** Check the accuracy for the parameters and validate the model's performance on the dataset.
4. **Continuous Learning:** Implement an automated retraining pipeline. The model will store historical data in the SQLite database and learn from new daily records to continuously improve its accuracy over time.

### Phase 2: Full-Stack Web Application
Once the model is built and verified, we will integrate it into a web application with the following stack:

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
> Please provide the dataset (e.g., CSV file) so we can begin Phase 1 (Model Training & Accuracy Checking).

## Verification Plan

### Automated Tests
- Model validation scripts to calculate accuracy metrics (e.g., RMSE, R-squared, F1-score depending on the model type).
- Unit tests for the FastAPI endpoints once Phase 2 begins.

### Manual Verification
- Review the model's accuracy metrics together.
- Test the frontend-backend communication in Phase 2.
- Verify the Gemini and Power BI integrations.
