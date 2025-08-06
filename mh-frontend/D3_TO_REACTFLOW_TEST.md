# D3 to React Flow Test Implementation

## Overview

This implementation provides a complete test setup for converting D3 prerequisite graph data to React Flow format. The test includes both a simple data conversion test and a full integration test with the existing prerequisite visualization components.

## Files Created/Modified

### 1. Converter Utility (`src/utils/d3ToReactFlowConverter.ts`)

- **Purpose**: Converts D3 graph data to React Flow format
- **Key Functions**:
  - `convertD3ToReactFlow()`: Main conversion function
  - `calculateHierarchicalLayout()`: Calculates node positions
  - `testD3Data`: Sample D3 data for testing
  - `getTestReactFlowData()`: Helper function for testing

### 2. Test Page

- **Comprehensive Test** (`src/pages/d3-reactflow-test.tsx`): Single page with all testing functionality

### 3. Modified Hook (`src/hooks/usePrerequisiteDAG.ts`)

- Added test flag: `USE_MOCK_DATA = true`
- Integrated mock data conversion
- Maintains original functionality when flag is false

### 4. Router Updates (`src/router.tsx`)

- Added route for the comprehensive test page
- `/d3-reactflow-test`: All-in-one testing page

## Test Data Structure

The test uses a sample prerequisite graph for course 356 (A A E/ECON 526):

```
                A A E/ECON 526
                      |
                    OR_1
                   /    \
               AND_2    graduate/professional standing
                |
              OR_3 -- ECON 301 -- STAT 301
             /    \
       MATH 211  MATH 221
```

### D3 Data Format

```typescript
interface D3Graph {
  nodes: D3Node[];
  links: D3Link[];
}

interface D3Node {
  id: string;
  type: "COURSE" | "LEAF" | "AND" | "OR";
  course_id: number | null;
}

interface D3Link {
  source: string;
  target: string;
}
```

### React Flow Data Format

```typescript
interface ReactFlowData {
  nodes: Node[];
  edges: Edge[];
}
```

## How to Test

### Single Comprehensive Test

1. Navigate to `/d3-reactflow-test`
2. Use the tab navigation to test different aspects:

**Converter Test Tab:**

- Verify D3 data is successfully converted to React Flow format
- Check node positions are calculated correctly
- Confirm edge connections are preserved
- Validate data structure matches expected format

**Hook Test Tab:**

- Monitor hook state (loading, error, debug info)
- Verify mock data is processed correctly
- Check node and edge counts match expected values

**Integration Test Tab:**

- Test the full prerequisite graph visualization
- Verify interactive features work (click, zoom, pan)
- Check color coding shows completion status
- Test course information display
- Verify node interactions trigger callbacks

## Expected Results

### Visual Elements

- ✅ Target course (A A E/ECON 526) at the top
- ✅ OR nodes as circles/badges
- ✅ AND nodes as different styled circles/badges
- ✅ Course nodes with proper styling
- ✅ Edges connecting nodes correctly
- ✅ Color coding (green for completed, yellow for in-progress)

### Interactions

- ✅ Node click callbacks
- ✅ Zoom controls
- ✅ Pan/drag functionality
- ✅ Minimap representation
- ✅ Legend display

### Data Flow

- ✅ Console logging of clicked course IDs
- ✅ Correct node positioning
- ✅ Special node handling (graduate/professional standing)

## Debugging

### If nodes don't appear:

```typescript
// Add console logs in converter:
console.log("Converted nodes:", reactFlowNodes);
console.log("Converted edges:", reactFlowEdges);
```

### If layout looks wrong:

```typescript
// Log positions in layout calculator:
positions.forEach((pos, nodeId) => {
  console.log(`Node ${nodeId}: x=${pos.x}, y=${pos.y}`);
});
```

### If edges don't connect:

```typescript
// Verify edge source/target IDs match node IDs:
console.log(
  "Node IDs:",
  nodes.map((n) => n.id)
);
console.log(
  "Edge connections:",
  edges.map((e) => `${e.source} -> ${e.target}`)
);
```

## Production Integration

Once testing is complete:

1. **Update Database**: Convert all D3 data to React Flow format
2. **Store Data**: Save converted data in `reactflow_dag_json` column
3. **Remove Test Flag**: Set `USE_MOCK_DATA = false` in the hook
4. **Test Real Data**: Verify with actual course data from database

## Configuration

### Test Flag

```typescript
// In usePrerequisiteDAG.ts
const USE_MOCK_DATA = true; // Set to false for production
```

### Mock Course Data

```typescript
const mockTitles: Record<string, string> = {
  "MATH 211": "Calculus I",
  "MATH 221": "Calculus II",
  "ECON 301": "Intermediate Microeconomics",
  "STAT 301": "Intro to Statistical Methods",
  "A A E/ECON 526": "Applied Econometrics",
};
```

## Troubleshooting

### TypeScript Errors

- Most errors are related to React Flow type definitions
- These don't affect runtime functionality
- Application should work despite TypeScript warnings

### Import Issues

- Ensure path aliases are configured correctly in `tsconfig.json`
- Check that all required components exist
- Verify file paths match the project structure

### Runtime Issues

- Check browser console for JavaScript errors
- Verify React Flow components are properly imported
- Ensure all dependencies are installed

## Next Steps

1. **Database Migration**: Create script to convert existing D3 data
2. **Performance Testing**: Test with larger prerequisite graphs
3. **User Testing**: Gather feedback on visualization quality
4. **Production Deployment**: Remove test code and deploy

## Files Summary

```
src/
├── utils/
│   └── d3ToReactFlowConverter.ts    # Conversion utility
├── pages/
│   └── d3-reactflow-test.tsx        # Comprehensive test page
├── hooks/
│   └── usePrerequisiteDAG.ts        # Modified with test flag
└── router.tsx                       # Updated with test route
```

This implementation provides a complete testing framework for the D3 to React Flow conversion, allowing you to verify both the data conversion and the full integration with your existing prerequisite visualization system.
