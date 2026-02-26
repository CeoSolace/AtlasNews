const mongoose = require('mongoose');

/**
 * Ad schema defines advertisement objects with scheduling and regional
 * targeting.  Ads can be retrieved for a specific location (e.g.,
 * top-banner, sidebar, mid-article) and region.  Start and end dates
 * control when an ad is considered active.
 */
const adSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    image: { type: String },
    link: { type: String },
    location: { type: String, required: true },
    regions: { type: [String], default: ['global'] },
    startDate: { type: Date, default: Date.now },
    endDate: { type: Date }
  },
  { timestamps: true }
);

module.exports = mongoose.model('Ad', adSchema);