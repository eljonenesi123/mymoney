import mongoose from 'mongoose';

// One document per calendar day (UTC) per base — a running log built up
// from each day's real refresh, not backfilled/fake data. The free
// ExchangeRate-API tier only exposes the latest rate, not historical
// series, so a real chart can only grow forward from when we started
// collecting.
const rateHistorySchema = new mongoose.Schema({
  base: { type: String, required: true },
  date: { type: String, required: true }, // YYYY-MM-DD (UTC)
  rates: { type: Object, required: true },
});

rateHistorySchema.index({ base: 1, date: 1 }, { unique: true });

export default mongoose.model('RateHistory', rateHistorySchema);
