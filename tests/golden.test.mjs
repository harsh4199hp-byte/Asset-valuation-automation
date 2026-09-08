import fs from "node:fs";

const expected = [
  process.env.AVA_TRANSMISSION_WORKBOOK || "C:\\Users\\harp\\Downloads\\Transmission FAR 29102024 to Dec 2023 Rev 1.1.xlsm",
  process.env.AVA_GENERATING_STATIONS_WORKBOOK || "C:\\Users\\harp\\Downloads\\KGL Generating Stations FAR_30112025 to Dec 2025 Rev 0.1.xlsb",
];
const available = expected.filter((path) => fs.existsSync(path));
if (!available.length) {
  console.log("golden workbook tests skipped: the named Transmission XLSM and KGL Generating Stations XLSB files are not present");
} else {
  console.log(`golden workbook tests pending adapter fixture extraction for: ${available.join(", ")}`);
}
