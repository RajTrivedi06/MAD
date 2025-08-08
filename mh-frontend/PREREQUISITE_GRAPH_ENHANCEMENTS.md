# Prerequisite Graph Enhancements

## Overview

The prerequisite graph system has been enhanced with new features to improve user experience and provide detailed error reporting when issues occur.

## New Features

### 1. "Ask User First" Functionality

The graph now shows a prompt asking users if they want to view the prerequisite diagram before loading data.

**Key Benefits:**

- Reduces unnecessary API calls
- Improves perceived performance
- Gives users control over when to load the diagram
- Better user experience for courses without prerequisites

**Implementation:**

```tsx
<ReactFlowPrerequisiteGraph
  courseId={courseId}
  showPrompt={true} // Controls whether to show the prompt
  onNodeClick={handleNodeClick}
  completedCourses={completedCourses}
  inProgressCourses={inProgressCourses}
/>
```

### 2. Detailed Error Handling

When backend data is unavailable or errors occur, the component shows comprehensive error information with troubleshooting steps.

**Error Types Detected:**

- **Network**: Connection issues, server unreachable
- **Server**: Backend server errors (500, etc.)
- **Not Found**: Course data doesn't exist (404)
- **Timeout**: Request timeout issues
- **API**: General API errors

**Error Display Features:**

- Clear error categorization with icons
- Specific troubleshooting steps for each error type
- Technical details for debugging
- Retry functionality
- User-friendly error messages

### 3. Enhanced Debug Panel

The debug panel provides comprehensive information about the component state and data.

## Component Props

```tsx
interface ReactFlowPrerequisiteGraphProps {
  courseId: number;
  className?: string;
  onNodeClick?: (courseId: number) => void;
  completedCourses?: number[];
  inProgressCourses?: number[];
  showPrompt?: boolean; // NEW: Controls prompt visibility
}
```

## Usage Examples

### Basic Usage with Prompt

```tsx
<ReactFlowPrerequisiteGraph
  courseId={selectedCourse.course_id}
  showPrompt={true}
  onNodeClick={(courseId) => console.log("Clicked:", courseId)}
/>
```

### Immediate Display (No Prompt)

```tsx
<ReactFlowPrerequisiteGraph
  courseId={selectedCourse.course_id}
  showPrompt={false}
  onNodeClick={(courseId) => console.log("Clicked:", courseId)}
/>
```

### With User Progress

```tsx
<ReactFlowPrerequisiteGraph
  courseId={selectedCourse.course_id}
  showPrompt={true}
  completedCourses={[100, 200, 300]}
  inProgressCourses={[400]}
  onNodeClick={(courseId) => setSelectedCourseId(courseId)}
/>
```

## State Management

### Prompt State

- `showPrompt={true}`: Shows prompt first, then loads data on user action
- `showPrompt={false}`: Immediately loads and displays data

### Data Loading

- Only fetches backend data when diagram is visible (`showDiagram` state)
- Lazy loading prevents unnecessary API calls
- Proper useEffect dependencies prevent infinite loops

## Error Handling

### Backend Errors

- Shows detailed error information with categorization
- Provides specific troubleshooting steps for each error type
- Includes retry functionality
- Shows technical details for debugging

### No Data Scenarios

- Empty prerequisite data: Shows "No prerequisites required" message
- Invalid data structure: Shows error with debug information
- Network issues: Shows network-specific error with troubleshooting

## Testing

### Test Page

Visit `/test-reactflow` to test all features:

- Toggle prompt visibility
- Test with different course IDs
- Simulate user progress
- View debug information
- Test error scenarios

### Error Testing Scenarios

- **Course ID 999999**: Should show "Not Found" error
- **Disconnect internet**: Should show "Network" error
- **Course ID 0**: Should show validation error
- **Invalid course IDs**: Should show appropriate error messages

### Debug Features

- Debug panel shows component state
- Console logging for all interactions
- Error categorization and troubleshooting
- Technical details for debugging

## Migration Guide

### From Old Component

```tsx
// OLD
<ReactFlowPrerequisiteGraph courseId={courseId} />

// NEW (with prompt)
<ReactFlowPrerequisiteGraph
  courseId={courseId}
  showPrompt={true}
/>

// NEW (immediate display)
<ReactFlowPrerequisiteGraph
  courseId={courseId}
  showPrompt={false}
/>
```

### Backward Compatibility

- All existing props still work
- `showPrompt` defaults to `true` for new behavior
- Existing implementations continue to work

## Performance Improvements

### Lazy Loading

- API calls only when diagram is visible
- Reduces initial page load time
- Better resource utilization

### Caching

- Backend data cached in React state
- No repeated API calls for same course
- Proper dependency management prevents infinite loops

## Future Enhancements

### Planned Features

1. **User Preferences**: Remember user's choice about showing prompts
2. **Advanced Filtering**: Filter nodes by completion status
3. **Export Functionality**: Export graph as image or PDF
4. **Mobile Optimization**: Better touch interactions
5. **Accessibility**: Screen reader support and keyboard navigation

### Integration Opportunities

1. **Academic Planning**: Integration with course planning tools
2. **Progress Tracking**: Real-time progress updates
3. **Recommendations**: AI-powered course suggestions
4. **Social Features**: Share prerequisite paths with peers

## Troubleshooting

### Common Issues

**Graph not rendering:**

1. Check if `showPrompt` is set correctly
2. Verify course ID exists in database
3. Check browser console for errors
4. Use debug panel to identify issues
5. Check detailed error display for troubleshooting steps

**Backend data issues:**

1. Run conversion script for course data
2. Check database connectivity
3. Verify API endpoint availability
4. Check network requests in browser dev tools
5. Use error categorization to identify specific issues

### Debug Steps

1. Open debug panel (bug icon)
2. Check error categorization
3. Verify node and edge counts
4. Test with known working course ID
5. Check console for error messages
6. Use detailed error display for troubleshooting

## Error Types and Solutions

### Network Errors

- **Cause**: Internet connection issues, server unreachable
- **Solutions**: Check connection, refresh page, verify server status

### Server Errors

- **Cause**: Backend server issues (500, 503, etc.)
- **Solutions**: Wait and retry, check server logs, contact support

### Not Found Errors

- **Cause**: Course data doesn't exist in database
- **Solutions**: Verify course ID, run conversion script, try different course

### Timeout Errors

- **Cause**: Request taking too long
- **Solutions**: Check server performance, retry request, check network

### API Errors

- **Cause**: General API issues
- **Solutions**: Check API documentation, verify endpoints, contact support

## Conclusion

These enhancements provide a robust, user-friendly prerequisite graph system that:

- Always provides clear feedback about what's happening
- Respects user preferences
- Handles errors gracefully with detailed information
- Provides clear troubleshooting steps
- Maintains backward compatibility

The system is now production-ready and can handle various edge cases while providing an excellent user experience with comprehensive error reporting.
