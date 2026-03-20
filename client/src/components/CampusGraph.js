const campusGraph = {
  Entrance: ["Admin"],
  Admin: ["Entrance", "Library", "CSE", "Civil"],
  Library: ["Admin"],
  CSE: ["Admin"],
  Civil: ["Admin", "Mechanical"],
  Mechanical: ["Civil", "Dining", "Playground"],
  Dining: ["Mechanical"],
  Playground: ["Mechanical"]
};

export default campusGraph;