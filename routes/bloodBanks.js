const express = require('express');
const router = express.Router();
const { getFirestore, collection, getDocs, query, where, doc, getDoc, addDoc, updateDoc, deleteDoc } = require('firebase/firestore');

const db = getFirestore();

// Get all blood banks
router.get('/', async (req, res) => {
  try {
    const { city, status, approved } = req.query;
    
    let q = collection(db, 'bloodBanks');
    
    if (city) {
      q = query(q, where('city', '==', city));
    }
    if (status) {
      q = query(q, where('status', '==', status));
    }
    if (approved !== undefined) {
      q = query(q, where('approved', '==', approved === 'true'));
    }
    
    const querySnapshot = await getDocs(q);
    const bloodBanks = [];
    
    querySnapshot.forEach((doc) => {
      bloodBanks.push({
        id: doc.id,
        ...doc.data()
      });
    });
    
    res.json({
      success: true,
      data: bloodBanks,
      count: bloodBanks.length
    });
  } catch (error) {
    console.error('Error fetching blood banks:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to fetch blood banks' 
    });
  }
});

// Get specific blood bank
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const docRef = doc(db, 'bloodBanks', id);
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
        error: 'Blood bank not found' 
      });
    }
  } catch (error) {
    console.error('Error fetching blood bank:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to fetch blood bank' 
    });
  }
});

// Create new blood bank
router.post('/', async (req, res) => {
  try {
    const { 
      name, 
      address, 
      city, 
      phone, 
      email, 
      capacity, 
      licenseNumber,
      contactPerson 
    } = req.body;
    
    // Validation
    if (!name || !address || !city || !phone || !email) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields'
      });
    }
    
    const bloodBankData = {
      name,
      address,
      city,
      phone,
      email,
      capacity: parseInt(capacity) || 0,
      licenseNumber: licenseNumber || '',
      contactPerson: contactPerson || '',
      status: 'pending',
      approved: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    const docRef = await addDoc(collection(db, 'bloodBanks'), bloodBankData);
    
    res.status(201).json({
      success: true,
      data: {
        id: docRef.id,
        ...bloodBankData
      },
      message: 'Blood bank created successfully'
    });
  } catch (error) {
    console.error('Error creating blood bank:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to create blood bank' 
    });
  }
});

// Update blood bank
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = {
      ...req.body,
      updatedAt: new Date().toISOString()
    };
    
    const docRef = doc(db, 'bloodBanks', id);
    await updateDoc(docRef, updateData);
    
    res.json({
      success: true,
      message: 'Blood bank updated successfully'
    });
  } catch (error) {
    console.error('Error updating blood bank:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to update blood bank' 
    });
  }
});

// Delete blood bank
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const docRef = doc(db, 'bloodBanks', id);
    await deleteDoc(docRef);
    
    res.json({
      success: true,
      message: 'Blood bank deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting blood bank:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to delete blood bank' 
    });
  }
});

// Get blood bank inventory
router.get('/:id/inventory', async (req, res) => {
  try {
    const { id } = req.params;
    
    const inventoryQuery = query(
      collection(db, 'bloodInventory'),
      where('bloodBankId', '==', id)
    );
    
    const querySnapshot = await getDocs(inventoryQuery);
    const inventory = [];
    
    querySnapshot.forEach((doc) => {
      inventory.push({
        id: doc.id,
        ...doc.data()
      });
    });
    
    res.json({
      success: true,
      data: inventory,
      count: inventory.length
    });
  } catch (error) {
    console.error('Error fetching blood bank inventory:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to fetch blood bank inventory' 
    });
  }
});

module.exports = router; 
