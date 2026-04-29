const express = require('express');
const router = express.Router();
const infraController = require('../controllers/infrastructureController');
 
// Protect all routes and inject req.instituteId
const { verifyToken } = require('../middlewares/authMiddleware');
router.use(verifyToken);
 
// 1. Fetch Data
router.get('/', infraController.getInfrastructure);
 
// 2. Create Routes
router.post('/campuses', infraController.createCampus);
router.post('/buildings', infraController.createBuilding);
router.post('/rooms', infraController.createRoom);
 
// 3. Status Toggle
router.put('/toggle/:type/:id', infraController.toggleStatus);
 
// 🚀 4. DELETE ROUTES (Fixes the 404 errors)
router.delete('/campuses/:id', infraController.deleteCampus);
router.delete('/buildings/:id', infraController.deleteBuilding);
router.delete('/rooms/:id', infraController.deleteRoom);
 
// 📝 5. UPDATE ROUTES (For the Edit buttons)
router.put('/campuses/:id', infraController.updateCampus);
router.put('/buildings/:id', infraController.updateBuilding);
router.put('/rooms/:id', infraController.updateRoom);
 
module.exports = router;