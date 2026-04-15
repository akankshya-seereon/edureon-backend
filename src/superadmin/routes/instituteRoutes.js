const express = require('express');
const router  = express.Router();

const {
  getAllInstitutes,
  getInstituteById,
  addInstitute,
  updateInstitute,
  toggleStatus,
  deleteInstitute,
  getFullInstituteDetails // 🚀 1. Import the new function here
} = require('../controllers/institutecontroller');

const protect = require('../middlewares/authMiddlewares');

router.use(protect);

router.get('/',             getAllInstitutes);

// 🚀 2. Add the new deep-fetch route right here
router.get('/:id/full-details', getFullInstituteDetails); 

router.get('/:id',          getInstituteById);
router.post('/',            addInstitute);
router.put('/:id',          updateInstitute);
router.patch('/:id/status', toggleStatus);
router.delete('/:id',       deleteInstitute);

module.exports = router;