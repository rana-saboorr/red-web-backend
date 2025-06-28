const express = require('express');
const router = express.Router();
const { getFirestore, collection, getDocs, query, where, doc, getDoc, addDoc, updateDoc, deleteDoc } = require('firebase/firestore');

const db = getFirestore();

// Get all blood requests
router.get('/', async (req, res) => {
  try {
    const { status, bloodType, bloodBankId } = req.query;
    
    let q = collection(db, 'bloodRequests');
    
    if (status) {
      q = query(q, where('status', '==', status));
    }
    if (bloodType) {
      q = query(q, where('bloodType', '==', bloodType));
    }
    if (bloodBankId) {
      q = query(q, where('bloodBankId', '==', bloodBankId));
    }
    
    const querySnapshot = await getDocs(q);
    const requests = [];
    
    querySnapshot.forEach((doc) => {
      requests.push({
        id: doc.id,
        ...doc.data()
      });
    });
    
    res.json({
      success: true,
      data: requests,
      count: requests.length
    });
  } catch (error) {
    console.error('Error fetching blood requests:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to fetch blood requests' 
    });
  }
});

// Get specific blood request
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const docRef = doc(db, 'bloodRequests', id);
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
        error: 'Blood request not found' 
      });
    }
  } catch (error) {
    console.error('Error fetching blood request:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to fetch blood request' 
    });
  }
});

// Create new blood request
router.post('/', async (req, res) => {
  try {
    const { 
      bloodType, 
      units, 
      urgency, 
      patientName, 
      contactNumber, 
      hospital, 
      bloodBankId,
      notes 
    } = req.body;
    
    // Validation
    if (!bloodType || !units || !patientName || !contactNumber) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields'
      });
    }
    
    const requestData = {
      bloodType,
      units: parseInt(units),
      urgency: urgency || 'normal',
      patientName,
      contactNumber,
      hospital: hospital || '',
      bloodBankId: bloodBankId || '',
      notes: notes || '',
      status: 'pending',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    const docRef = await addDoc(collection(db, 'bloodRequests'), requestData);
    
    res.status(201).json({
      success: true,
      data: {
        id: docRef.id,
        ...requestData
      },
      message: 'Blood request created successfully'
    });
  } catch (error) {
    console.error('Error creating blood request:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to create blood request' 
    });
  }
});

// Update blood request
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = {
      ...req.body,
      updatedAt: new Date().toISOString()
    };
    
    const docRef = doc(db, 'bloodRequests', id);
    await updateDoc(docRef, updateData);
    
    res.json({
      success: true,
      message: 'Blood request updated successfully'
    });
  } catch (error) {
    console.error('Error updating blood request:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to update blood request' 
    });
  }
});

// Update blood request status
router.patch('/:id/status', async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    
    if (!status) {
      return res.status(400).json({
        success: false,
        error: 'Status is required'
      });
    }
    
    const validStatuses = ['pending', 'approved', 'rejected', 'completed', 'cancelled'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid status'
      });
    }
    
    const docRef = doc(db, 'bloodRequests', id);
    await updateDoc(docRef, {
      status,
      updatedAt: new Date().toISOString()
    });
    
    res.json({
      success: true,
      message: `Blood request status updated to ${status}`
    });
  } catch (error) {
    console.error('Error updating blood request status:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to update blood request status' 
    });
  }
});

// Delete blood request
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const docRef = doc(db, 'bloodRequests', id);
    await deleteDoc(docRef);
    
    res.json({
      success: true,
      message: 'Blood request deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting blood request:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to delete blood request' 
    });
  }
});

module.exports = router; 
