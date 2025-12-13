# Data Type Validation Feature - Implementation Plan

## Overview
Add a new "Data Type Validation" page between Data Preview and Analysis to allow users to review and validate variable types before performing analysis.

## Updated User Flow
1. **Upload Data** - User uploads CSV/Excel file
2. **Data Preview** - Review rows/columns, variable list, sample data (first/last 5 rows)
3. **Data Type Validation** ⭐ NEW - Validate and adjust data types
4. **Analysis** - Perform statistical analysis

---

## Feature Requirements

### Backend API: Variable Analysis Endpoint

**Endpoint**: `POST /api/analyze-variables/{file_id}`

**Response Format**:
```json
{
  "file_id": "uuid",
  "variables": [
    {
      "name": "column_name",
      "detected_type": "numeric|categorical|date|text",
      "missingness": 15,
      "missingness_percent": 1.5,
      "unique_count": 42,
      "sample_values": ["value1", "value2", "value3", "value4", "value5"],
      "total_count": 1000
    }
  ]
}
```

**Type Detection Logic**:
1. **Date Type**: All values match date patterns (YYYY-MM-DD, DD/MM/YYYY, etc.)
2. **Categorical Type**: `unique_count < min(50% of total_rows, 20)`
3. **Numeric Type**: All values are numeric (int/float)
4. **Text Type**: Everything else (default fallback)

**Implementation Steps**:
- [ ] Create `/api/analyze-variables/{file_id}` endpoint in `backend/app.py`
- [ ] Implement type detection functions:
  - [ ] `is_date_type(series)` - Check if values match date patterns
  - [ ] `is_categorical_type(series, total_rows)` - Check unique count threshold
  - [ ] `is_numeric_type(series)` - Check if numeric
  - [ ] `detect_variable_type(series, total_rows)` - Main detection function
- [ ] Calculate missingness (count and percentage)
- [ ] Get unique value count
- [ ] Sample 5 representative values (mix of first values and random)
- [ ] Return analysis results as JSON

---

### Frontend: Data Type Validation Component

**Component**: `DataTypeValidation.jsx`
**Styles**: `DataTypeValidation.css`

**Features**:
- Table showing all variables with their properties
- Editable type dropdown for each variable
- Visual indicator (*) for user-modified types
- Dark mode support

**Table Columns**:
1. **#** - Row numbering
2. **Variable Name** - Column name from dataset
3. **Detected Type** - Auto-detected type with dropdown to change
   - Options: Numeric, Categorical, Date, Text
   - Show asterisk (*) if user modified from detected type
4. **Missingness** - Count and percentage (e.g., "15 (1.5%)")
5. **Unique Values** - Count of unique values
6. **Sample Values** - 5 sample values (comma-separated or pills)

**Implementation Steps**:
- [ ] Create `frontend/src/components/DataTypeValidation.jsx`
- [ ] Create `frontend/src/components/DataTypeValidation.css`
- [ ] Fetch variable analysis on component mount
- [ ] Display table with variable information
- [ ] Implement dropdown for type selection
- [ ] Track user modifications (mark with asterisk)
- [ ] Add "Continue to Analysis" button
- [ ] Store validated types in state to pass to Analysis component
- [ ] Add dark mode CSS variables support
- [ ] Make table responsive for mobile

**State Management**:
```javascript
{
  variables: [
    {
      name: "age",
      detectedType: "numeric",
      currentType: "numeric",
      isModified: false,
      missingness: 5,
      missingnessPercent: 0.5,
      uniqueCount: 67,
      sampleValues: ["25", "30", "45", "52", "18"]
    }
  ],
  isLoading: false,
  error: null
}
```

---

### Integration Changes

**App.jsx Updates**:
- [ ] Add new page state: `'datatype'`
- [ ] Add navigation button for "Data Types" (appears after data preview)
- [ ] Update navigation flow:
  - Upload → Data Preview → **Data Types** → Analysis → Results
- [ ] Pass validated types to AnalysisPanel component
- [ ] Store validated types in app state

**Navigation Flow**:
```javascript
// After file upload
setCurrentPage('data')

// After viewing data preview, user clicks "Validate Data Types"
setCurrentPage('datatype')

// After validating types, user clicks "Continue to Analysis"
setCurrentPage('analysis')
```

**Updated State**:
```javascript
const [validatedTypes, setValidatedTypes] = useState(null)

// In DataTypeValidation component
const handleContinue = (types) => {
  setValidatedTypes(types)
  setCurrentPage('analysis')
}
```

---

## Implementation Order

### Phase 1: Backend API
1. Create type detection helper functions
2. Implement `/api/analyze-variables/{file_id}` endpoint
3. Test with sample datasets (small and large)
4. Verify type detection accuracy

### Phase 2: Frontend Component
1. Create DataTypeValidation component skeleton
2. Fetch and display variable analysis data
3. Implement table layout and styling
4. Add type dropdown functionality
5. Track user modifications
6. Add dark mode support

### Phase 3: Integration
1. Add new page to App.jsx navigation
2. Update navigation flow
3. Pass validated types to AnalysisPanel
4. Update AnalysisPanel to use validated types
5. Test end-to-end flow

### Phase 4: Polish & Testing
1. Add loading states
2. Add error handling
3. Improve mobile responsiveness
4. Test with various datasets
5. Verify type detection edge cases

---

## Design Considerations

### Type Detection Edge Cases
- Empty columns → detect as Text
- Mixed numeric/text → detect as Text
- Dates with inconsistent formats → detect as Text
- All NULL values → detect as Text
- Boolean-like values (True/False, 0/1) → detect as Categorical

### UX Improvements
- Show loading spinner while analyzing variables
- Highlight modified types with different color
- Add tooltip explaining each data type
- Allow bulk type changes (select multiple rows)
- Add "Reset to Detected" button for modified types

### Performance
- Cache variable analysis results (don't re-analyze on navigation)
- Limit sample values to 5 to reduce payload size
- Use pagination for datasets with 100+ columns

---

## API Changes Required

**None to existing endpoints** - This is a new feature that adds:
- 1 new endpoint: `/api/analyze-variables/{file_id}`
- New component: DataTypeValidation
- Navigation flow update

**AnalysisPanel Changes** (optional enhancement):
- Accept `validatedTypes` prop
- Filter columns based on user-validated types
- Show only numeric columns for numeric analysis
- Use validated types for better analysis results

---

## File Structure

```
backend/
├── app.py                          # Add new endpoint here

frontend/src/
├── App.jsx                         # Add navigation state
├── components/
│   ├── DataTypeValidation.jsx     # NEW component
│   ├── DataTypeValidation.css     # NEW styles
│   ├── AnalysisPanel.jsx          # Update to accept validatedTypes
```

---

## Success Criteria

- [x] User can review all variables after data upload
- [x] Auto-detection works accurately for common data types
- [x] User can manually override detected types
- [x] Modified types are clearly marked
- [x] Navigation flows smoothly between pages
- [x] Component works in both light and dark modes
- [x] Mobile responsive design
- [x] Loading and error states handled gracefully

---

## Future Enhancements (Post-MVP)

- Export validated types as JSON schema
- Save type validation profiles for reuse
- Advanced type detection (email, URL, phone numbers)
- Statistical preview for numeric columns (min/max/mean)
- Distribution preview for categorical columns
- Data quality warnings (high missingness, low variance)
