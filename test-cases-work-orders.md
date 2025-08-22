# Work Order Page - Comprehensive Test Cases

## Test Environment Setup
- Browser: Chrome/Firefox/Safari
- Screen Resolution: 1920x1080 and 1366x768
- Test Data: Real customer and technician data from database

## Test Case Categories

### 1. Page Load and Initial State Tests

#### TC001: Page Load Verification
**Objective**: Verify work order page loads correctly
**Steps**:
1. Navigate to work orders page
2. Check page title displays "Sewing Machine Service"
3. Verify navbar loads with correct menu items
4. Confirm work orders table is visible
5. Check "Create Work Order" button is present

**Expected Result**: Page loads successfully with all elements visible

#### TC002: Data Loading Test
**Objective**: Verify work orders data loads from database
**Steps**:
1. Navigate to work orders page
2. Wait for loading animation to complete
3. Verify work orders display in table format
4. Check table columns: Order #, Customer, Service Type, Status, Priority, Problem, Technician, Created, Due Date, Cost, Actions

**Expected Result**: Work orders load successfully with proper column structure

### 2. Service Type Implementation Tests

#### TC003: Service Type Column Display
**Objective**: Verify service type column shows correctly
**Steps**:
1. Navigate to work orders page
2. Locate "Service Type" column in table
3. Verify service types display as badges with proper formatting
4. Check service types include: Service, Repair, Part Change, Part Ordered, Maintenance, Consultation, Warranty Service

**Expected Result**: Service type column visible with formatted badges

#### TC004: Service Type Search Functionality
**Objective**: Verify service type search works
**Steps**:
1. Navigate to work orders page
2. Use search box to search for "repair"
3. Verify only repair-type work orders show
4. Clear search and try "maintenance"
5. Test partial matches like "part"

**Expected Result**: Search filters work orders by service type correctly

### 3. Work Order Creation Tests

#### TC005: Create New Work Order - All Service Types
**Objective**: Test creating work orders for each service type
**Steps**:
For each service type (Service, Repair, Part Change, Part Ordered, Maintenance, Consultation, Warranty Service):
1. Click "Create Work Order" button
2. Select a customer
3. Select the service type
4. Fill problem description
5. Set priority and status
6. Add estimated cost
7. Set due date
8. Assign technician
9. Submit form

**Expected Result**: Work order created successfully for each service type

#### TC006: Create Work Order - Required Field Validation
**Objective**: Verify form validation for required fields
**Steps**:
1. Click "Create Work Order" button
2. Leave customer field empty and try to submit
3. Fill customer, leave problem description empty and submit
4. Test each required field validation

**Expected Result**: Proper validation messages for required fields

#### TC007: Create Work Order - Optional Field Handling
**Objective**: Verify optional fields work correctly
**Steps**:
1. Click "Create Work Order" button
2. Fill only required fields (customer, service type, problem description)
3. Leave optional fields empty (technician, estimated cost, due date)
4. Submit form

**Expected Result**: Work order created successfully with optional fields empty

### 4. Work Order Editing Tests

#### TC008: Edit Work Order - Data Pre-filling
**Objective**: Verify edit modal pre-fills with existing data
**Steps**:
1. Navigate to work orders page
2. Click edit button on an existing work order
3. Verify all fields are pre-filled with current values
4. Check customer selection shows correct customer
5. Verify service type dropdown shows current service type
6. Confirm all other fields display existing values

**Expected Result**: Edit modal pre-fills correctly with existing data

#### TC009: Edit Work Order - Service Type Changes
**Objective**: Test changing service type during editing
**Steps**:
1. Click edit on a work order with "Service" type
2. Change service type to "Repair"
3. Update problem description
4. Save changes
5. Verify work order shows new service type in table

**Expected Result**: Service type updates successfully

#### TC010: Edit Work Order - All Field Updates
**Objective**: Verify all fields can be updated
**Steps**:
1. Click edit on any work order
2. Change customer selection
3. Update service type
4. Modify problem description
5. Change priority and status
6. Update estimated cost
7. Change due date
8. Reassign technician
9. Save changes

**Expected Result**: All fields update successfully

### 5. Display and UI Tests

#### TC011: Responsive Design Test
**Objective**: Verify page works on different screen sizes
**Steps**:
1. Test on desktop (1920x1080)
2. Test on laptop (1366x768)
3. Test on tablet view (768px)
4. Test on mobile view (375px)
5. Check table scrolling and button accessibility

**Expected Result**: Page responsive across all screen sizes

#### TC012: Service Type Badge Styling
**Objective**: Verify service type badges display correctly
**Steps**:
1. Navigate to work orders page
2. Check service type badges have consistent styling
3. Verify text is readable in both light and dark modes
4. Confirm badges use appropriate colors

**Expected Result**: Service type badges styled consistently and readable

#### TC013: Dark Mode Compatibility
**Objective**: Verify work orders page works in dark mode
**Steps**:
1. Switch to dark mode
2. Navigate to work orders page
3. Check table visibility and readability
4. Test modal dialogs in dark mode
5. Verify service type badges are visible

**Expected Result**: Full functionality in dark mode

### 6. Data Integrity Tests

#### TC014: Service Type Data Persistence
**Objective**: Verify service type data persists correctly
**Steps**:
1. Create work order with "Part Change" service type
2. Refresh page
3. Verify service type still shows "Part Change"
4. Edit the work order
5. Confirm service type pre-fills correctly

**Expected Result**: Service type data persists through page refreshes and edits

#### TC015: Database Consistency Test
**Objective**: Verify database stores service type correctly
**Steps**:
1. Create work orders with different service types
2. Check database directly for service_type column values
3. Verify enum values match dropdown options
4. Confirm no null or invalid values

**Expected Result**: Database stores service types correctly

### 7. Filter and Search Tests

#### TC016: Status Filter with Service Types
**Objective**: Verify status filters work with service types
**Steps**:
1. Filter by "Pending" status
2. Verify service types still display correctly
3. Filter by "Completed" status
4. Check service type column remains functional

**Expected Result**: Filters work correctly with service type display

#### TC017: Combined Search and Filter
**Objective**: Test combined search and filtering
**Steps**:
1. Search for customer name
2. Apply status filter
3. Verify results show correct service types
4. Clear filters and search for service type
5. Apply customer filter

**Expected Result**: Combined search and filters work correctly

### 8. Performance Tests

#### TC018: Large Dataset Performance
**Objective**: Verify page performance with many work orders
**Steps**:
1. Create 50+ work orders with various service types
2. Navigate to work orders page
3. Measure load time
4. Test pagination performance
5. Verify search response time

**Expected Result**: Page loads within 3 seconds, search responds within 1 second

#### TC019: Concurrent User Test
**Objective**: Test multiple users creating/editing work orders
**Steps**:
1. Have multiple users create work orders simultaneously
2. Test editing same work order from different sessions
3. Verify data integrity
4. Check for conflicts

**Expected Result**: No data corruption or conflicts

### 9. Error Handling Tests

#### TC020: Network Error Handling
**Objective**: Verify graceful handling of network errors
**Steps**:
1. Disconnect network during work order creation
2. Try to submit form
3. Reconnect network
4. Retry submission

**Expected Result**: Appropriate error messages, successful retry

#### TC021: Invalid Data Handling
**Objective**: Test handling of invalid service type data
**Steps**:
1. Attempt to create work order with invalid service type
2. Try editing work order with corrupted data
3. Test form with special characters

**Expected Result**: Validation prevents invalid data submission

### 10. Integration Tests

#### TC022: Customer Integration
**Objective**: Verify customer data integration works
**Steps**:
1. Create new customer
2. Immediately create work order for that customer
3. Verify customer appears in dropdown
4. Check customer details display correctly

**Expected Result**: New customers immediately available for work orders

#### TC023: Technician Assignment
**Objective**: Test technician assignment functionality
**Steps**:
1. Create work order assigned to technician
2. Verify technician shows in work order table
3. Test reassigning to different technician
4. Check unassigned work orders display correctly

**Expected Result**: Technician assignment works correctly

## Test Execution Plan

### Phase 1: Basic Functionality (30 minutes)
- Execute TC001-TC007 (Page load, service types, basic creation)

### Phase 2: Edit Functionality (20 minutes) 
- Execute TC008-TC010 (Edit work order tests)

### Phase 3: UI/UX Tests (15 minutes)
- Execute TC011-TC013 (Responsive design, styling)

### Phase 4: Data Tests (15 minutes)
- Execute TC014-TC017 (Data integrity, filters)

### Phase 5: Advanced Tests (20 minutes)
- Execute TC018-TC023 (Performance, error handling, integration)

## Success Criteria
- All test cases pass without errors
- Service type functionality works completely
- Edit functionality pre-fills data correctly
- No data loss or corruption
- Responsive design works across devices
- Performance meets acceptable thresholds

## Bug Tracking
- Document any failures with screenshots
- Include browser console errors
- Note specific steps that fail
- Categorize severity (Critical, High, Medium, Low)