import mongoose from 'mongoose';

/**
 * SystemSetting — singleton document approach.
 * Only one document exists (upserted by updateSettings).
 */
const systemSettingSchema = new mongoose.Schema({
  maintenanceMode: { type: Boolean, default: false },
  maxIncidentsPerPage: { type: Number, default: 20, min: 1, max: 100 },
  alertRadiusKm: { type: Number, default: 10, min: 1, max: 500 },
  platformName: { type: String, default: 'Sahay Setu', maxlength: 100 },
  supportEmail: { type: String, default: 'support@sahaysetu.in', maxlength: 200 },
}, { timestamps: true });

const SystemSetting = mongoose.model('SystemSetting', systemSettingSchema);
export default SystemSetting;
