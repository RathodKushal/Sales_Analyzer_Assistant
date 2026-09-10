"""
Report Service — PDF Generation with ReportLab
=================================================
Generates professional PDF sales reports with KPI summaries,
charts, and AI discount recommendations.
"""

import io
import os
import uuid
import tempfile
from datetime import datetime, timezone
from pathlib import Path
from typing import Optional

from sqlalchemy import func
from sqlalchemy.orm import Session

from backend.config import get_settings, PROJECT_ROOT


# ── Report output directory ─────────────────────────────────
REPORTS_DIR = PROJECT_ROOT / "backend" / "generated_reports"
REPORTS_DIR.mkdir(exist_ok=True)

# ── Upload directory (where ingested files are stored) ──────
UPLOAD_DIR = PROJECT_ROOT / "backend" / "uploads"


class ReportService:
    """
    Service for generating PDF sales reports.
    
    Uses ReportLab for PDF creation and matplotlib for embedded charts.
    Parses the actual uploaded dataset to generate rich visualizations.
    """

    @staticmethod
    def generate_report(
        db: Session,
        template: str = "full_report",
        date_from: Optional[str] = None,
        date_to: Optional[str] = None,
        category: Optional[str] = None,
        region: Optional[str] = None,
        user_id: int = 1,
    ) -> dict:
        """
        Generate a comprehensive PDF report with charts from the uploaded data.
        """
        from reportlab.lib.pagesizes import A4
        from reportlab.lib.units import inch, cm
        from reportlab.lib.colors import HexColor
        from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
        from reportlab.platypus import (
            SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle,
            Image as RLImage, PageBreak,
        )
        from reportlab.lib.enums import TA_CENTER, TA_LEFT
        from backend.ingestion.models import DocumentAnalysis

        # ── Get latest analysis ─────────────────────────────
        latest_doc = (
            db.query(DocumentAnalysis)
            .filter(DocumentAnalysis.user_id == user_id)
            .order_by(DocumentAnalysis.id.desc())
            .first()
        )
        
        if not latest_doc or not latest_doc.structured_insights:
            raise ValueError("No analyzed documents found. Please upload a dataset first.")

        insights = latest_doc.structured_insights
        filename_analyzed = latest_doc.filename
        key_metrics = insights.get("key_metrics", {})
        summary_text = insights.get("summary", "No summary available.")
        entities = insights.get("entities", [])
        sentiment = insights.get("sentiment", "N/A")
        dashboard_charts_from_ai = insights.get("dashboard_charts", [])

        # ── Parse the actual uploaded file to generate charts ─
        chart_paths = ReportService._generate_charts_from_raw_data(
            filename_analyzed, dashboard_charts_from_ai, key_metrics
        )

        # ── Build PDF ───────────────────────────────────────
        report_id = str(uuid.uuid4())[:8]
        filename = f"Analysis_Report_{user_id}_{report_id}.pdf"
        filepath = REPORTS_DIR / filename

        doc = SimpleDocTemplate(
            str(filepath),
            pagesize=A4,
            topMargin=1.5 * cm,
            bottomMargin=1.5 * cm,
            leftMargin=2 * cm,
            rightMargin=2 * cm,
        )

        # ── Styles ──────────────────────────────────────────
        styles = getSampleStyleSheet()
        title_style = ParagraphStyle(
            "ReportTitle", parent=styles["Title"],
            fontSize=26, textColor=HexColor("#1a1a2e"),
            spaceAfter=10, alignment=TA_CENTER,
        )
        heading_style = ParagraphStyle(
            "ReportHeading", parent=styles["Heading2"],
            fontSize=16, textColor=HexColor("#3b82f6"),
            spaceBefore=20, spaceAfter=10,
        )
        body_style = ParagraphStyle(
            "ReportBody", parent=styles["Normal"],
            fontSize=11, textColor=HexColor("#333333"),
            spaceAfter=12, leading=16,
        )
        subtitle_style = ParagraphStyle(
            "ReportSubtitle", parent=styles["Normal"],
            fontSize=12, textColor=HexColor("#6b7280"),
            alignment=TA_CENTER, spaceAfter=8,
        )
        accent_style = ParagraphStyle(
            "AccentText", parent=styles["Normal"],
            fontSize=11, textColor=HexColor("#8b5cf6"),
            spaceAfter=6,
        )

        elements = []

        # ── Title Page ──────────────────────────────────────
        elements.append(Spacer(1, 1.5 * inch))
        elements.append(Paragraph("AI Data Analysis Report", title_style))
        elements.append(Paragraph(f"Dataset: {filename_analyzed}", subtitle_style))
        elements.append(Paragraph(
            f"Generated on {datetime.now().strftime('%B %d, %Y at %I:%M %p')}",
            subtitle_style,
        ))
        elements.append(Spacer(1, 0.5 * inch))

        # Sentiment badge
        sentiment_color = {"Positive": "#10b981", "Negative": "#ef4444"}.get(sentiment, "#f59e0b")
        elements.append(Paragraph(
            f'Overall Sentiment: <font color="{sentiment_color}"><b>{sentiment}</b></font>',
            ParagraphStyle("SentimentStyle", parent=styles["Normal"],
                           fontSize=13, alignment=TA_CENTER, spaceAfter=30),
        ))

        elements.append(PageBreak())

        # ── Executive Summary ───────────────────────────────
        elements.append(Paragraph("1. Executive Summary", heading_style))
        elements.append(Paragraph(summary_text, body_style))
        elements.append(Spacer(1, 10))

        # ── Key Entities ────────────────────────────────────
        if entities:
            elements.append(Paragraph("2. Key Entities Identified", heading_style))
            for i, entity in enumerate(entities, 1):
                elements.append(Paragraph(f"  • {entity}", body_style))
            elements.append(Spacer(1, 10))

        # ── KPI Summary Table ───────────────────────────────
        if key_metrics:
            elements.append(Paragraph("3. Key Performance Metrics", heading_style))
            elements.append(Spacer(1, 8))

            kpi_data = [["Metric", "Value"]]
            for k, v in key_metrics.items():
                kpi_data.append([str(k), str(v)])

            kpi_table = Table(kpi_data, colWidths=[3.2 * inch, 3.2 * inch])
            kpi_table.setStyle(TableStyle([
                ("BACKGROUND", (0, 0), (-1, 0), HexColor("#1a1a2e")),
                ("TEXTCOLOR", (0, 0), (-1, 0), HexColor("#ffffff")),
                ("FONTSIZE", (0, 0), (-1, 0), 11),
                ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
                ("ALIGN", (0, 0), (0, -1), "LEFT"),
                ("ALIGN", (1, 0), (1, -1), "CENTER"),
                ("FONTSIZE", (0, 1), (-1, -1), 10),
                ("ROWBACKGROUNDS", (0, 1), (-1, -1),
                 [HexColor("#f8f9fa"), HexColor("#ffffff")]),
                ("GRID", (0, 0), (-1, -1), 0.5, HexColor("#dee2e6")),
                ("TOPPADDING", (0, 0), (-1, -1), 8),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 8),
                ("LEFTPADDING", (0, 0), (-1, -1), 12),
            ]))
            elements.append(kpi_table)

        # ── Charts Section ──────────────────────────────────
        if chart_paths:
            elements.append(PageBreak())
            elements.append(Paragraph("4. Visual Analysis", heading_style))
            elements.append(Paragraph(
                "The following charts were automatically generated from your uploaded dataset.",
                body_style,
            ))

            for i, chart_path in enumerate(chart_paths):
                if os.path.exists(chart_path):
                    if i > 0:
                        elements.append(Spacer(1, 20))
                    # Fit chart nicely on page
                    elements.append(
                        RLImage(chart_path, width=6.2 * inch, height=4 * inch)
                    )
                    # Add page break after every 2 charts
                    if i % 2 == 1 and i < len(chart_paths) - 1:
                        elements.append(PageBreak())

        # ── Footer / Disclaimer ─────────────────────────────
        elements.append(Spacer(1, 30))
        elements.append(Paragraph(
            "<i>This report was auto-generated by Sales Analyzer AI. "
            "All charts and metrics are derived from the uploaded dataset.</i>",
            ParagraphStyle("Footer", parent=styles["Normal"],
                           fontSize=9, textColor=HexColor("#9ca3af"),
                           alignment=TA_CENTER),
        ))

        # ── Build the document ──────────────────────────────
        doc.build(elements)

        # Clean up chart temp files
        for chart_path in chart_paths:
            if os.path.exists(chart_path):
                os.remove(chart_path)

        file_size_kb = filepath.stat().st_size / 1024

        return {
            "report_id": report_id,
            "template": template,
            "filename": filename,
            "generated_at": datetime.now(timezone.utc),
            "record_count": len(key_metrics),
            "file_size_kb": round(file_size_kb, 1),
        }

    @staticmethod
    def _generate_charts_from_raw_data(
        filename: str,
        ai_charts: list,
        key_metrics: dict,
    ) -> list[str]:
        """
        Generate chart images by:
        1. Parsing the actual uploaded CSV/Excel file and building charts from its columns.
        2. Falling back to AI-provided dashboard_charts if raw file not available.
        3. Last resort: building a summary chart from key_metrics.
        """
        import matplotlib
        matplotlib.use("Agg")
        import matplotlib.pyplot as plt
        import numpy as np

        chart_paths = []
        colors = ["#3b82f6", "#8b5cf6", "#ec4899", "#06b6d4", "#10b981",
                  "#f59e0b", "#ef4444", "#14b8a6", "#a855f7", "#f97316"]

        # ── Strategy 1: Parse the raw uploaded file ─────────
        raw_file_path = UPLOAD_DIR / filename
        df = None
        if raw_file_path.exists():
            try:
                import pandas as pd
                if filename.endswith(".csv"):
                    df = pd.read_csv(raw_file_path)
                elif filename.endswith((".xls", ".xlsx")):
                    df = pd.read_excel(raw_file_path)
            except Exception as e:
                print(f"[ReportService] Could not parse file: {e}")

        if df is not None and not df.empty:
            chart_paths = ReportService._build_charts_from_dataframe(df, colors)

        # ── Strategy 2: Use AI-provided dashboard_charts ────
        if not chart_paths and ai_charts:
            chart_paths = ReportService._generate_dynamic_charts(ai_charts, colors)

        # ── Strategy 3: Build from key_metrics as last resort
        if not chart_paths and key_metrics:
            chart_paths = ReportService._build_chart_from_metrics(key_metrics, colors)

        return chart_paths

    @staticmethod
    def _build_charts_from_dataframe(df, colors) -> list[str]:
        """Build up to 4 meaningful charts from a pandas DataFrame."""
        import matplotlib
        matplotlib.use("Agg")
        import matplotlib.pyplot as plt
        import numpy as np

        chart_paths = []
        numeric_cols = df.select_dtypes(include=[np.number]).columns.tolist()
        categorical_cols = df.select_dtypes(include=["object", "category"]).columns.tolist()

        # Remove index-like or ID columns
        numeric_cols = [c for c in numeric_cols if "id" not in c.lower() and "index" not in c.lower()]

        # ── Chart 1: Distribution of top numeric column ─────
        if numeric_cols:
            col = numeric_cols[0]
            fig, ax = plt.subplots(figsize=(9, 5))
            data = df[col].dropna()
            if len(data) > 0:
                ax.hist(data, bins=min(30, len(data.unique())),
                        color="#3b82f6", alpha=0.8, edgecolor="#1e40af")
                ax.set_title(f"Distribution of {col}", fontsize=14, fontweight="bold", pad=15)
                ax.set_xlabel(col, fontsize=11)
                ax.set_ylabel("Frequency", fontsize=11)
                ax.grid(axis="y", alpha=0.3)
                plt.tight_layout()
                path = os.path.join(tempfile.gettempdir(), f"chart_hist_{uuid.uuid4().hex[:6]}.png")
                fig.savefig(path, dpi=150, bbox_inches="tight")
                plt.close(fig)
                chart_paths.append(path)

        # ── Chart 2: Category breakdown (pie/bar) ───────────
        if categorical_cols:
            col = categorical_cols[0]
            value_counts = df[col].value_counts().head(10)
            if len(value_counts) > 1:
                fig, ax = plt.subplots(figsize=(9, 5))
                if len(value_counts) <= 6:
                    # Donut chart for small categories
                    wedges, texts, autotexts = ax.pie(
                        value_counts.values, labels=value_counts.index,
                        autopct="%1.1f%%", colors=colors[:len(value_counts)],
                        pctdistance=0.75,
                    )
                    centre = plt.Circle((0, 0), 0.50, fc="white")
                    ax.add_artist(centre)
                    ax.set_title(f"Breakdown by {col}", fontsize=14, fontweight="bold", pad=15)
                else:
                    # Horizontal bar for many categories
                    ax.barh(value_counts.index[::-1], value_counts.values[::-1],
                            color=colors[:len(value_counts)], alpha=0.85)
                    ax.set_title(f"Top {col} Categories", fontsize=14, fontweight="bold", pad=15)
                    ax.set_xlabel("Count", fontsize=11)
                    ax.grid(axis="x", alpha=0.3)
                plt.tight_layout()
                path = os.path.join(tempfile.gettempdir(), f"chart_cat_{uuid.uuid4().hex[:6]}.png")
                fig.savefig(path, dpi=150, bbox_inches="tight")
                plt.close(fig)
                chart_paths.append(path)

        # ── Chart 3: Numeric comparison (grouped bar) ───────
        if len(numeric_cols) >= 2 and categorical_cols:
            cat_col = categorical_cols[0]
            top_cats = df[cat_col].value_counts().head(8).index
            subset = df[df[cat_col].isin(top_cats)]
            
            if len(subset) > 0:
                col1, col2 = numeric_cols[0], numeric_cols[1]
                grouped = subset.groupby(cat_col)[[col1, col2]].mean()
                
                fig, ax = plt.subplots(figsize=(9, 5))
                x = np.arange(len(grouped))
                width = 0.35
                ax.bar(x - width/2, grouped[col1], width, label=col1,
                       color="#3b82f6", alpha=0.85)
                ax.bar(x + width/2, grouped[col2], width, label=col2,
                       color="#8b5cf6", alpha=0.85)
                ax.set_xticks(x)
                ax.set_xticklabels(grouped.index, rotation=45, ha="right")
                ax.set_title(f"Avg {col1} vs {col2} by {cat_col}",
                             fontsize=14, fontweight="bold", pad=15)
                ax.legend()
                ax.grid(axis="y", alpha=0.3)
                plt.tight_layout()
                path = os.path.join(tempfile.gettempdir(), f"chart_cmp_{uuid.uuid4().hex[:6]}.png")
                fig.savefig(path, dpi=150, bbox_inches="tight")
                plt.close(fig)
                chart_paths.append(path)

        # ── Chart 4: Correlation heatmap (if 3+ numeric cols)
        if len(numeric_cols) >= 3:
            fig, ax = plt.subplots(figsize=(8, 6))
            corr = df[numeric_cols[:8]].corr()
            im = ax.imshow(corr, cmap="RdBu_r", vmin=-1, vmax=1)
            ax.set_xticks(range(len(corr.columns)))
            ax.set_yticks(range(len(corr.columns)))
            ax.set_xticklabels(corr.columns, rotation=45, ha="right", fontsize=9)
            ax.set_yticklabels(corr.columns, fontsize=9)
            # Add correlation values
            for i in range(len(corr)):
                for j in range(len(corr)):
                    ax.text(j, i, f"{corr.iloc[i, j]:.2f}",
                            ha="center", va="center", fontsize=8,
                            color="white" if abs(corr.iloc[i, j]) > 0.5 else "black")
            fig.colorbar(im, ax=ax, shrink=0.8)
            ax.set_title("Correlation Matrix", fontsize=14, fontweight="bold", pad=15)
            plt.tight_layout()
            path = os.path.join(tempfile.gettempdir(), f"chart_corr_{uuid.uuid4().hex[:6]}.png")
            fig.savefig(path, dpi=150, bbox_inches="tight")
            plt.close(fig)
            chart_paths.append(path)

        return chart_paths

    @staticmethod
    def _generate_dynamic_charts(dashboard_charts: list, colors: list) -> list[str]:
        """Generate chart images from AI-provided dashboard_charts spec."""
        import matplotlib
        matplotlib.use("Agg")
        import matplotlib.pyplot as plt

        chart_paths = []

        for idx, chart in enumerate(dashboard_charts):
            title = chart.get("title", f"Chart {idx+1}")
            ctype = chart.get("type", "bar").lower()
            labels = chart.get("labels", [])
            values = chart.get("values", [])

            if not labels or not values or len(labels) != len(values):
                continue
            if all(v == 0 for v in values):
                continue

            fig, ax = plt.subplots(figsize=(8, 5))
            
            if ctype in ["pie", "doughnut"]:
                wedges, texts, autotexts = ax.pie(
                    values, labels=labels, autopct="%1.1f%%",
                    colors=colors[:len(labels)], pctdistance=0.75,
                )
                if ctype == "doughnut":
                    centre = plt.Circle((0, 0), 0.50, fc="white")
                    ax.add_artist(centre)
            elif ctype == "line":
                ax.plot(labels, values, marker="o", color="#3b82f6", linewidth=2)
                ax.grid(axis="y", alpha=0.3)
            else:
                ax.bar(labels, values, color="#8b5cf6", alpha=0.85)
                ax.grid(axis="y", alpha=0.3)
                plt.xticks(rotation=45, ha="right")

            ax.set_title(title, fontsize=14, fontweight="bold", pad=15)
            plt.tight_layout()
            path = os.path.join(tempfile.gettempdir(), f"chart_ai_{uuid.uuid4().hex[:6]}.png")
            fig.savefig(path, dpi=150, bbox_inches="tight")
            plt.close(fig)
            chart_paths.append(path)

        return chart_paths

    @staticmethod
    def _build_chart_from_metrics(key_metrics: dict, colors: list) -> list[str]:
        """Build a simple summary chart from key_metrics as a last resort."""
        import matplotlib
        matplotlib.use("Agg")
        import matplotlib.pyplot as plt
        import re

        chart_paths = []

        # Extract numeric values from metrics
        numeric_metrics = {}
        for k, v in key_metrics.items():
            val_str = str(v)
            # Try to extract a number from the value string
            numbers = re.findall(r"[\d,]+\.?\d*", val_str.replace(",", ""))
            if numbers:
                try:
                    numeric_metrics[k] = float(numbers[0])
                except ValueError:
                    pass

        if len(numeric_metrics) >= 2:
            fig, ax = plt.subplots(figsize=(9, 5))
            labels = list(numeric_metrics.keys())
            values = list(numeric_metrics.values())
            bars = ax.barh(labels[::-1], values[::-1],
                          color=colors[:len(labels)], alpha=0.85)
            ax.set_title("Key Metrics Overview", fontsize=14, fontweight="bold", pad=15)
            ax.grid(axis="x", alpha=0.3)
            # Add value labels on bars
            for bar, val in zip(bars, values[::-1]):
                ax.text(bar.get_width() + max(values) * 0.01, bar.get_y() + bar.get_height()/2,
                        f"{val:,.0f}", va="center", fontsize=9)
            plt.tight_layout()
            path = os.path.join(tempfile.gettempdir(), f"chart_metrics_{uuid.uuid4().hex[:6]}.png")
            fig.savefig(path, dpi=150, bbox_inches="tight")
            plt.close(fig)
            chart_paths.append(path)

        return chart_paths

    @staticmethod
    def get_report_path(filename: str) -> Optional[Path]:
        """Get the full path to a generated report file, or None if not found."""
        path = REPORTS_DIR / filename
        return path if path.exists() else None

    @staticmethod
    def list_reports(user_id: int) -> list[dict]:
        """List all previously generated reports for a user."""
        reports = []
        for pattern in [f"Sales_Report_{user_id}_*.pdf", f"Analysis_Report_{user_id}_*.pdf"]:
            for f in sorted(REPORTS_DIR.glob(pattern), reverse=True):
                reports.append({
                    "filename": f.name,
                    "file_size_kb": round(f.stat().st_size / 1024, 1),
                    "created_at": datetime.fromtimestamp(
                        f.stat().st_mtime, tz=timezone.utc
                    ).isoformat(),
                })
        return reports


