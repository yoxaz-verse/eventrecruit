import {eventAmenityLabels} from '@/lib/organizer';

export function EventAmenities({amenities=[],customAmenities=[],compact=false}:{amenities?:readonly string[];customAmenities?:readonly string[];compact?:boolean}) {
 const labels=eventAmenityLabels(amenities,customAmenities);
 if(!labels.length)return null;
 const visible=compact?labels.slice(0,3):labels;
 return <div className={compact?'flex flex-wrap gap-2':'mt-8 border-t border-[var(--line)] pt-6'}>{compact?null:<h2 className="mb-4 text-2xl font-bold">Amenities provided</h2>}<div className="flex flex-wrap gap-2">{visible.map((label,index)=><span className="badge" key={`${label}-${index}`}>{label}</span>)}{compact&&labels.length>3?<span className="badge">+{labels.length-3} more</span>:null}</div></div>;
}
