//GOAL: Allow the user to sequence through the attributes and resymbolize the map
//   according to each attribute
//STEPS:
//Step 1. Create UI affordances for sequencing
//Step 2. Listen for user input via affordances
//Step 3. Respond to user input by changing the selected attribute
//Step 4. Resize proportional symbols according to each feature's value for the new attribute


//More details
//GOAL: Allow the user to sequence through the attributes and resymbolize the map
//   according to each attribute
//STEPS:
//Step 1. Create slider widget
//Step 2. Create step buttons
//Step 3. Create an array of the sequential attributes to keep track of their order
//Step 4. Assign the current attribute based on the index of the attributes array
//Step 5. Listen for user input via affordances
//Step 6. For a forward step through the sequence, increment the attributes array index;
//   for a reverse step, decrement the attributes array index
//Step 7. At either end of the sequence, return to the opposite end of the sequence on the next step
//   (wrap around)
//Step 8. Update the slider position based on the new index
//Step 9. Reassign the current attribute based on the new attributes array index
//Step 10. Resize proportional symbols according to each feature's value for the new attribute
