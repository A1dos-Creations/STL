/**
 * script.js
 * Handles calculator logic for the Modern Calculator Chrome Extension.
 * Uses math.js for safe expression evaluation (required due to MV3 CSP).
 * Ensure math.js is loaded before this script in popup.html.
 */

document.addEventListener('DOMContentLoaded', function() {
    // --- DOM Element References ---
    const display = document.getElementById('display');
    const buttons = document.querySelectorAll('.button');
    const themeToggle = document.getElementById('themeToggle');
    const body = document.body;

    // --- State Variable ---
    // Primarily indicates if the *next* input should clear the display (e.g., after hitting '=').
    let shouldResetDisplay = false;

    // --- Theme Handling ---
    function setTheme(theme) {
        body.classList.remove('light-mode', 'dark-mode'); // Remove existing classes
        body.classList.add(theme + '-mode'); // Add current theme class
        themeToggle.checked = (theme === 'dark'); // Sync checkbox state
        // Save the theme preference
        chrome.storage.sync.set({ theme: theme }, () => {
            if (chrome.runtime.lastError) {
                console.error("Error setting theme:", chrome.runtime.lastError);
            }
            // Optional: console.log('Theme saved:', theme);
        });
    }

    // Listener for the theme toggle change
    themeToggle.addEventListener('change', () => {
        setTheme(themeToggle.checked ? 'dark' : 'light');
    });

    // Load saved theme or default to light theme on startup
    chrome.storage.sync.get('theme', (data) => {
         if (chrome.runtime.lastError) {
             console.error("Error getting theme:", chrome.runtime.lastError);
             setTheme('light'); // Default to light on error
         } else {
             const currentTheme = data?.theme || 'light'; // Default to light if nothing is stored
             // Optional: console.log('Loaded theme:', currentTheme);
             setTheme(currentTheme);
         }
    });
    // --- End Theme Handling ---


    // --- Input Validation and Sanitization ---
    // Regex for allowed characters in the display during typing.
    // Allows numbers, standard operators, display operators, dot, parens, e/E, space.
    const allowedCharsRegex = /^[0-9+\-*/().eE\s×÷−]*$/;

    function sanitizeInput(value) {
        // Filter out characters not matching the allowed regex.
        const sanitized = value.split('').filter(char => allowedCharsRegex.test(char)).join('');
        return sanitized;
    }

    // Event listener for direct typing into the display
    display.addEventListener('input', (event) => {
        const currentValue = event.target.value;
        const sanitizedValue = sanitizeInput(currentValue);

        if (currentValue !== sanitizedValue) {
            // If sanitization changed the value, update the display visually
            // and try to maintain cursor position.
            const currentCursorPosition = event.target.selectionStart;
            const diff = currentValue.length - sanitizedValue.length;
            event.target.value = sanitizedValue;
            // Try to restore cursor position
            const newCursorPosition = Math.max(0, currentCursorPosition - diff);
            event.target.setSelectionRange(newCursorPosition, newCursorPosition);
        }
        // Any typing means we are continuing or starting a new expression, unless display was just reset
         if (display.value !== '0' && display.value !== 'Error') { // Avoid resetting if user types over initial '0' or 'Error'
             shouldResetDisplay = false;
         }
    });


    // --- Core Calculation Logic (Using math.js) ---
    function calculateExpression(expression) {
        console.log(`Calculating: "${expression}"`);
        const trimmedExpression = String(expression).trim();

        if (!trimmedExpression || trimmedExpression === 'Error') {
            return '0'; // Return '0' for empty or error states
        }

        try {
            // 1. Prepare the expression for math.js:
            //    - Replace display operators (×, ÷, −) with standard JS operators (*, /, -)
            //    - Remove spaces for evaluation robustness (math.js can handle spaces, but cleaner this way)
             let expr = trimmedExpression
                .replace(/×/g, '*')
                .replace(/÷/g, '/')
                .replace(/−/g, '-');
                // Note: Percentage (%) needs careful handling - see handlePercent function

            // Basic validation before sending to math.js (optional, as math.js handles most errors)
            if (/[\+\-\*\/]$/.test(expr) && !/e[\+\-]$/i.test(expr)) { // Allow e+ or e- for scientific notation
                 console.warn("Expression ends with operator.");
                 // Let math.js handle it, or return specific error: return 'Error: Operator';
            }

            // 2. **Calculate using math.js**
            // Ensure math.js is loaded via HTML script tag first!
            if (typeof math === 'undefined') {
                console.error("math.js library is not loaded!");
                return "Error: Lib Load";
            }
            const result = math.evaluate(expr);

            // Check for valid number result
            if (typeof result !== 'number' || !Number.isFinite(result)) {
                 console.warn("Calculation resulted in non-finite number:", result);
                 // You could return specific strings for Infinity if desired
                 if (result === Infinity) return "Infinity";
                 if (result === -Infinity) return "-Infinity";
                return "Error: Result";
            }

             console.log(`Result: ${result}`);
             return formatResult(result); // Format the result nicely

        } catch (error) {
            // Catch errors from math.evaluate (e.g., syntax errors)
            console.error("math.js Calculation Error:", error);
            // Provide a generic error, or potentially parse error.message for specifics
            return "Error";
        }
    }

     // --- Result Formatting ---
     function formatResult(number) {
        // Limit precision to avoid floating point issues and excessive length
        // Use scientific notation for very large/small numbers
        if (Math.abs(number) > 1e15 || (Math.abs(number) < 1e-10 && number !== 0)) {
            return number.toExponential(8); // Adjust precision as needed
        }
        // Round to a reasonable number of significant digits
        const rounded = parseFloat(number.toPrecision(12));
        return String(rounded);
    }

    // --- Button Event Handlers ---

    // Appends value to display or replaces it if needed
    function appendToDisplay(value) {
        const operators = "+−×÷";
        const currentDisplayValue = display.value;

        // If display shows previous result/error OR is '0' (and not adding decimal), start fresh.
        if (shouldResetDisplay || (currentDisplayValue === '0' && value !== '.')) {
             // Don't start with an operator (unless it's '-')
             if (operators.includes(value) && value !== '−') {
                 display.value = '0' + value; // Prepend 0 if starting with operator like '+'
             } else {
                display.value = value;
             }
            shouldResetDisplay = false;
        } else if (currentDisplayValue.length < 30) { // Add a reasonable length limit
            const lastChar = currentDisplayValue.slice(-1);

            // Prevent multiple decimals within the *current number segment*
            if (value === '.') {
                const segments = currentDisplayValue.split(/[+\−×÷]/);
                if (segments.length > 0 && segments[segments.length - 1].includes('.')) {
                    return; // Already has a decimal in the last number part
                }
            }

            // Prevent consecutive operators (allow '-' for negative numbers)
            if (operators.includes(value) && operators.includes(lastChar)) {
                if (value === '−' && lastChar !== '−') {
                    // Allow '-' after another operator
                    display.value += value;
                } else {
                    // Replace the last operator instead of adding another
                    display.value = currentDisplayValue.slice(0, -1) + value;
                }
            } else {
                display.value += value;
            }
        }
        // Keep focus on display after button click
        display.focus();
    }

    // Attach listener to all buttons
    buttons.forEach(button => {
        button.addEventListener('click', () => {
            const value = button.textContent; // Use textContent (includes ×, ÷ etc.)

            if (button.classList.contains('number') || button.classList.contains('operator') || button.classList.contains('decimal')) {
                appendToDisplay(value);
            } else if (button.classList.contains('equals')) {
                handleEquals();
            } else if (button.classList.contains('clear')) {
                handleClear();
            } else if (button.classList.contains('pm')) {
                handlePlusMinus();
            } else if (button.classList.contains('percent')) {
                handlePercent();
            }
        });
    });

    // Handler for '=' button
    function handleEquals() {
        const result = calculateExpression(display.value);
        display.value = result;
        shouldResetDisplay = true; // Next number/operator should clear the result
        display.focus(); // Keep focus on display
    }

    // Handler for 'C' (Clear) button
    function handleClear() {
        display.value = '0';
        shouldResetDisplay = false; // Allow typing '0' then another digit
        display.focus();
    }

    // Handler for '+/-' (Plus/Minus) button
    // Note: This simple version tries to negate the whole expression if it evaluates
    // to a number. Robustly negating just the last entered number in a complex
    // expression string requires more advanced parsing.
    function handlePlusMinus() {
         try {
             // Prepare expression similar to calculateExpression
             let expr = display.value.replace(/×/g, '*').replace(/÷/g, '/').replace(/−/g, '-');
             const currentValue = math.evaluate(expr); // Evaluate current display

              if (typeof currentValue === 'number' && Number.isFinite(currentValue)) {
                 // If it's a number, negate it and update display
                 display.value = formatResult(currentValue * -1);
                 shouldResetDisplay = false; // Allow continuing operations
             } else {
                 console.warn("Cannot apply +/- to non-numeric display value.");
             }
         } catch(e) {
             console.warn("Could not evaluate display for +/-:", e);
             // Handle cases where display isn't a simple number (e.g., "5+2")
             // Maybe attempt to negate the last segment? (More complex logic)
         }
         display.focus();
    }

    // Handler for '%' (Percent) button
    // Note: This simple version divides the current numeric value by 100.
    // Contextual percentages (like "50 + 10%") are not handled here and would
    // require complex parsing or specific button logic changes.
    function handlePercent() {
         try {
             // Prepare expression similar to calculateExpression
             let expr = display.value.replace(/×/g, '*').replace(/÷/g, '/').replace(/−/g, '-');
             const currentValue = math.evaluate(expr); // Evaluate current display

              if (typeof currentValue === 'number' && Number.isFinite(currentValue)) {
                 // If it's a number, divide by 100 and update display
                 display.value = formatResult(currentValue / 100);
                 shouldResetDisplay = false; // Allow continuing operations
             } else {
                 console.warn("Cannot apply % to non-numeric display value.");
             }
         } catch(e) {
             console.warn("Could not evaluate display for %:", e);
         }
         display.focus();
    }


    // --- Keyboard Handling ---
    document.addEventListener('keydown', (event) => {
        const key = event.key;
        const target = event.target;

        // If focus is *not* on the display, handle keys to simulate button clicks
        if (target !== display) {
             let handled = true; // Assume we handle the key unless specified otherwise
             if (key >= '0' && key <= '9') { appendToDisplay(key); }
             else if (key === '.') { appendToDisplay('.'); }
             else if (key === '+') { appendToDisplay('+'); }
             else if (key === '-') { appendToDisplay('−'); } // Use display symbol
             else if (key === '*') { appendToDisplay('×'); } // Use display symbol
             else if (key === '/') { event.preventDefault(); appendToDisplay('÷'); } // Prevent browser find-as-you-type
             else if (key === 'Enter' || key === '=') { handleEquals(); }
             else if (key === 'Escape' || key.toLowerCase() === 'c') { handleClear(); }
             else if (key === '%') { handlePercent(); }
             else if (key === 'Backspace') {
                 if (display.value.length > 1) {
                     display.value = display.value.slice(0, -1);
                 } else {
                     display.value = '0';
                 }
             } else {
                 handled = false; // We didn't handle this key
             }
             if (handled) {
                 event.preventDefault(); // Prevent default action only if we handled the key
             }
        } else {
             if (key === 'Enter' || key === '=') {
                 event.preventDefault(); // Prevent form submission/newline
                 handleEquals();
             } else if (key === 'Escape') {
                 event.preventDefault(); // Prevent closing popup maybe?
                 handleClear();
             }
        }
    });

    handleClear(); // Start with '0' in the display and focus it.

});