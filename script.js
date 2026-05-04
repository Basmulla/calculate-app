class Calculator {
  constructor(currentOperandTextElement) {
    this.currentOperandTextElement = currentOperandTextElement;
    this.clear();
  }

  clear() {
    this.expression = "0";
    this.justCalculated = false;
  }

  delete() {
    if (this.expression === "Error" || this.expression === "Invalid Input") {
      this.clear();
      return;
    }

    if (this.expression.length <= 1) {
      this.expression = "0";
    } else {
      this.expression = this.expression.slice(0, -1);
    }
  }

  appendNumber(number) {
    if (this.expression === "Error" || this.expression === "Invalid Input" || this.justCalculated) {
      this.expression = "0";
      this.justCalculated = false;
    }

    const lastNumber = this.getLastNumber();

    if (number === "." && lastNumber.includes(".")) return;

    if (this.expression === "0" && number !== ".") {
      this.expression = number;
    } else if (number === "." && this.shouldStartDecimal()) {
      this.expression += "0.";
    } else {
      this.expression += number;
    }
  }

  appendOperation(operation) {
    if (this.expression === "Error" || this.expression === "Invalid Input") return;

    this.justCalculated = false;

    if (this.expression === "0" && operation === "-") {
      this.expression = "-";
      return;
    }

    const lastChar = this.expression.slice(-1);

    if (this.isOperator(lastChar)) {
      this.expression = this.expression.slice(0, -1) + operation;
      return;
    }

    if (lastChar === "(" && operation !== "-") return;

    this.expression += operation;
  }

  appendParenthesis(parenthesis) {
    if (this.expression === "Error" || this.expression === "Invalid Input" || this.justCalculated) {
      this.expression = "0";
      this.justCalculated = false;
    }

    if (this.expression === "0" && parenthesis === "(") {
      this.expression = "(";
      return;
    }

    const lastChar = this.expression.slice(-1);

    if (parenthesis === "(") {
      if (this.isNumber(lastChar) || lastChar === ")" || lastChar === ".") {
        this.expression += "×(";
      } else {
        this.expression += "(";
      }
      return;
    }

    if (parenthesis === ")") {
      const openCount = (this.expression.match(/\(/g) || []).length;
      const closeCount = (this.expression.match(/\)/g) || []).length;

      if (openCount > closeCount && !this.isOperator(lastChar) && lastChar !== "(") {
        this.expression += ")";
      }
    }
  }

  appendSquareRoot() {
    if (this.expression === "Error" || this.expression === "Invalid Input" || this.justCalculated) {
      this.expression = "0";
      this.justCalculated = false;
    }

    if (this.expression === "0") {
      this.expression = "√(";
      return;
    }

    const lastChar = this.expression.slice(-1);

    if (this.isNumber(lastChar) || lastChar === ")") {
      this.expression += "×√(";
    } else {
      this.expression += "√(";
    }
  }

  compute() {
    try {
      let expressionToEvaluate = this.closeOpenParentheses(this.expression);
      expressionToEvaluate = this.normalizeExpression(expressionToEvaluate);

      if (expressionToEvaluate === "" || this.hasInvalidEnding(expressionToEvaluate)) {
        this.expression = "Invalid Input";
        this.justCalculated = true;
        return;
      }

      const result = this.evaluateExpression(expressionToEvaluate);

      if (!Number.isFinite(result)) {
        this.expression = "Error";
      } else {
        this.expression = this.formatResult(result);
      }

      this.justCalculated = true;
    } catch (error) {
      this.expression = "Invalid Input";
      this.justCalculated = true;
    }
  }

  normalizeExpression(expression) {
    return expression
      .replaceAll("×", "*")
      .replaceAll("÷", "/")
      .replaceAll("√", "sqrt");
  }

  closeOpenParentheses(expression) {
    const openCount = (expression.match(/\(/g) || []).length;
    const closeCount = (expression.match(/\)/g) || []).length;
    const missingParentheses = openCount - closeCount;

    if (missingParentheses > 0) {
      return expression + ")".repeat(missingParentheses);
    }

    return expression;
  }

  evaluateExpression(expression) {
    const tokens = this.tokenize(expression);
    let index = 0;

    const peek = () => tokens[index];
    const consume = () => tokens[index++];

    const parseExpression = () => {
      let value = parseTerm();

      while (peek() === "+" || peek() === "-") {
        const operator = consume();
        const right = parseTerm();

        if (operator === "+") value += right;
        if (operator === "-") value -= right;
      }

      return value;
    };

    const parseTerm = () => {
      let value = parsePower();

      while (peek() === "*" || peek() === "/") {
        const operator = consume();
        const right = parsePower();

        if (operator === "*") value *= right;

        if (operator === "/") {
          if (right === 0) throw new Error("Division by zero");
          value /= right;
        }
      }

      return value;
    };

    const parsePower = () => {
      let value = parseFactor();

      while (peek() === "^") {
        consume();
        const exponent = parseFactor();
        value = Math.pow(value, exponent);
      }

      return value;
    };

    const parseFactor = () => {
      const token = peek();

      if (token === "+") {
        consume();
        return parseFactor();
      }

      if (token === "-") {
        consume();
        return -parseFactor();
      }

      if (token === "sqrt") {
        consume();

        if (consume() !== "(") {
          throw new Error("Expected opening parenthesis after sqrt");
        }

        const value = parseExpression();

        if (consume() !== ")") {
          throw new Error("Expected closing parenthesis after sqrt");
        }

        if (value < 0) {
          throw new Error("Cannot square root a negative number");
        }

        return Math.sqrt(value);
      }

      if (token === "(") {
        consume();
        const value = parseExpression();

        if (consume() !== ")") {
          throw new Error("Expected closing parenthesis");
        }

        return value;
      }

      if (this.isNumericToken(token)) {
        return parseFloat(consume());
      }

      throw new Error("Unexpected token");
    };

    const value = parseExpression();

    if (index < tokens.length) {
      throw new Error("Unexpected extra tokens");
    }

    return value;
  }

  tokenize(expression) {
    const tokens = [];
    let i = 0;

    while (i < expression.length) {
      const char = expression[i];

      if (char === " ") {
        i++;
        continue;
      }

      if (/[0-9.]/.test(char)) {
        let number = char;
        i++;

        while (i < expression.length && /[0-9.]/.test(expression[i])) {
          number += expression[i];
          i++;
        }

        if ((number.match(/\./g) || []).length > 1) {
          throw new Error("Invalid number");
        }

        tokens.push(number);
        continue;
      }

      if (expression.slice(i, i + 4) === "sqrt") {
        tokens.push("sqrt");
        i += 4;
        continue;
      }

      if ("+-*/^()".includes(char)) {
        tokens.push(char);
        i++;
        continue;
      }

      throw new Error("Invalid character");
    }

    return tokens;
  }

  formatResult(result) {
    const rounded = Math.round((result + Number.EPSILON) * 10000000000) / 10000000000;
    return rounded.toString();
  }

  getLastNumber() {
    const match = this.expression.match(/(\d+\.?\d*|\.\d+)$/);
    return match ? match[0] : "";
  }

  shouldStartDecimal() {
    const lastChar = this.expression.slice(-1);
    return this.isOperator(lastChar) || lastChar === "(" || lastChar === "√";
  }

  hasInvalidEnding(expression) {
    return /[+\-*/^.]$/.test(expression);
  }

  isOperator(char) {
    return ["+", "-", "×", "÷", "*", "/", "^"].includes(char);
  }

  isNumber(char) {
    return /[0-9]/.test(char);
  }

  isNumericToken(token) {
    return token !== undefined && /^\d*\.?\d+$/.test(token);
  }

  updateDisplay() {
    this.currentOperandTextElement.innerText = this.expression;
  }
}

const numberButtons = document.querySelectorAll("[data-number]");
const operationButtons = document.querySelectorAll("[data-operation]");
const parenthesisButtons = document.querySelectorAll("[data-parenthesis]");
const squareRootButton = document.querySelector("[data-sqrt]");
const equalsButton = document.querySelector("[data-equals]");
const deleteButton = document.querySelector("[data-delete]");
const allClearButton = document.querySelector("[data-all-clear]");
const currentOperandTextElement = document.querySelector("[data-current-operand]");

const calculator = new Calculator(currentOperandTextElement);

numberButtons.forEach((button) => {
  button.addEventListener("click", () => {
    calculator.appendNumber(button.innerText);
    calculator.updateDisplay();
  });
});

operationButtons.forEach((button) => {
  button.addEventListener("click", () => {
    calculator.appendOperation(button.innerText);
    calculator.updateDisplay();
  });
});

parenthesisButtons.forEach((button) => {
  button.addEventListener("click", () => {
    calculator.appendParenthesis(button.innerText);
    calculator.updateDisplay();
  });
});

squareRootButton.addEventListener("click", () => {
  calculator.appendSquareRoot();
  calculator.updateDisplay();
});

equalsButton.addEventListener("click", () => {
  calculator.compute();
  calculator.updateDisplay();
});

allClearButton.addEventListener("click", () => {
  calculator.clear();
  calculator.updateDisplay();
});

deleteButton.addEventListener("click", () => {
  calculator.delete();
  calculator.updateDisplay();
});

document.addEventListener("keydown", (event) => {
  const key = event.key;

  if (!isNaN(key)) {
    calculator.appendNumber(key);
  } else if (key === ".") {
    calculator.appendNumber(".");
  } else if (key === "+" || key === "-" || key === "^") {
    calculator.appendOperation(key);
  } else if (key === "*") {
    calculator.appendOperation("×");
  } else if (key === "/") {
    event.preventDefault();
    calculator.appendOperation("÷");
  } else if (key === "(" || key === ")") {
    calculator.appendParenthesis(key);
  } else if (key === "Enter" || key === "=") {
    event.preventDefault();
    calculator.compute();
  } else if (key === "Backspace") {
    calculator.delete();
  } else if (key === "Escape") {
    calculator.clear();
  }

  calculator.updateDisplay();
});