# Release Notes

## 0.0.5

December 16, 2021: A user uncovered an issue with the module and in researching the solution (I'm still not sure this fixes the user's problem) I noticed that for new Firebase functions, the `firebase.json` file no longer has a `source` property for the `functions` object. So, I refactored the code so it sets the functions source code folder to a default value of `functions` if the property is not set in the file.
