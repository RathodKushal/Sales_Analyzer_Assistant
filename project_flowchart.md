# Project Flowchart

Here is the visual flow of how the entire platform will be built and how the different components (Machine Learning, Backend, Frontend, and APIs) interact with each other. This includes the newly added **Continuous Learning** loop.

```mermaid
graph TD
    %% Phase 1: Model Building
    subgraph "Phase 1: Machine Learning (Current)"
        Data[SALES.xlsx Dataset] --> Preprocess[Data Preprocessing & Cleaning]
        Preprocess --> FeatureEng[Feature Engineering]
        
        FeatureEng --> TrainProfit["Train Model 1 (Predict Profit)"]
        FeatureEng --> TrainSales["Train Model 2 (Predict Sales)"]
        
        TrainProfit --> EvalProfit[Evaluate & Tune Accuracy]
        TrainSales --> EvalSales[Evaluate & Tune Accuracy]
        
        EvalProfit --> FinalModels[("Final ML Models")]
        EvalSales --> FinalModels
        
        %% Continuous Learning Loop
        NewDataPipeline[Daily New Records] --> Preprocess
    end

    %% Phase 2: Backend Development
    subgraph "Phase 2: Backend API (Python/FastAPI)"
        FinalModels --> FastAPI[FastAPI Server]
        FastAPI --> API_Endpoints[REST API Endpoints]
        Gemini[Google Gemini API] --> FastAPI
        SQLite[("SQLite Database")] <--> FastAPI
        
        %% New Data Ingestion Endpoint
        API_Endpoints -.-> |Receives new daily data| NewDataPipeline
        API_Endpoints -.-> |Saves history| SQLite
    end

    %% Phase 3: Frontend & Integrations
    subgraph "Phase 3: Web Application (React)"
        API_Endpoints <--> React[React.js Frontend]
        PowerBI[Power BI Integration] --> React
        React --> Dashboard[Sales & Analytics Dashboard]
        React --> AI_Gen[Social Media AI Content]
        React --> PDF[Automated PDF Reports]
        React --> DataEntry[Enter New Daily Records]
    end

    %% User interactions
    SalesTeam(("Sales Team Users")) --> Dashboard
    SalesTeam --> AI_Gen
    SalesTeam --> PDF
    SalesTeam --> DataEntry
    DataEntry --> |Updates Database & Model| API_Endpoints
```

> [!NOTE]
> We are currently at the very top of **Phase 1**. The immediate next step is to write the Python code for **Data Preprocessing & Cleaning**, and then proceed to train the models for both Profit and Sales.
