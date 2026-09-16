export type Company = { id: string; name: string; city: string; description: string; website: string };
export type StaffingNeed = { title: string; people_needed: number | null };
export type BookingSlot = { id?: string; slot_date: string; start_time: string; end_time: string; capacity: number; booked_count?: number };
export type SpaceOffer = { id?: string; name: string; description: string; inclusions: string; area_sqft: number | null; unit_count: number | null; price_type: 'fixed' | 'per_sqft' | 'quote'; price_inr: number | null; is_active?: boolean };
export const amenities = ['food','stay','transport','parking','wifi','restrooms','drinking_water','first_aid','wheelchair_accessible','security','charging_points'] as const;
export type Amenity = typeof amenities[number];
export const amenityLabels: Record<Amenity,string> = { food:'Food / meals', stay:'Accommodation / stay', transport:'Local transport', parking:'Parking', wifi:'Wi-Fi', restrooms:'Restrooms', drinking_water:'Drinking water', first_aid:'First aid / medical support', wheelchair_accessible:'Wheelchair accessibility', security:'Security', charging_points:'Charging points' };
export function normalizeCustomAmenities(values:string[]) {
 const seen=new Set<string>();
 return values.map(value=>value.trim()).filter(value=>{const key=value.toLocaleLowerCase('en');if(!value||seen.has(key))return false;seen.add(key);return true;});
}
export function validEventAmenities(selected:string[],custom:string[]) {
 const normalized=normalizeCustomAmenities(custom);
 return selected.length<=amenities.length && new Set(selected).size===selected.length && selected.every(item=>amenities.includes(item as Amenity)) && custom.length===normalized.length && normalized.length<=10 && normalized.every(item=>item.length<=80);
}
export function eventAmenityLabels(selected:readonly string[]=[],custom:readonly string[]=[]) {
 return [...selected.filter(item=>amenities.includes(item as Amenity)).map(item=>amenityLabels[item as Amenity]),...custom];
}
export const eventTypes = ['expo','exhibition','activation','fair_festival','conference','other'] as const;
export type EventType = typeof eventTypes[number];
export const eventTypeLabels: Record<EventType,string> = { expo:'Expo / Trade Show', exhibition:'Exhibition / Showcase', activation:'Pop-up / Brand Activation', fair_festival:'Fair / Mela / Festival', conference:'Conference / Corporate Event', other:'Other' };
export const venueSettings = ['convention_centre','mall_retail','hotel_banquet','outdoor_public_ground','store_showroom','office_campus','other'] as const;
export type VenueSetting = typeof venueSettings[number];
export const venueSettingLabels: Record<VenueSetting,string> = { convention_centre:'Convention / exhibition centre', mall_retail:'Mall / retail', hotel_banquet:'Hotel / banquet', outdoor_public_ground:'Outdoor / public ground', store_showroom:'Store / showroom', office_campus:'Office / campus', other:'Other' };
export function eventTypeLabel(value:string) { return eventTypeLabels[value as EventType]??eventTypeLabels.other; }
export function venueSettingLabel(value:string) { return venueSettingLabels[value as VenueSetting]??venueSettingLabels.other; }
export const requirementSections = ['exhibitor_spaces','staffing','attendee_booking','venue_infrastructure','utilities_equipment','compliance_safety','logistics'] as const;
export type RequirementSection = typeof requirementSections[number];
export const requirementSectionLabels: Record<RequirementSection,string> = { exhibitor_spaces:'Exhibitor / stall spaces', staffing:'Talent / staffing', attendee_booking:'Attendee booking', venue_infrastructure:'Venue infrastructure', utilities_equipment:'Utilities / equipment', compliance_safety:'Compliance / safety', logistics:'Logistics' };
export const eventRequirementTemplates: Record<EventType,RequirementSection[]> = {
 expo:['exhibitor_spaces','attendee_booking','staffing','venue_infrastructure','utilities_equipment','logistics'],
 exhibition:['exhibitor_spaces','attendee_booking','staffing','venue_infrastructure'],
 activation:['staffing','utilities_equipment','logistics'],
 fair_festival:['exhibitor_spaces','staffing','venue_infrastructure','utilities_equipment','compliance_safety','logistics'],
 conference:['attendee_booking','staffing','venue_infrastructure','logistics'],
 other:[],
};
export type OrganizerEvent = { id: string; company_id: string; title: string; description: string; venue: string; city: string; location_id?: string | null; latitude?: number | null; longitude?: number | null; location_label?: string | null; location_country_code?: string | null; starts_at: string | null; ends_at: string | null; event_type: EventType; venue_setting: VenueSetting; requirement_sections: RequirementSection[]; requirement_details: Partial<Record<RequirementSection,string>>; amenities: Amenity[]; custom_amenities: string[]; status: 'draft' | 'published' | 'cancelled'; published_at: string | null; staffing_needs: StaffingNeed[]; booking_url: string; logo_path?: string | null; pricing_chart_path?: string | null; floor_layout_path?: string | null };
export function validEventClassification(eventType:string,venueSetting:string) { return eventTypes.includes(eventType as EventType) && venueSettings.includes(venueSetting as VenueSetting); }
export function validRequirementSections(sections:string[]) { return sections.length<=requirementSections.length && new Set(sections).size===sections.length && sections.every(section=>requirementSections.includes(section as RequirementSection)); }
export function validSpaceOffer(offer: SpaceOffer) {
 return offer.name.trim().length > 0 && offer.name.length <= 160 && offer.description.length <= 3000 && offer.inclusions.length <= 3000 &&
  (offer.area_sqft === null || (Number.isFinite(offer.area_sqft) && offer.area_sqft > 0 && offer.area_sqft <= 1000000)) &&
  (offer.unit_count === null || (Number.isInteger(offer.unit_count) && offer.unit_count > 0 && offer.unit_count <= 100000)) &&
  ['fixed','per_sqft','quote'].includes(offer.price_type) &&
  (offer.price_type === 'quote' ? offer.price_inr === null : Number.isInteger(offer.price_inr) && (offer.price_inr ?? 0) > 0 && (offer.price_inr ?? 0) <= 1000000000);
}
export function validSpaceAttachment(file: File) {
 return file.size > 0 && file.size <= 5 * 1024 * 1024 && ['application/pdf','image/png','image/jpeg','image/webp'].includes(file.type);
}
export function validStaffingNeeds(needs: StaffingNeed[]) {
 return needs.length > 0 && needs.length <= 30 && needs.every(need => need.title.trim().length > 0 && need.title.length <= 160 && Number.isInteger(need.people_needed) && (need.people_needed ?? 0) > 0 && (need.people_needed ?? 0) <= 100000);
}
export function indiaToday() { return new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Kolkata', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date()); }
export function eventPhase(event: OrganizerEvent, today = indiaToday()) {
 if (event.status !== 'published') return event.status;
 if (event.ends_at && event.ends_at < today) return 'past';
 if (event.starts_at && event.starts_at > today) return 'upcoming';
 return 'ongoing';
}
export function validDate(value: string) { return /^\d{4}-\d{2}-\d{2}$/.test(value) && !Number.isNaN(Date.parse(value)) && new Date(value).toISOString().slice(0,10) === value; }
export function validBookingSlot(slot: BookingSlot, start: string, end: string) {
 return validDate(slot.slot_date) && slot.slot_date >= start && slot.slot_date <= end && /^([01]\d|2[0-3]):[0-5]\d$/.test(slot.start_time) && /^([01]\d|2[0-3]):[0-5]\d$/.test(slot.end_time) && slot.end_time > slot.start_time && Number.isInteger(slot.capacity) && slot.capacity > 0 && slot.capacity <= 100000;
}
