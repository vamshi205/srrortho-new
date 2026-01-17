# Loading States Implementation

This document describes all the loading indicators added throughout the application for Google Sheets operations.

## Overview

Loading indicators have been implemented for all data save and fetch operations to provide clear visual feedback to users during async operations with Google Sheets. This ensures users know when operations are in progress and prevents duplicate submissions.

---

## 1. Main DC Save Operation (OrthoApp.tsx)

### Location
`src/components/ortho/OrthoApp.tsx`

### State Variable
```typescript
const [isSavingDc, setIsSavingDc] = useState(false);
```

### Implementation
- **Trigger**: When saving a new DC from the main form
- **Visual Feedback**: 
  - Button text changes from "Save DC" to "Saving..."
  - Spinning refresh icon appears
  - Button is disabled during save
- **Button Text**: 
  - Normal: "Save DC"
  - Loading: "Saving to Sheets..." (with spinner)

### Code Location
- Lines 43: State declaration
- Lines 659-711: `handleSaveDc` function with loading state
- Lines 1532, 1615: Save DC buttons with loading state
- Lines 1710-1715: Confirmation dialog button with loading state and spinner

---

## 2. Saved DC List - Initial Load & Refresh (SavedDcs.tsx)

### Location
`src/pages/SavedDcs.tsx`

### State Variable
```typescript
const [isLoading, setIsLoading] = useState(true);
```

### Implementation
- **Trigger**: On page mount and manual refresh
- **Visual Feedback**:
  - Loading skeleton/message displayed while fetching
  - Refresh button shows spinning icon
  - Refresh button is disabled during load
- **Button States**:
  - Normal: Static refresh icon
  - Loading: Spinning refresh icon with disabled state

### Code Location
- Line 89: State declaration
- Lines 109-129: Initial load in `useEffect`
- Lines 694-697: Refresh button with spinning icon when `isLoading` is true
- Lines 878-891: Loading state UI display

---

## 3. Action Dialog Operations (SavedDcs.tsx)

### Location
`src/pages/SavedDcs.tsx`

### State Variable
```typescript
const [isActionLoading, setIsActionLoading] = useState(false);
```

### Operations Covered
1. **Confirm Return** - Mark DC as returned
2. **Link Invoice** - Add invoice to DC and move to completed
3. **Move to Cash** - Move DC to cash queue

### Implementation
- **Trigger**: When confirming any action in the dialog modals
- **Visual Feedback**:
  - Action button text changes to "Saving..."
  - Spinning refresh icon appears
  - Both action and cancel buttons are disabled
- **Button States**:
  - Normal: Show action text (e.g., "Confirm Return", "Link Invoice")
  - Loading: "Saving..." with spinning icon

### Code Location
- Line 90: State declaration
- Lines 489-522: `handleConfirmReturn` with loading state
- Lines 524-556: `handleConfirmInvoice` with loading state
- Lines 558-591: `handleConfirmCash` with loading state
- Lines 1613-1623: Return button with loading indicator
- Lines 1649-1659: Invoice button with loading indicator
- Lines 1705-1715: Cash button with loading indicator

---

## 4. Row-Level Operations (SavedDcs.tsx)

### Location
`src/pages/SavedDcs.tsx`

### State Variable
```typescript
const [loadingDcIds, setLoadingDcIds] = useState<Set<string>>(new Set());
```

### Operations Covered
1. **Delete DC** - Remove a DC from the list
2. **Move Back to Returned** - Revert completed DC to returned
3. **Cancel Return (Back to Pending)** - Revert returned DC to pending

### Implementation
- **Trigger**: When performing operations from the row action dropdown menu
- **Visual Feedback**:
  - Dropdown trigger button shows spinning icon
  - Dropdown trigger button is disabled
  - Only the specific row being operated on shows loading state
- **Button States**:
  - Normal: Edit icon (pencil)
  - Loading: Spinning refresh icon

### Code Location
- Line 91: State declaration
- Lines 269-292: `handleDelete` with row loading state
- Lines 593-622: `moveBackToReturned` with row loading state
- Lines 624-653: `cancelReturnToPending` with row loading state
- Lines 1262-1278: First dropdown menu trigger with loading state
- Lines 1490-1509: Second dropdown menu trigger with loading state

---

## Loading State Patterns

### Pattern 1: Boolean Loading State
Used for single operations or modal dialogs:
```typescript
const [isLoading, setIsLoading] = useState(false);

const handleOperation = async () => {
  setIsLoading(true);
  try {
    await performOperation();
  } catch (error) {
    // handle error
  } finally {
    setIsLoading(false);
  }
};
```

### Pattern 2: Set-Based Loading State
Used for row-level operations where multiple items can be operated on:
```typescript
const [loadingIds, setLoadingIds] = useState<Set<string>>(new Set());

const handleRowOperation = async (id: string) => {
  setLoadingIds(prev => new Set(prev).add(id));
  try {
    await performOperation(id);
  } catch (error) {
    // handle error
  } finally {
    setLoadingIds(prev => {
      const newSet = new Set(prev);
      newSet.delete(id);
      return newSet;
    });
  }
};

// In render:
<Button disabled={loadingIds.has(item.id)}>
  {loadingIds.has(item.id) ? <Spinner /> : <Icon />}
</Button>
```

---

## Visual Indicators

### Spinner Icon
All loading states use the `RefreshCw` icon from Lucide React with the `animate-spin` class:
```tsx
<RefreshCw className="w-4 h-4 animate-spin" />
```

### Button States During Loading
1. **Disabled**: `disabled={isLoading}`
2. **Visual feedback**: Icon changes to spinning refresh icon
3. **Text feedback**: Button text changes to indicate saving/loading
4. **Prevent multiple clicks**: Button becomes non-interactive

---

## Benefits

1. **User Feedback**: Clear indication that operation is in progress
2. **Prevent Duplicates**: Disabled buttons prevent multiple submissions
3. **Error Recovery**: Loading state is cleared even if operation fails
4. **Granular Control**: Row-level loading allows other rows to remain interactive
5. **Professional UX**: Consistent loading patterns across the application

---

## Testing Checklist

- [ ] Save DC shows loading spinner and "Saving to Sheets..." text
- [ ] Confirm Return button shows "Saving..." during operation
- [ ] Link Invoice button shows "Saving..." during operation
- [ ] Move to Cash button shows "Saving..." during operation
- [ ] Delete operation shows spinning icon on dropdown trigger
- [ ] Move Back to Returned shows spinning icon on dropdown trigger
- [ ] Cancel Return shows spinning icon on dropdown trigger
- [ ] Refresh button shows spinning icon during data fetch
- [ ] All buttons are disabled during their respective operations
- [ ] Loading state clears after operation completes (success or error)
- [ ] Only the specific row being operated on shows loading state
- [ ] Multiple operations on different rows can occur simultaneously

---

## Future Enhancements

1. **Progress Indicators**: For batch operations, show progress percentage
2. **Toast Notifications**: Enhance with loading toasts for long operations
3. **Optimistic Updates**: Update UI immediately, then sync with server
4. **Retry Mechanism**: Auto-retry failed operations with loading feedback
5. **Network Status**: Show when offline with appropriate messaging

---

## Related Files

- `src/components/ortho/OrthoApp.tsx` - Main DC creation and save
- `src/pages/SavedDcs.tsx` - DC list management and all status transitions
- `src/lib/savedDcStorage.ts` - Async storage operations
- `src/services/dcSheetsService.ts` - Google Sheets API calls

---

## Notes

- All loading states use `finally` blocks to ensure cleanup even on errors
- Error handling maintains loading state until toast notification is shown
- Loading states are scoped to prevent global UI freezing
- Set-based loading allows concurrent operations on different items

