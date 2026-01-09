# DoxyMetrics - Healthcare Analytics Dashboard

A production-quality Next.js application for visualizing and analyzing provider metrics from Doxy telehealth and Gusto payroll Excel workbooks.

## Features

### 📊 Overview Dashboard
- **KPI Tiles**: Total visits, % over 20 min, average duration, total hours, utilization
- **Trend Charts**: Interactive line charts showing weekly trends
- **Smart Insights**: Automatic detection of WoW changes and outliers using z-score analysis

### 👥 Provider Dashboard
- **Filters**: Filter by provider, date range, and data source
- **Comparison Charts**: Bar charts comparing providers on key metrics
- **Individual Trends**: Track provider performance over time
- **Summary Table**: Detailed metrics for all providers

### ✅ Data Quality Page
- **Parse Warnings**: View any issues encountered during Excel parsing
- **Sheet Status**: See which sheets were parsed and record counts
- **Quality Tips**: Guidelines for optimal data formatting

## Supported Excel Sheets

1. **"Doxy - Over 20 minutes"**: Provider, total visits, visits over 20 min, % over 20, avg duration
2. **"Gusto Hours "**: Provider, total hours (note: sheet name has trailing space)
3. **"Doxy Visits"**: Provider, weekly visit counts

## Getting Started

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Start production server
npm start
```

## Usage

1. **Upload Data**: Click "Upload Data" or drag-and-drop your Excel workbook
2. **Explore Dashboard**: View KPIs, charts, and insights on the Overview page
3. **Filter Providers**: Use the Provider Dashboard to drill down into individual performance
4. **Check Quality**: Review parsing warnings on the Data Quality page
5. **Export Data**: Download normalized CSV or chart data

## Demo Mode

Click "Load Demo Data" on the landing page to explore the dashboard with sample data.

## Technology Stack

- **Framework**: Next.js 16 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Charts**: Recharts
- **Excel Parsing**: SheetJS (xlsx)
- **Icons**: Lucide React
- **Date Handling**: date-fns

## Project Structure

```
src/
├── app/
│   ├── api/upload/       # File upload API route
│   ├── providers/        # Provider dashboard page
│   ├── quality/          # Data quality page
│   ├── page.tsx          # Overview dashboard
│   └── layout.tsx        # Root layout with navigation
├── components/
│   ├── charts/           # Recharts wrappers
│   ├── ui/               # Reusable UI components
│   ├── file-upload.tsx   # File upload component
│   ├── insight-card.tsx  # Insight display card
│   ├── kpi-tile.tsx      # KPI metric tile
│   └── navigation.tsx    # Top navigation
└── lib/
    ├── parsers/          # Excel sheet parsers
    ├── insights/         # Analytics & aggregation utilities
    ├── types/            # TypeScript definitions
    ├── store.ts          # React context state management
    └── demo-data.ts      # Demo data generator
```

## Data Model

All parsed data is normalized to `WeeklyProviderMetric`:

```typescript
interface WeeklyProviderMetric {
  week_start: string;          // ISO date (YYYY-MM-DD)
  provider: string;
  source: 'doxy_over_20' | 'gusto_hours' | 'doxy_visits';
  visits_total?: number;
  visits_over_20?: number;
  pct_over_20?: number;
  avg_duration_min?: number;
  hours_total?: number;
}
```

## Analytics

- **Week-over-Week Deltas**: Percentage change from previous week
- **Rolling Averages**: 4-week rolling average for trend smoothing
- **Outlier Detection**: Modified z-score using Median Absolute Deviation (MAD)
- **Utilization Calculation**: visits_total / hours_total

## License

MIT
