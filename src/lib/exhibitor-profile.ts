export type ExhibitorProfileValues = {
  fullName: string;
  accountPhone: string;
  companyName: string;
  companyType: string;
  industry: string;
  description: string;
  website: string;
  address: string;
  city: string;
  primaryContactName: string;
  contactPhone: string;
  contactEmail: string;
};

export type ExhibitorProfileValidation =
  | { error: string; values?: never }
  | { error: null; values: ExhibitorProfileValues };

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function validateExhibitorProfile(data: FormData): ExhibitorProfileValidation {
  const value = (key: string) => String(data.get(key) ?? "").trim();
  const values: ExhibitorProfileValues = {
    fullName: value("full_name"),
    accountPhone: value("account_phone"),
    companyName: value("company_name"),
    companyType: value("company_type"),
    industry: value("industry"),
    description: value("description"),
    website: value("website"),
    address: value("address"),
    city: value("city"),
    primaryContactName: value("primary_contact_name"),
    contactPhone: value("contact_phone"),
    contactEmail: value("contact_email").toLowerCase(),
  };

  if (!values.fullName || values.fullName.length > 160) return { error: "Enter the account holder name within 160 characters." };
  if (!values.accountPhone || values.accountPhone.length > 40) return { error: "Enter a valid private account phone number." };
  if (!values.companyName || values.companyName.length > 160) return { error: "Enter the company name within 160 characters." };
  if (!values.city || values.city.length > 120) return { error: "Enter the company city within 120 characters." };
  if (values.companyType.length > 120 || values.industry.length > 160) return { error: "Keep company type and industry within the displayed limits." };
  if (values.description.length > 5000 || values.address.length > 500) return { error: "Keep the description and address within the displayed limits." };
  if (values.primaryContactName.length > 160 || values.contactPhone.length > 40) return { error: "Check the primary contact name and phone number." };
  if (values.contactEmail && (values.contactEmail.length > 254 || !emailPattern.test(values.contactEmail))) return { error: "Enter a valid company contact email." };
  if (values.website) {
    try {
      const url = new URL(values.website);
      if (!['http:', 'https:'].includes(url.protocol)) return { error: "Website must use HTTP or HTTPS." };
    } catch {
      return { error: "Enter a valid company website URL." };
    }
  }
  return { error: null, values };
}

