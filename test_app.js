#!/usr/bin/env node

const http = require('http');

// Test configuration
const BASE_URL = 'http://localhost:5000';
const TEST_USER = { username: 'admin', password: 'admin123' };

// Helper function to make HTTP requests
function makeRequest(method, path, data = null, cookies = '') {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: 5000,
      path: path,
      method: method,
      headers: {
        'Content-Type': 'application/json',
        'Cookie': cookies
      }
    };

    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => body += chunk);
      res.on('end', () => {
        try {
          const result = {
            statusCode: res.statusCode,
            headers: res.headers,
            body: body,
            data: body ? JSON.parse(body) : null
          };
          resolve(result);
        } catch (e) {
          resolve({
            statusCode: res.statusCode,
            headers: res.headers,
            body: body,
            data: null
          });
        }
      });
    });

    req.on('error', reject);
    
    if (data) {
      req.write(JSON.stringify(data));
    }
    
    req.end();
  });
}

// Test functions
async function testAuth() {
  console.log('\n🔐 Testing Authentication...');
  
  try {
    const loginResponse = await makeRequest('POST', '/api/login', TEST_USER);
    const sessionCookie = loginResponse.headers['set-cookie'] ? 
      loginResponse.headers['set-cookie'][0].split(';')[0] : '';
    
    if (loginResponse.statusCode === 200) {
      console.log('✅ Login successful');
      
      const userResponse = await makeRequest('GET', '/api/user', null, sessionCookie);
      if (userResponse.statusCode === 200) {
        console.log('✅ User info retrieved');
        return sessionCookie;
      } else {
        console.log('❌ Failed to get user info');
        return null;
      }
    } else {
      console.log('❌ Login failed');
      return null;
    }
  } catch (error) {
    console.log('❌ Auth test error:', error.message);
    return null;
  }
}

async function testCustomers(cookies) {
  console.log('\n👥 Testing Customer Management...');
  
  try {
    // Get customers
    const customersResponse = await makeRequest('GET', '/api/customers', null, cookies);
    if (customersResponse.statusCode === 200) {
      console.log(`✅ Retrieved ${customersResponse.data.length} customers`);
      return customersResponse.data;
    } else {
      console.log('❌ Failed to get customers');
      return [];
    }
  } catch (error) {
    console.log('❌ Customer test error:', error.message);
    return [];
  }
}

async function testWorkOrders(cookies) {
  console.log('\n🔧 Testing Work Orders...');
  
  try {
    // Get work orders
    const workOrdersResponse = await makeRequest('GET', '/api/work-orders', null, cookies);
    if (workOrdersResponse.statusCode === 200) {
      console.log(`✅ Retrieved ${workOrdersResponse.data.length} work orders`);
      
      // Test individual work order if exists
      if (workOrdersResponse.data.length > 0) {
        const workOrderId = workOrdersResponse.data[0].id;
        const singleWorkOrderResponse = await makeRequest('GET', `/api/work-orders/${workOrderId}`, null, cookies);
        if (singleWorkOrderResponse.statusCode === 200) {
          console.log('✅ Work order details retrieved');
        } else {
          console.log('❌ Failed to get work order details');
        }
      }
      
      return workOrdersResponse.data;
    } else {
      console.log('❌ Failed to get work orders');
      return [];
    }
  } catch (error) {
    console.log('❌ Work order test error:', error.message);
    return [];
  }
}

async function testTechnicians(cookies) {
  console.log('\n👨‍🔧 Testing Technician Management...');
  
  try {
    // Get technicians
    const techniciansResponse = await makeRequest('GET', '/api/technicians', null, cookies);
    if (techniciansResponse.statusCode === 200) {
      console.log(`✅ Retrieved ${techniciansResponse.data.length} technicians`);
      return techniciansResponse.data;
    } else {
      console.log('❌ Failed to get technicians');
      return [];
    }
  } catch (error) {
    console.log('❌ Technician test error:', error.message);
    return [];
  }
}

async function testInventory(cookies) {
  console.log('\n📦 Testing Inventory Management...');
  
  try {
    // Get inventory
    const inventoryResponse = await makeRequest('GET', '/api/inventory', null, cookies);
    if (inventoryResponse.statusCode === 200) {
      console.log(`✅ Retrieved ${inventoryResponse.data.length} inventory items`);
      
      // Test low stock items
      const lowStockResponse = await makeRequest('GET', '/api/inventory/low-stock', null, cookies);
      if (lowStockResponse.statusCode === 200) {
        console.log(`✅ Retrieved ${lowStockResponse.data.length} low stock items`);
      }
      
      return inventoryResponse.data;
    } else {
      console.log('❌ Failed to get inventory');
      return [];
    }
  } catch (error) {
    console.log('❌ Inventory test error:', error.message);
    return [];
  }
}

async function testInvoices(cookies) {
  console.log('\n💰 Testing Invoice Management...');
  
  try {
    // Get invoices
    const invoicesResponse = await makeRequest('GET', '/api/invoices', null, cookies);
    if (invoicesResponse.statusCode === 200) {
      console.log(`✅ Retrieved ${invoicesResponse.data.length} invoices`);
      return invoicesResponse.data;
    } else {
      console.log('❌ Failed to get invoices');
      return [];
    }
  } catch (error) {
    console.log('❌ Invoice test error:', error.message);
    return [];
  }
}

async function testDashboard(cookies) {
  console.log('\n📊 Testing Dashboard...');
  
  try {
    // Get dashboard metrics
    const metricsResponse = await makeRequest('GET', '/api/dashboard/metrics', null, cookies);
    if (metricsResponse.statusCode === 200) {
      console.log('✅ Dashboard metrics retrieved');
      console.log(`   - Today's Sales: $${metricsResponse.data.todaySales}`);
      console.log(`   - Active Repairs: ${metricsResponse.data.activeRepairs}`);
      console.log(`   - New Customers: ${metricsResponse.data.newCustomers}`);
      console.log(`   - Low Stock Items: ${metricsResponse.data.lowStockItems}`);
    }
    
    // Get dashboard activity
    const activityResponse = await makeRequest('GET', '/api/dashboard/activity', null, cookies);
    if (activityResponse.statusCode === 200) {
      console.log('✅ Dashboard activity retrieved');
      console.log(`   - Recent Work Orders: ${activityResponse.data.recentWorkOrders.length}`);
      console.log(`   - Recent Customers: ${activityResponse.data.recentCustomers.length}`);
    }
    
    return true;
  } catch (error) {
    console.log('❌ Dashboard test error:', error.message);
    return false;
  }
}

// Main test runner
async function runTests() {
  console.log('🧪 Starting SewCraft Pro Application Tests');
  console.log('==========================================');
  
  // Test authentication first
  const sessionCookie = await testAuth();
  if (!sessionCookie) {
    console.log('\n❌ Authentication failed. Cannot proceed with other tests.');
    return;
  }
  
  // Run all tests
  await testCustomers(sessionCookie);
  await testWorkOrders(sessionCookie);
  await testTechnicians(sessionCookie);
  await testInventory(sessionCookie);
  await testInvoices(sessionCookie);
  await testDashboard(sessionCookie);
  
  console.log('\n🎉 Test suite completed!');
  console.log('==========================================');
}

// Run the tests
runTests().catch(error => {
  console.error('Test suite failed:', error);
  process.exit(1);
});