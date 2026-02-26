const express = require('express');
const Ad = require('../models/Ad');

const router = express.Router();

/**
 * GET /api/ads
 * Fetch active advertisements for a given location and region.  Ads are
 * considered active if the current date is between startDate and endDate.
 * If a region is provided, ads targeting that region or the global region
 * are returned.  If no region is provided, only global ads are returned.
 *
 * Query parameters:
 *  - location: ad placement location (e.g. 'top-banner', 'sidebar')
 *  - region: region slug (e.g. 'north-america')
 */
router.get('/', async (req, res) => {
  try {
    const { location, region } = req.query;
    const now = new Date();
    const filter = {
      startDate: { $lte: now },
      endDate: { $gte: now }
    };
    if (location) {
      filter.location = location;
    }
    if (region) {
      // Return ads where regions array contains either the specific region or 'global'
      filter.regions = { $in: ['global', region] };
    } else {
      // If no region provided, only return global ads
      filter.regions = { $in: ['global'] };
    }
    const ads = await Ad.find(filter).exec();
    res.json(ads);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;