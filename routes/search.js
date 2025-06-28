const express = require('express');
const router = express.Router();
const { getFirestore, collection, getDocs, query, where, doc, getDoc } = require('firebase/firestore');

const db = getFirestore();

// Combined search endpoint for mobile apps
router.get('/', async (req, res) => {
  try {
    let { bloodType, city, radius, urgency } = req.query;
    
    // Fix URL encoding issues
    if (bloodType) {
      bloodType = decodeURIComponent(bloodType).trim();
    }
    
    if (!bloodType) {
      return res.status(400).json({
        success: false,
        error: 'Blood type is required'
      });
    }
    
    console.log(`🔍 Searching for blood type: ${bloodType}`);
    
    // Get all inventory items first (simplified query)
    const inventoryQuery = query(collection(db, 'inventory'));
    const inventorySnapshot = await getDocs(inventoryQuery);
    
    // Filter in memory for blood type and available units
    const filteredInventory = inventorySnapshot.docs.filter(doc => {
      const data = doc.data();
      return data.bloodType === bloodType && data.availableUnits > 0;
    });
    
    console.log(`📊 Found ${filteredInventory.length} inventory items for ${bloodType}`);
    
    const bloodBankIds = [...new Set(filteredInventory.map(doc => doc.data().bloodBankId))];
    console.log(`🏥 Found ${bloodBankIds.length} unique blood banks`);
    
    // Get blood bank details
    const bloodBanks = [];
    for (const bankId of bloodBankIds) {
      const bankDoc = await getDoc(doc(db, 'bloodBanks', bankId));
      if (bankDoc.exists()) {
        const bankData = bankDoc.data();
        
        // Filter by city if provided
        if (!city || bankData.city === city) {
          // Get inventory for this blood bank
          const bankInventory = filteredInventory
            .filter(doc => doc.data().bloodBankId === bankId)
            .map(doc => ({
              id: doc.id,
              ...doc.data()
            }));
          
          bloodBanks.push({
            id: bankId,
            ...bankData,
            inventory: bankInventory,
            totalAvailable: bankInventory.reduce((sum, item) => sum + item.availableUnits, 0)
          });
        }
      }
    }
    
    // Sort by urgency if specified
    if (urgency === 'high') {
      bloodBanks.sort((a, b) => b.totalAvailable - a.totalAvailable);
    }
    
    res.json({
      success: true,
      data: bloodBanks,
      count: bloodBanks.length,
      searchParams: { bloodType, city, urgency }
    });
  } catch (error) {
    console.error('Error searching:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to perform search',
      details: error.message
    });
  }
});

// Search by blood type only
router.get('/blood-type/:type', async (req, res) => {
  try {
    const { type } = req.params;
    const { city } = req.query;
    
    console.log(`🔍 Searching by blood type: ${type}`);
    
    // Get all inventory items first (simplified query)
    const inventoryQuery = query(collection(db, 'inventory'));
    const inventorySnapshot = await getDocs(inventoryQuery);
    
    // Filter in memory for blood type and available units
    const filteredInventory = inventorySnapshot.docs.filter(doc => {
      const data = doc.data();
      return data.bloodType === type && data.availableUnits > 0;
    });
    
    console.log(`📊 Found ${filteredInventory.length} inventory items for ${type}`);
    
    const bloodBankIds = [...new Set(filteredInventory.map(doc => doc.data().bloodBankId))];
    console.log(`🏥 Found ${bloodBankIds.length} unique blood banks`);
    
    const bloodBanks = [];
    for (const bankId of bloodBankIds) {
      const bankDoc = await getDoc(doc(db, 'bloodBanks', bankId));
      if (bankDoc.exists()) {
        const bankData = bankDoc.data();
        
        if (!city || bankData.city === city) {
          const bankInventory = filteredInventory
            .filter(doc => doc.data().bloodBankId === bankId)
            .map(doc => ({
              id: doc.id,
              ...doc.data()
            }));
          
          bloodBanks.push({
            id: bankId,
            name: bankData.name,
            address: bankData.address,
            city: bankData.city,
            phone: bankData.phone,
            availableUnits: bankInventory.reduce((sum, item) => sum + item.availableUnits, 0)
          });
        }
      }
    }
    
    res.json({
      success: true,
      data: bloodBanks,
      count: bloodBanks.length,
      bloodType: type
    });
  } catch (error) {
    console.error('Error searching by blood type:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to search by blood type',
      details: error.message
    });
  }
});

// Search by city
router.get('/city/:city', async (req, res) => {
  try {
    const { city } = req.params;
    const { bloodType } = req.query;
    
    console.log(`🔍 Searching by city: ${city}`);
    
    let bloodBanksQuery = query(collection(db, 'bloodBanks'), where('city', '==', city));
    const bloodBanksSnapshot = await getDocs(bloodBanksQuery);
    console.log(`🏥 Found ${bloodBanksSnapshot.docs.length} blood banks in ${city}`);
    
    const bloodBanks = [];
    for (const bankDoc of bloodBanksSnapshot.docs) {
      const bankData = bankDoc.data();
      
      // Get inventory for this blood bank (simplified query)
      const inventoryQuery = query(collection(db, 'inventory'));
      const inventorySnapshot = await getDocs(inventoryQuery);
      
      // Filter in memory
      let inventory = inventorySnapshot.docs
        .filter(doc => {
          const data = doc.data();
          return data.bloodBankId === bankDoc.id && data.availableUnits > 0;
        })
        .map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
      
      if (bloodType) {
        inventory = inventory.filter(item => item.bloodType === bloodType);
      }
      
      if (inventory.length > 0) {
        bloodBanks.push({
          id: bankDoc.id,
          ...bankData,
          inventory
        });
      }
    }
    
    res.json({
      success: true,
      data: bloodBanks,
      count: bloodBanks.length,
      city
    });
  } catch (error) {
    console.error('Error searching by city:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to search by city',
      details: error.message
    });
  }
});

// Get available blood types
router.get('/available-types', async (req, res) => {
  try {
    // Get all inventory items first (simplified query)
    const inventoryQuery = query(collection(db, 'inventory'));
    const inventorySnapshot = await getDocs(inventoryQuery);
    
    // Filter in memory for available units
    const availableInventory = inventorySnapshot.docs.filter(doc => {
      const data = doc.data();
      return data.availableUnits > 0;
    });
    
    const bloodTypes = [...new Set(availableInventory.map(doc => doc.data().bloodType))];
    
    res.json({
      success: true,
      data: bloodTypes,
      count: bloodTypes.length
    });
  } catch (error) {
    console.error('Error fetching available blood types:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to fetch available blood types',
      details: error.message
    });
  }
});

// Get cities with blood banks
router.get('/cities', async (req, res) => {
  try {
    const bloodBanksQuery = query(collection(db, 'bloodBanks'));
    const bloodBanksSnapshot = await getDocs(bloodBanksQuery);
    
    const cities = [...new Set(bloodBanksSnapshot.docs.map(doc => doc.data().city))];
    
    res.json({
      success: true,
      data: cities,
      count: cities.length
    });
  } catch (error) {
    console.error('Error fetching cities:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to fetch cities',
      details: error.message
    });
  }
});

module.exports = router; 
