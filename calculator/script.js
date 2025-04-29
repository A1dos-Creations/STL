document.addEventListener('DOMContentLoaded', function() {
    const display = document.getElementById('display');
    const buttons = document.querySelectorAll('.button');

    let currentInput = '0'; // String to hold the current number being entered
    let firstOperand = null; // Stores the first number in an operation
    let operator = null; // Stores the selected operator (+, -, *, /)
    let shouldResetDisplay = false; // Flag to clear display before next number input

    // Function to update the display
    function updateDisplay() {
        // Limit display length to prevent overflow (adjust number as needed)
        display.value = currentInput.length > 15 ? currentInput.substring(0, 15) : currentInput;
         // Basic auto-scroll to end if needed (might need refinement)
        display.scrollLeft = display.scrollWidth;
    }

    // Initialize display
    updateDisplay();

    // Add event listener to each button
    buttons.forEach(button => {
        button.addEventListener('click', () => {
            const value = button.textContent; // Get the text content of the button

            // Handle different button types
            if (button.classList.contains('number')) {
                handleNumber(value);
            } else if (button.classList.contains('decimal')) {
                handleDecimal();
            } else if (button.classList.contains('operator')) {
                handleOperator(value);
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

    function handleNumber(num) {
        if (currentInput === '0' || shouldResetDisplay) {
            currentInput = num;
            shouldResetDisplay = false;
        } else {
             // Prevent excessively long numbers
             if (currentInput.length < 15) {
                currentInput += num;
             }
        }
        updateDisplay();
    }

    function handleDecimal() {
        if (shouldResetDisplay) { // Start new number after operator/equals
            currentInput = '0.';
            shouldResetDisplay = false;
        } else if (!currentInput.includes('.')) { // Only add decimal if not already present
            currentInput += '.';
        }
        updateDisplay();
    }

    function handleOperator(opSymbol) {
        // Convert visual symbols to functional operators
        let op = opSymbol;
        if (op === '×') op = '*';
        if (op === '÷') op = '/';
        if (op === '−') op = '-';
        // '+' symbol is already correct

        // If an operator is already chosen and user clicks another, calculate first
        if (operator !== null && !shouldResetDisplay) {
             handleEquals(); // Calculate the previous operation first
        }

        // Handle case where user chains operations (e.g., 5 + 3 - 2)
        if (currentInput !== 'Error') {
             firstOperand = parseFloat(currentInput);
        }
        operator = op;
        shouldResetDisplay = true; // Next number input should reset the display
    }

    function handleEquals() {
        if (operator === null || firstOperand === null || shouldResetDisplay) {
            // Nothing to calculate if no operator/first operand,
            // or if equals is pressed right after an operator
            return;
        }

        const secondOperand = parseFloat(currentInput);
        let result = 0;

        // Perform calculation based on operator
        try {
            switch (operator) {
                case '+':
                    result = firstOperand + secondOperand;
                    break;
                case '-':
                    result = firstOperand - secondOperand;
                    break;
                case '*':
                    result = firstOperand * secondOperand;
                    break;
                case '/':
                    if (secondOperand === 0) {
                        throw new Error("Division by zero");
                    }
                    result = firstOperand / secondOperand;
                    break;
                default:
                    return; // Should not happen
            }

            // Format result (e.g., handle floating point inaccuracies, limit decimals)
            currentInput = formatResult(result);
            operator = null; // Reset operator after calculation
            firstOperand = null; // Reset first operand
            shouldResetDisplay = true; // Next number starts fresh

        } catch (error) {
            console.error("Calculation Error:", error);
            currentInput = "Error"; // Display error message
            // Reset state on error
            operator = null;
            firstOperand = null;
            shouldResetDisplay = true;
        } finally {
             updateDisplay();
        }
    }

     function formatResult(number) {
        // Limit to a reasonable number of decimal places to avoid floating point issues
        // and excessive length. Adjust precision as needed.
        if (Math.abs(number) > 1e15 || (Math.abs(number) < 1e-10 && number !== 0)) {
            return number.toExponential(8); // Use scientific notation for very large/small numbers
        }
        // Round to avoid long decimals from floating point math
        const rounded = parseFloat(number.toPrecision(12));
        return String(rounded);
    }

    function handleClear() {
        currentInput = '0';
        firstOperand = null;
        operator = null;
        shouldResetDisplay = false;
        updateDisplay();
    }

     function handlePlusMinus() {
        if (currentInput !== '0' && currentInput !== 'Error') {
            currentInput = String(parseFloat(currentInput) * -1);
            // If an operation was pending, update the operand that was just entered
            if (shouldResetDisplay && firstOperand !== null) {
                 firstOperand = parseFloat(currentInput); // Update the stored first operand if +/- is hit right after it
            }
            updateDisplay();
        }
    }

     function handlePercent() {
         if (currentInput !== 'Error') {
            // Percentage calculation usually depends on context (e.g. 50 + 10% means 50 + 5)
            // Simple implementation: divide by 100
            currentInput = String(parseFloat(currentInput) / 100);
             // If an operation was pending, update the operand that was just entered
            if (shouldResetDisplay && firstOperand !== null) {
                 firstOperand = parseFloat(currentInput);
            }
            updateDisplay();
         }
    }

    // Optional: Add keyboard support
    document.addEventListener('keydown', (event) => {
        const key = event.key;
        event.preventDefault(); // Prevent default browser actions for keys like '/'

        if (key >= '0' && key <= '9') {
            handleNumber(key);
        } else if (key === '.') {
            handleDecimal();
        } else if (key === '+' || key === '-') {
            handleOperator(key);
        } else if (key === '*') {
            handleOperator('×'); // Use the display symbol
        } else if (key === '/') {
            handleOperator('÷'); // Use the display symbol
        } else if (key === 'Enter' || key === '=') {
            handleEquals();
        } else if (key === 'Backspace') {
            // Simple backspace: clear last char or reset if needed
             if (shouldResetDisplay || currentInput.length === 1 || currentInput === 'Error') {
                 currentInput = '0';
                 if (currentInput.length === 1) shouldResetDisplay = false; // allow immediate typing if just '0'
             } else {
                 currentInput = currentInput.slice(0, -1);
             }
             updateDisplay();
        } else if (key === 'Escape' || key.toLowerCase() === 'c') {
            handleClear();
        } else if (key === '%') {
            handlePercent();
        }
        // +/- key requires shift usually, mapping might be complex, skipping for brevity
    });

});