const express = require('express');
const router = express.Router();
const { getFirestore, collection, getDocs, query, where, doc, getDoc, addDoc, updateDoc, deleteDoc, orderBy } = require('firebase/firestore');

const db = getFirestore();

// Get all campaigns
router.get('/', async (req, res) => {
  try {
    const { status, city, bloodBankId, bloodType } = req.query;
    
    let q = collection(db, 'campaigns');
    
    // Apply filters
    if (status) {
      q = query(q, where('status', '==', status));
    }
    if (city) {
      q = query(q, where('location', '==', city));
    }
    if (bloodBankId) {
      q = query(q, where('bloodBankId', '==', bloodBankId));
    }
    
    // Order by creation date (newest first)
    q = query(q, orderBy('createdAt', 'desc'));
    
    const querySnapshot = await getDocs(q);
    const campaigns = [];
    
    querySnapshot.forEach((doc) => {
      campaigns.push({
        id: doc.id,
        ...doc.data()
      });
    });
    
    // Filter by blood type if provided (client-side filter)
    let filteredCampaigns = campaigns;
    if (bloodType) {
      filteredCampaigns = campaigns.filter(campaign => 
        campaign.bloodTypes && campaign.bloodTypes.includes(bloodType)
      );
    }
    
    res.json({
      success: true,
      data: filteredCampaigns,
      count: filteredCampaigns.length
    });
  } catch (error) {
    console.error('Error fetching campaigns:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to fetch campaigns',
      details: error.message
    });
  }
});

// Get specific campaign
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const docRef = doc(db, 'campaigns', id);
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
        error: 'Campaign not found' 
      });
    }
  } catch (error) {
    console.error('Error fetching campaign:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to fetch campaign' 
    });
  }
});

// Create new campaign
router.post('/', async (req, res) => {
  try {
    const { 
      title, 
      description, 
      location, 
      bloodBankId,
      bloodBankName,
      targetUnits, 
      startDate,
      endDate,
      contactPerson,
      contactPhone,
      contactEmail,
      bloodTypes
    } = req.body;
    
    // Validation
    if (!title || !description || !location || !bloodBankId || !bloodBankName) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields'
      });
    }
    
    const campaignData = {
      title,
      description,
      location,
      bloodBankId,
      bloodBankName,
      targetUnits: parseInt(targetUnits) || 0,
      currentUnits: 0,
      startDate: startDate || null,
      endDate: endDate || null,
      contactPerson: contactPerson || '',
      contactPhone: contactPhone || '',
      contactEmail: contactEmail || '',
      bloodTypes: bloodTypes || [],
      status: 'pending',
      approved: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    const docRef = await addDoc(collection(db, 'campaigns'), campaignData);
    
    res.status(201).json({
      success: true,
      data: {
        id: docRef.id,
        ...campaignData
      },
      message: 'Campaign created successfully'
    });
  } catch (error) {
    console.error('Error creating campaign:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to create campaign' 
    });
  }
});

// Update campaign
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = {
      ...req.body,
      updatedAt: new Date().toISOString()
    };
    
    const docRef = doc(db, 'campaigns', id);
    await updateDoc(docRef, updateData);
    
    res.json({
      success: true,
      message: 'Campaign updated successfully'
    });
  } catch (error) {
    console.error('Error updating campaign:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to update campaign' 
    });
  }
});

// Update campaign status (admin approval)
router.patch('/:id/status', async (req, res) => {
  try {
    const { id } = req.params;
    const { status, adminNotes } = req.body;
    
    if (!status || !['pending', 'approved', 'rejected'].includes(status)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid status. Must be pending, approved, or rejected'
      });
    }
    
    const updateData = {
      status: status,
      approved: status === 'approved',
      adminNotes: adminNotes || '',
      updatedAt: new Date().toISOString()
    };
    
    if (status === 'approved') {
      updateData.approvedAt = new Date().toISOString();
    }
    
    const docRef = doc(db, 'campaigns', id);
    await updateDoc(docRef, updateData);
    
    res.json({
      success: true,
      message: `Campaign ${status} successfully`
    });
  } catch (error) {
    console.error('Error updating campaign status:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to update campaign status' 
    });
  }
});

// Delete campaign
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const docRef = doc(db, 'campaigns', id);
    await deleteDoc(docRef);
    
    res.json({
      success: true,
      message: 'Campaign deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting campaign:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to delete campaign' 
    });
  }
});

// Get campaigns by blood bank (with fallback for index issues)
router.get('/blood-bank/:bloodBankId', async (req, res) => {
  try {
    const { bloodBankId } = req.params;
    const { status } = req.query;
    
    // Try with index first
    try {
      let q = query(
        collection(db, 'campaigns'),
        where('bloodBankId', '==', bloodBankId),
        orderBy('createdAt', 'desc')
      );
      
      if (status) {
        q = query(q, where('status', '==', status));
      }
      
      const querySnapshot = await getDocs(q);
      const campaigns = [];
      
      querySnapshot.forEach((doc) => {
        campaigns.push({
          id: doc.id,
          ...doc.data()
        });
      });
      
      res.json({
        success: true,
        data: campaigns,
        count: campaigns.length
      });
    } catch (indexError) {
      // Fallback: Get all campaigns and filter client-side
      console.log('Index not available, using client-side filter');
      const querySnapshot = await getDocs(collection(db, 'campaigns'));
      const allCampaigns = [];
      
      querySnapshot.forEach((doc) => {
        const campaign = { id: doc.id, ...doc.data() };
        if (campaign.bloodBankId === bloodBankId) {
          if (!status || campaign.status === status) {
            allCampaigns.push(campaign);
          }
        }
      });
      
      // Sort by creation date
      allCampaigns.sort((a, b) => {
        const aTime = a.createdAt?.seconds || 0;
        const bTime = b.createdAt?.seconds || 0;
        return bTime - aTime;
      });
      
      res.json({
        success: true,
        data: allCampaigns,
        count: allCampaigns.length,
        note: 'Using client-side filtering due to missing index'
      });
    }
  } catch (error) {
    console.error('Error fetching campaigns by blood bank:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to fetch campaigns by blood bank',
      details: error.message
    });
  }
});

// Get approved campaigns by city (with fallback for index issues)
router.get('/city/:city', async (req, res) => {
  try {
    const { city } = req.params;
    const { bloodType } = req.query;
    
    // Try with index first
    try {
      let q = query(
        collection(db, 'campaigns'),
        where('location', '==', city),
        where('status', '==', 'approved'),
        orderBy('createdAt', 'desc')
      );
      
      const querySnapshot = await getDocs(q);
      const campaigns = [];
      
      querySnapshot.forEach((doc) => {
        campaigns.push({
          id: doc.id,
          ...doc.data()
        });
      });
      
      // Filter by blood type if provided
      let filteredCampaigns = campaigns;
      if (bloodType) {
        filteredCampaigns = campaigns.filter(campaign => 
          campaign.bloodTypes && campaign.bloodTypes.includes(bloodType)
        );
      }
      
      res.json({
        success: true,
        data: filteredCampaigns,
        count: filteredCampaigns.length,
        city
      });
    } catch (indexError) {
      // Fallback: Get all campaigns and filter client-side
      console.log('Index not available, using client-side filter');
      const querySnapshot = await getDocs(collection(db, 'campaigns'));
      const allCampaigns = [];
      
      querySnapshot.forEach((doc) => {
        const campaign = { id: doc.id, ...doc.data() };
        if (campaign.location === city && campaign.status === 'approved') {
          allCampaigns.push(campaign);
        }
      });
      
      // Filter by blood type if provided
      let filteredCampaigns = allCampaigns;
      if (bloodType) {
        filteredCampaigns = allCampaigns.filter(campaign => 
          campaign.bloodTypes && campaign.bloodTypes.includes(bloodType)
        );
      }
      
      // Sort by creation date
      filteredCampaigns.sort((a, b) => {
        const aTime = a.createdAt?.seconds || 0;
        const bTime = b.createdAt?.seconds || 0;
        return bTime - aTime;
      });
      
      res.json({
        success: true,
        data: filteredCampaigns,
        count: filteredCampaigns.length,
        city,
        note: 'Using client-side filtering due to missing index'
      });
    }
  } catch (error) {
    console.error('Error fetching campaigns by city:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to fetch campaigns by city',
      details: error.message
    });
  }
});

module.exports = router; 
