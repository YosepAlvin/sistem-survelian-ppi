import axios from 'axios'

const BASE_URL = 'http://localhost:3000/api'

async function verifyAPIs() {
  console.log('=== API DATA CONSISTENCY CHECK ===\n')
  
  try {
    // Check Users API
    console.log('1. Testing /api/admin/users')
    const usersRes = await axios.get(`${BASE_URL}/admin/users`)
    console.log('Status:', usersRes.status)
    console.log('Count:', usersRes.data.length)
    console.log('Sample:', JSON.stringify(usersRes.data[0], null, 2))
    
    // Check Ruangan API
    console.log('\n2. Testing /api/admin/ruangan')
    const ruanganRes = await axios.get(`${BASE_URL}/admin/ruangan`)
    console.log('Status:', ruanganRes.status)
    console.log('Count:', ruanganRes.data.length)
    console.log('Sample:', JSON.stringify(ruanganRes.data[0], null, 2))
    
    // Check Antibiotik API
    console.log('\n3. Testing /api/antibiotik')
    const antibiotikRes = await axios.get(`${BASE_URL}/antibiotik`)
    console.log('Status:', antibiotikRes.status)
    console.log('Count:', antibiotikRes.data.length)
    console.log('Sample:', JSON.stringify(antibiotikRes.data[0], null, 2))
    
    // Check IPCN Stats API
    console.log('\n4. Testing /api/ipcn/stats')
    const ipcnStatsRes = await axios.get(`${BASE_URL}/ipcn/stats`)
    console.log('Status:', ipcnStatsRes.status)
    console.log('Data:', JSON.stringify(ipcnStatsRes.data, null, 2))
    
    // Check IPCLN Stats API
    console.log('\n5. Testing /api/ipcln/stats')
    const ipclnStatsRes = await axios.get(`${BASE_URL}/ipcln/stats`)
    console.log('Status:', ipclnStatsRes.status)
    console.log('Data:', JSON.stringify(ipclnStatsRes.data, null, 2))
    
    console.log('\n✅ All APIs responding correctly')
  } catch (error: any) {
    console.error('❌ Error:', error.message)
    if (error.response) {
      console.error('Response:', error.response.data)
    }
  }
}

verifyAPIs()
