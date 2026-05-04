class Calculator {
  constructor(previousOperandTextElement, currentOperandTextElement) {
    this.previousOperandTextElement = previousOperandTextElement;
    this.currentOperandTextElement = currentOperandTextElement;
    this.clear();
  }

  clear() {
    this.currentOperand = "0";
    this.previousOperand = "";
    this.operation = undefined;
    this.shouldResetScreen = false;
  }

  delete() {
    if (this.shouldResetScreen || this.currentOperand === "Error") {
      this.currentOperand = "0";
      this.shouldResetScreen = false;
      return;
    }

    if (this.currentOperand.length === 1) {
      this.currentOperand = "0";
    } else {
      this.currentOperand = this.currentOperand.slice(0, -1);
    }
  }

  appendNumber(number) {
    if (this.currentOperand === "Error") {
      this.currentOperand = "0";
    }

    if (this.shouldResetScreen) {
      this.currentOperand = "0";
      this.shouldResetScreen = false;
    }

    if (number === "." && this.currentOperand.includes(".")) return;

    if (number === "." && this.currentOperand === "0") {
      this.currentOperand = "0.";
      return;
    }

    if (this.currentOperand === "0" && number !== ".") {
      this.currentOperand = number;
    } else {
      this.currentOperand += number;
    }
  }

  chooseOperation(operation) {
    if (this.currentOperand === "Error") return;

    if (operation === "√") {
      this.computeSquareRoot();
      return;
    }

    if (this.currentOperand === "") return;

    if (this.previousOperand !== "") {
      this.compute();
    }

    this.operation = operation;
    this.previousOperand = this.currentOperand;
    this.currentOperand = "0";
  }

  computeSquareRoot() {
    const current = parseFloat(this.currentOperand);

    if (isNaN(current)) return;

    if (current < 0) {
      this.currentOperand = "Error";
      this.previousOperand = "";
      this.operation = undefined;
      this.shouldResetScreen = true;
      return;
    }

    this.currentOperand = Math.sqrt(current).toString();
    this.previousOperand = "";
    this.operation = undefined;
    this.shouldResetScreen = true;
  }

  compute() {
    let computation;
    const previous = parseFloat(this.previousOperand);
    const current = parseFloat(this.currentOperand);

    if (isNaN(previous) || isNaN(current)) return;

    switch (this.operation) {
      case "+":
        computation = previous + current;
        break;
      case "-":
        computation = previous - current;
        break;
      case "×":
      case "*":
        computation = previous * current;
        break;
      case "÷":
      case "/":
        if (current === 0) {
          this.currentOperand = "Error";
          this.previousOperand = "";
          this.operation = undefined;
          this.shouldResetScreen = true;
          return;
        }
        computation = previous / current;
        break;
      default:
        return;
    }

    this.currentOperand = computation.toString();
    this.operation = undefined;
    this.previousOperand = "";
    this.shouldResetScreen = true;
  }

  getDisplayNumber(number) {
    if (number === "Error") return "Error";

    const stringNumber = number.toString();
    const integerDigits = parseFloat(stringNumber.split(".")[0]);
    const decimalDigits = stringNumber.split(".")[1];

    let integerDisplay;

    if (isNaN(integerDigits)) {
      integerDisplay = "0";
    } else {
      integerDisplay = integerDigits.toLocaleString("en", {
        maximumFractionDigits: 0,
      });
    }

    if (decimalDigits != null) {
      return `${integerDisplay}.${decimalDigits}`;
    }

    return integerDisplay;
  }

  updateDisplay() {
    this.currentOperandTextElement.innerText = this.getDisplayNumber(
      this.currentOperand
    );

    if (this.operation != null) {
      this.previousOperandTextElement.innerText = `${this.getDisplayNumber(
        this.previousOperand
      )} ${this.operation}`;
    } else {
      this.previousOperandTextElement.innerText = "";
    }
  }
}

const numberButtons = document.querySelectorAll("[data-number]");
const operationButtons = document.querySelectorAll("[data-operation]");
const equalsButton = document.querySelector("[data-equals]");
const deleteButton = document.querySelector("[data-delete]");
const allClearButton = document.querySelector("[data-all-clear]");
const previousOperandTextElement = document.querySelector(
  "[data-previous-operand]"
);
const currentOperandTextElement = document.querySelector(
  "[data-current-operand]"
);

const calculator = new Calculator(
  previousOperandTextElement,
  currentOperandTextElement
);

numberButtons.forEach((button) => {
  button.addEventListener("click", () => {
    calculator.appendNumber(button.innerText);
    calculator.updateDisplay();
  });
});

operationButtons.forEach((button) => {
  button.addEventListener("click", () => {
    calculator.chooseOperation(button.innerText);
    calculator.updateDisplay();
  });
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