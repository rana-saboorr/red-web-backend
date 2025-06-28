const express = require('express');
const router = express.Router();
const { getFirestore, collection, getDocs, query, where, doc, getDoc, addDoc, updateDoc, deleteDoc } = require('firebase/firestore');

const db = getFirestore();

// Get all blood inventory
router.get('/', async (req, res) => {
  try {
    const { bloodType, city, bloodBankId } = req.query;
    
    let q = collection(db, 'inventory');
    
    // Apply filters
    if (bloodType) {
      q = query(q, where('bloodType', '==', bloodType));
    }
    if (bloodBankId) {
      q = query(q, where('bloodBankId', '==', bloodBankId));
    }
    
    const querySnapshot = await getDocs(q);
    const inventory = [];
    
    querySnapshot.forEach((doc) => {
      inventory.push({
        id: doc.id,
        ...doc.data()
      });
    });
    
    // Filter by city if provided
    let filteredInventory = inventory;
    if (city) {
      // Get blood banks in the city
      const bloodBanksQuery = query(collection(db, 'bloodBanks'), where('city', '==', city));
      const bloodBanksSnapshot = await getDocs(bloodBanksQuery);
      const bloodBankIds = bloodBanksSnapshot.docs.map(doc => doc.id);
      
      filteredInventory = inventory.filter(item => bloodBankIds.includes(item.bloodBankId));
    }
    
    res.json({
      success: true,
      data: filteredInventory,
      count: filteredInventory.length
    });
  } catch (error) {
    console.error('Error fetching blood inventory:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to fetch blood inventory' 
    });
  }
});

// Get specific blood inventory item
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const docRef = doc(db, 'inventory', id);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      res.json({
        success: true,
        data: {
          id: docSnap.id,
          ...docSnap.data()
        }
      });
    } else {
      res.status(404).json({ 
        success: false, 
        error: 'Blood inventory item not found' 
      });
    }
  } catch (error) {
    console.error('Error fetching blood inventory item:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to fetch blood inventory item' 
    });
  }
});

// Create new blood inventory item
router.post('/', async (req, res) => {
  try {
    const { bloodType, availableUnits, bloodBankId, expiryDate } = req.body;
    
    // Validation
    if (!bloodType || !availableUnits || !bloodBankId) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields'
      });
    }
    
    const inventoryData = {
      bloodType,
      availableUnits: parseInt(availableUnits),
      bloodBankId,
      expiryDate: expiryDate || null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    const docRef = await addDoc(collection(db, 'inventory'), inventoryData);
    
    res.status(201).json({
      success: true,
      data: {
        id: docRef.id,
        ...inventoryData
      },
      message: 'Blood inventory item created successfully'
    });
  } catch (error) {
    console.error('Error creating blood inventory item:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to create blood inventory item' 
    });
  }
});

// Update blood inventory item
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = {
      ...req.body,
      updatedAt: new Date().toISOString()
    };
    
    const docRef = doc(db, 'inventory', id);
    await updateDoc(docRef, updateData);
    
    res.json({
      success: true,
      message: 'Blood inventory item updated successfully'
    });
  } catch (error) {
    console.error('Error updating blood inventory item:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to update blood inventory item' 
    });
  }
});

// Delete blood inventory item
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const docRef = doc(db, 'inventory', id);
    await deleteDoc(docRef);
    
    res.json({
      success: true,
      message: 'Blood inventory item deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting blood inventory item:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to delete blood inventory item' 
    });
  }
});

module.exports = router; 
