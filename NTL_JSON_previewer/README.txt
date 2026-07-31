JSON Library Preview
====================

Files
-----
- index.html
- style.css
- script.js
- Jul_01(2).json (sample JSON supplied for testing)

How to use
----------
1. Keep index.html, style.css, and script.js in the same folder.
2. Double-click index.html to open it in your browser.
3. Click "Choose JSON file."
4. Select the JSON file you want to inspect.
5. Each list/date range will appear as its own expandable dropdown.
6. Click a title to test its catalogue URL.

Why the file picker is used
---------------------------
Browsers often block an HTML file opened from a computer from automatically
fetching another local file. The file picker avoids that problem and allows
the same preview page to be reused for every new JSON file.

Note about the supplied sample
------------------------------
The uploaded Jul_01(2).json contains one flat array with 23 title records.
Therefore it displays as one expandable list. A JSON file containing three
date-range lists will display all three as separate dropdowns.
