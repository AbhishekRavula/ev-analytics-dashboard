import Papa from "papaparse";

export interface EVData {
  VIN: string;
  County: string;
  City: string;
  State: string;
  "Postal Code": string;
  "Model Year": string;
  Make: string;
  Model: string;
  "Electric Vehicle Type": string;
  "Clean Alternative Fuel Vehicle (CAFV) Eligibility": string;
  "Electric Range": string;
  "Base MSRP": string;
  "Legislative District": string;
  "DOL Vehicle ID": string;
  "Vehicle Location": string;
  "Electric Utility": string;
  "Census Tract 2020": string;
}

export const fetchEVData = (): Promise<EVData[]> => {
  return new Promise((resolve, reject) => {
    Papa.parse("/Electric_Vehicle_Population_Data.csv", {
      header: true,
      download: true,
      complete: (results) => {
        resolve(results.data as EVData[]);
      },
      error: (error) => {
        reject(error);
      },
    });
  });
};
