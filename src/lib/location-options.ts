export type NamedLocationOption = { id: string; name: string };

const cityAliases: Record<string, string> = {
  cochin: "ernakulam",
  kochi: "ernakulam",
};

function normalizedCity(value: string) {
  const normalized=value.trim().toLocaleLowerCase("en-IN");
  return cityAliases[normalized] ?? normalized;
}

export function matchingLocationId(city: string, locations: NamedLocationOption[]) {
  const match=normalizedCity(city);
  return locations.find(location=>normalizedCity(location.name)===match)?.id ?? "";
}
