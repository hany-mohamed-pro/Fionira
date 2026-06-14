try {
  Object.keys(null);
} catch (e) {
  console.log("Object.keys(null) ->", e.message);
}

try {
  Object.entries(undefined);
} catch (e) {
  console.log("Object.entries(undefined) ->", e.message);
}

try {
  const x = {...Object(null)};
} catch (e) {
  console.log("...Object(null) ->", e.message);
}
