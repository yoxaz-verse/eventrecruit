"use client";

import dynamic from "next/dynamic";
import { useEffect, useId, useRef, useState } from "react";
import type { LocationResult } from "@/lib/location";
import { DualTextSpinner } from "@/components/dual-text-spinner";

const VenueLocationMap = dynamic(() => import("@/components/venue-location-map"), {
  ssr: false,
  loading: () => (
    <div className="venue-map flex flex-col items-center justify-center p-4 text-xs font-semibold text-[var(--muted)] bg-[var(--surface)]">
      <DualTextSpinner size="sm" showQuotes={false} label="Loading India venue map…" />
    </div>
  ),
});

export type InitialVenueLocation = Partial<Pick<LocationResult, "venue" | "city" | "label" | "latitude" | "longitude" | "countryCode">>;
type LocationOption = { id: string; name: string; state_name: string; country_name: string };

export function VenueLocationPicker({ initial, locations = [], initialLocationId }: { initial?: InitialVenueLocation; locations?: LocationOption[]; initialLocationId?: string | null }) {
  const listId = useId();
  const requestRef = useRef<AbortController | null>(null);
  const hasInitialPin = Number.isFinite(initial?.latitude) && Number.isFinite(initial?.longitude) && initial?.countryCode === "IN";
  const [query, setQuery] = useState(initial?.label || initial?.venue || "");
  const [location, setLocation] = useState<LocationResult | null>(hasInitialPin ? {
    id: "saved", venue: initial?.venue ?? "", city: initial?.city ?? "", label: initial?.label ?? initial?.venue ?? "",
    latitude: initial!.latitude!, longitude: initial!.longitude!, countryCode: "IN",
  } : null);
  const [locked, setLocked] = useState(Boolean(hasInitialPin));
  const [results, setResults] = useState<LocationResult[]>([]);
  const [status, setStatus] = useState("");
  const [activeIndex, setActiveIndex] = useState(-1);
  const [searchEnabled, setSearchEnabled] = useState(false);
  const [locationId, setLocationId] = useState(initialLocationId ?? "");

  useEffect(() => {
    if (!searchEnabled || query.trim().length < 3 || locked) return;
    const timer = window.setTimeout(async () => {
      requestRef.current?.abort();
      const controller = new AbortController(); requestRef.current = controller;
      setStatus("Searching…");
      try {
        const response = await fetch(`/api/locations/search?q=${encodeURIComponent(query.trim())}`, { signal: controller.signal });
        const payload = await response.json();
        if (!response.ok) throw new Error(payload.error);
        setResults(payload.results ?? []); setActiveIndex(-1);
        setStatus(payload.results?.length ? "" : "No matching venues found in India.");
      } catch (error) {
        if ((error as Error).name !== "AbortError") setStatus(error instanceof Error ? error.message : "Location search is unavailable.");
      }
    }, 350);
    return () => window.clearTimeout(timer);
  }, [query, locked, searchEnabled]);

  const choose = (result: LocationResult) => {
    setLocation(result); setQuery(result.label); setResults([]); setStatus("Pin selected. Drag it or click the map to fine-tune, then lock it."); setLocked(false); setSearchEnabled(false);
  };
  const reverse = async (latitude: number, longitude: number) => {
    setLocked(false); setStatus("Identifying location…");
    try {
      const response = await fetch(`/api/locations/reverse?lat=${latitude}&lon=${longitude}`);
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error);
      choose(payload.result);
    } catch (error) { setStatus(error instanceof Error ? error.message : "Unable to identify that location."); }
  };
  const reset = () => { requestRef.current?.abort(); setQuery(""); setLocation(null); setLocationId(""); setLocked(false); setResults([]); setStatus(""); setSearchEnabled(false); };
  const useCurrentLocation = () => {
    setLocked(false); setResults([]);
    if (!navigator.geolocation) { setStatus("Your browser does not support location access."); return; }
    setStatus("Finding your location…");
    navigator.geolocation.getCurrentPosition(({ coords }) => reverse(coords.latitude, coords.longitude), () => setStatus("Location access was denied or unavailable."), { enableHighAccuracy: true, timeout: 10000 });
  };
  const onKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (!results.length) return;
    if (event.key === "ArrowDown") { event.preventDefault(); setActiveIndex(index => Math.min(index + 1, results.length - 1)); }
    if (event.key === "ArrowUp") { event.preventDefault(); setActiveIndex(index => Math.max(index - 1, 0)); }
    if (event.key === "Escape") { setResults([]); setActiveIndex(-1); }
    if (event.key === "Enter" && activeIndex >= 0) { event.preventDefault(); choose(results[activeIndex]); }
  };

  return <fieldset className="grid gap-3 border-t border-[var(--line)] pt-5">
    <legend className="text-lg font-bold">Venue location</legend>
    <p className="text-sm text-[var(--muted)]">Choose a Kerala city, search for the exact venue, adjust the pin if needed, then lock it.</p>
    <label className="label">City <span className="text-red-600">*</span><select className="input" required value={locationId} onChange={event=>setLocationId(event.target.value)}><option value="" disabled>Select a Kerala city</option>{initialLocationId&&!locations.some(option=>option.id===initialLocationId)?<option value={initialLocationId}>{initial?.city??"Current city"}</option>:null}{locations.map(option=><option key={option.id} value={option.id}>{option.name}</option>)}</select></label>
    <div className="relative">
      <label className="label" htmlFor={`${listId}-input`}>Venue or address
        <input id={`${listId}-input`} className="input" value={query} autoComplete="off" role="combobox" aria-autocomplete="list" aria-controls={listId} aria-expanded={results.length > 0} aria-activedescendant={activeIndex >= 0 ? `${listId}-${activeIndex}` : undefined} disabled={locked} maxLength={200} placeholder="Start typing a venue, landmark, or address" onKeyDown={onKeyDown} onChange={event => { setQuery(event.target.value); setSearchEnabled(true); setLocked(false); setLocation(null); setResults([]); setStatus(""); }}/>
      </label>
      {results.length > 0 && <ul id={listId} role="listbox" className="absolute z-[1001] mt-1 max-h-64 w-full overflow-auto rounded-xl border border-[var(--line)] bg-white p-1 shadow-xl">
        {results.map((result, index) => <li id={`${listId}-${index}`} role="option" aria-selected={activeIndex === index} key={result.id}><button className={`w-full rounded-lg px-3 py-2 text-left text-sm hover:bg-[var(--soft)] ${activeIndex === index ? "bg-[var(--soft)]" : ""}`} type="button" onMouseDown={event => event.preventDefault()} onClick={() => choose(result)}><span className="block font-bold">{result.venue}</span><span className="block text-[var(--muted)]">{result.label}</span></button></li>)}
      </ul>}
    </div>
    {location && <>
      <VenueLocationMap latitude={location.latitude} longitude={location.longitude} onMove={reverse}/>
      <div className="grid gap-3 rounded-xl bg-[var(--soft)] p-4 sm:grid-cols-2"><div><span className="text-xs font-bold uppercase tracking-wide text-[var(--muted)]">Venue</span><p className="font-bold">{location.venue}</p></div><div><span className="text-xs font-bold uppercase tracking-wide text-[var(--muted)]">City</span><p className="font-bold">{location.city}</p></div></div>
    </>}
    <div className="flex flex-wrap gap-2">
      {!locked && <button className="button button-secondary" type="button" onClick={useCurrentLocation}>Use my location</button>}
      {location && !locked && <button className="button button-primary" type="button" onClick={() => { setLocked(true); setResults([]); setStatus("Location locked."); }}>Lock location</button>}
      {(query || location) && !locked && <button className="button button-secondary" type="button" onClick={reset}>Reset</button>}
      {locked && <button className="button button-secondary" type="button" onClick={() => { setLocked(false); setStatus("Location unlocked. Search or move the pin, then lock it again."); }}>Unlock to edit</button>}
    </div>
    <p className={`text-sm ${locked ? "text-[var(--success)]" : "text-[var(--muted)]"}`} aria-live="polite">{status || (query.length > 0 && query.length < 3 ? "Type at least 3 characters to search." : "")}</p>
    <input type="hidden" name="venue" value={location?.venue ?? ""}/><input type="hidden" name="city" value={location?.city ?? ""}/>
    <input type="hidden" name="location_label" value={location?.label ?? ""}/><input type="hidden" name="latitude" value={location?.latitude ?? ""}/>
    <input type="hidden" name="longitude" value={location?.longitude ?? ""}/><input type="hidden" name="location_country_code" value={location?.countryCode ?? ""}/>
    <input type="hidden" name="location_id" value={locationId}/><input type="hidden" name="location_locked" value={locked ? "1" : "0"}/>
  </fieldset>;
}
