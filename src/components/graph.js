const graph = {
  MainEntrance: ["AcademicArea"],
  AcademicArea: ["MainEntrance", "AuditoriumAdminCSE", "LibraryMBA", "CivilBlock"],
  AuditoriumAdminCSE: ["AcademicArea", "PhysicsChemistryBlock", "BankPostOffice", "AdministrativeBlock", "CSEBlock", "ISEBlock"],
  AdministrativeBlock: ["AuditoriumAdminCSE"],
  CSEBlock: ["AuditoriumAdminCSE", "ISEBlock"],
  ISEBlock: ["AuditoriumAdminCSE", "CSEBlock"],
  PhysicsChemistryBlock: ["AuditoriumAdminCSE", "CivilBlock", "CanteenSIC"],
  LibraryMBA: ["AcademicArea", "IndoorSports"],
  CivilBlock: ["AcademicArea", "PhysicsChemistryBlock", "MechanicalBlock"],
  MechanicalBlock: ["CivilBlock", "Temple", "CanteenSIC"],
  Temple: ["MechanicalBlock"],
  BankPostOffice: ["AuditoriumAdminCSE"],
  CanteenSIC: ["PhysicsChemistryBlock", "MechanicalBlock", "BoysHostels"],
  BoysHostels: ["CanteenSIC", "GirlsHostels", "DiningRecreation"],
  GirlsHostels: ["BoysHostels", "DiningRecreation"],
  DiningRecreation: ["BoysHostels", "GirlsHostels", "Playground", "STP"],
  IndoorSports: ["LibraryMBA", "Playground"],
  Playground: ["IndoorSports", "DiningRecreation", "STP"],
  STP: ["DiningRecreation", "Playground"]
};

export default graph;