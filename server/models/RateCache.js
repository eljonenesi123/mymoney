import mongoose from 'mongoose';

// Single shared cache document (not per-user) — exchange rates are the same
// for everyone, so every user's request hits this one cached fetch instead
// of each triggering its own call to the (quota-limited) external API.
const rateCacheSchema = new mongoose.Schema({
  base: { type: String, required: true, unique: true },
  rates: { type: Object, required: true },
  fetchedAt: { type: Date, required: true },
});

export default mongoose.model('RateCache', rateCacheSchema);
