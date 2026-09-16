'use client';
import {useState} from 'react';
import {amenities,amenityLabels,normalizeCustomAmenities,type Amenity} from '@/lib/organizer';

export function EventAmenitiesField({initialAmenities=[],initialCustomAmenities=[]}:{initialAmenities?:Amenity[];initialCustomAmenities?:string[]}) {
 const [selected,setSelected]=useState<Amenity[]>(initialAmenities);
 const [custom,setCustom]=useState<string[]>(initialCustomAmenities);
 const [draft,setDraft]=useState('');
 const toggle=(amenity:Amenity)=>setSelected(current=>current.includes(amenity)?current.filter(item=>item!==amenity):[...current,amenity]);
 const addCustom=()=>{const next=normalizeCustomAmenities([...custom,draft]);if(next.length===custom.length||next.length>10)return;setCustom(next);setDraft('');};
 return <fieldset className="grid gap-3 border-t border-[var(--line)] pt-5">
  <legend className="text-lg font-bold">Amenities provided</legend>
  <p className="text-sm text-[var(--muted)]">Select the facilities and services available at this event.</p>
  <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">{amenities.map(amenity=><button aria-pressed={selected.includes(amenity)} className={`rounded-xl border px-4 py-3 text-left font-bold transition ${selected.includes(amenity)?'border-[var(--ink)] bg-[var(--ink)] text-white':'border-[var(--line)] bg-white hover:bg-[var(--soft)]'}`} key={amenity} onClick={()=>toggle(amenity)} type="button">{amenityLabels[amenity]}</button>)}</div>
  {selected.map(amenity=><input key={amenity} name="amenities" type="hidden" value={amenity}/>)}
  <div className="grid gap-2 rounded-xl border border-[var(--line)] p-4"><label className="label">Other amenity <span className="field-optional">Optional</span><div className="flex gap-2"><input className="input" maxLength={80} onChange={event=>setDraft(event.target.value)} onKeyDown={event=>{if(event.key==='Enter'){event.preventDefault();addCustom();}}} placeholder="For example: Cloakroom" value={draft}/><button className="button button-secondary shrink-0" disabled={!draft.trim()||custom.length>=10} onClick={addCustom} type="button">Add</button></div></label>
  {custom.length?<div className="flex flex-wrap gap-2">{custom.map(item=><span className="badge flex items-center gap-2" key={item}>{item}<button aria-label={`Remove ${item}`} className="font-black" onClick={()=>setCustom(values=>values.filter(value=>value!==item))} type="button">×</button><input name="custom_amenities" type="hidden" value={item}/></span>)}</div>:null}<p className="text-xs text-[var(--muted)]">Up to 10 custom amenities.</p></div>
 </fieldset>;
}
