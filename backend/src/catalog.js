import "../../country-catalog.js";

export const countries=globalThis.CartigmaCountries;
export const countryByCode=new Map(countries.map(country=>[country.code,country]));
