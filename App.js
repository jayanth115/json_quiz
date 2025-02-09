import React, { useState, useEffect } from "react";
import "./App.css";

function App() {
  const [questions, setQuestions] = useState([]); 
  const [newQuestion, setNewQuestion] = useState({
    text: "",
    options: [
      { id: 0, text: "", isCorrect: false },
      { id: 1, text: "", isCorrect: false },
      { id: 2, text: "", isCorrect: false },
      { id: 3, text: "", isCorrect: false },
    ],
  });
  const [currentTab, setCurrentTab] = useState("quiz");
  const [showQuiz, setShowQuiz] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [score, setScore] = useState(0);
  const [timeRemaining, setTimeRemaining] = useState(10);
  const [editingQuestion, setEditingQuestion] = useState(null);
  const [selectedOptionId, setSelectedOptionId] = useState(null);

  useEffect(() => {
    fetch("http://localhost:5000/questions")
      .then((response) => response.json())
      .then((data) => setQuestions(data))
      .catch((error) => console.error("Error fetching questions:", error));
  }, []);

  useEffect(() => {
    if (showQuiz && !showResults) {
      setTimeRemaining(10);
      const timerInterval = setInterval(() => {
        setTimeRemaining((prevTime) => {
          if (prevTime <= 1) {
            clearInterval(timerInterval);
            optionClicked(false, null);
            return 0;
          }
          return prevTime - 1;
        });
      }, 1000);

      return () => clearInterval(timerInterval);
    }
  }, [showQuiz, showResults, currentQuestion]);

  const addQuestion = () => {
    if (editingQuestion) {
      updateQuestion();
      return;
    }
    fetch("http://localhost:5000/questions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(newQuestion),
    })
      .then((response) => response.json())
      .then((data) => {
        setQuestions([...questions, data]);
        resetForm();
      })
      .catch((error) => console.error("Error adding question:", error));
  };

  const deleteQuestion = (id) => {
    fetch(`http://localhost:5000/questions/${id}`, {
      method: "DELETE",
    })
      .then(() => {
        setQuestions(questions.filter((question) => question.id !== id));
      })
      .catch((error) => console.error("Error deleting question:", error));
  };

  const startQuiz = () => {
    setShowQuiz(true);
    setShowResults(false);
    setCurrentQuestion(0);
    setScore(0);
    setSelectedOptionId(null);
  };

  const optionClicked = (isCorrect, selectedId) => {
    setSelectedOptionId(selectedId);

    if (isCorrect) {
      setScore(score + 1);
    }

    setTimeout(() => {
      if (currentQuestion + 1 < questions.length) {
        setCurrentQuestion(currentQuestion + 1);
        setSelectedOptionId(null);
      } else {
        setShowResults(true);
        setShowQuiz(false);
      }
    }, 2000); 
  };

  const restartGame = () => {
    setShowResults(false);
    setShowQuiz(false);
    setCurrentQuestion(0);
    setScore(0);
    setSelectedOptionId(null);
  };

  const handleCorrectChange = (index) => {
    const updatedOptions = newQuestion.options.map((option, i) => ({
      ...option,
      isCorrect: i === index,
    }));
    setNewQuestion({ ...newQuestion, options: updatedOptions });
  };

  const handleEdit = (question) => {
    setEditingQuestion(question);
    setNewQuestion(question);
  };

  const updateQuestion = () => {
    fetch(`http://localhost:5000/questions/${editingQuestion.id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(newQuestion),
    })
      .then(() => {
        setQuestions(
          questions.map((q) =>
            q.id === editingQuestion.id ? { ...editingQuestion, ...newQuestion } : q
          )
        );
        resetForm();
      })
      .catch((error) => console.error("Error updating question:", error));
  };

  const resetForm = () => {
    setEditingQuestion(null);
    setNewQuestion({
      text: "",
      options: [
        { id: 0, text: "", isCorrect: false },
        { id: 1, text: "", isCorrect: false },
        { id: 2, text: "", isCorrect: false },
        { id: 3, text: "", isCorrect: false },
      ],
    });
  };

  return (
    <div className="App">
      <header>
        <h1>TriviaTrek: Journey through a World of Questions</h1>
        <nav>
          <button
            className={currentTab === "quiz" ? "active-tab" : ""}
            onClick={() => setCurrentTab("quiz")}
          >
            Quiz
          </button>
          <button
            className={currentTab === "manage" ? "active-tab" : ""}
            onClick={() => setCurrentTab("manage")}
          >
            Manage Questions
          </button>
        </nav>
      </header>

      {currentTab === "quiz" ? (
        <div>
          {showResults ? (
            <div className="final-results">
              <h1>Final Results</h1>
              <h2>
                {score} out of {questions.length} correct - (
                {((score / questions.length) * 100).toFixed(2)}%)
              </h2>
              <button onClick={restartGame}>Restart Quiz</button>
            </div>
          ) : showQuiz ? (
            <div className="question-card">
              <h2>
                Question {currentQuestion + 1} of {questions.length}
              </h2>
              <h3 className="question-text">
                {questions[currentQuestion].text}
              </h3>
              <div className="timer">Time Remaining: {timeRemaining}s</div>
              <ul>
                {questions[currentQuestion].options.map((option) => (
                  <li
                    key={option.id}
                    onClick={() =>
                      !selectedOptionId &&
                      optionClicked(option.isCorrect, option.id)
                    }
                    className={
                      selectedOptionId === option.id
                        ? option.isCorrect
                          ? "correct"
                          : "incorrect"
                        : option.isCorrect && selectedOptionId
                        ? "correct"
                        : ""
                    }
                  >
                    {option.text}
                  </li>
                ))}
              </ul>
              {selectedOptionId && (
                <p className="answer-feedback">
                  Correct Answer:{" "}
                  {
                    questions[currentQuestion].options.find(
                      (opt) => opt.isCorrect
                    ).text
                  }
                </p>
              )}
            </div>
          ) : (
            <div className="start-quiz">
              <h2>Welcome to the Quiz!</h2>
              <button
                onClick={startQuiz}
                disabled={questions.length === 0}
                className={questions.length === 0 ? "disabled" : ""}
              >
                {questions.length === 0
                  ? "Add Questions to Start"
                  : "Start Quiz"}
              </button>
            </div>
          )}
        </div>
      ) : (
        <div className="crud-form">
          <h2>{editingQuestion ? "Edit Question" : "Add a New Question"}</h2>
          <input
            className="jay1"
            type="text"
            placeholder="Question Text"
            value={newQuestion.text}
            onChange={(e) =>
              setNewQuestion({ ...newQuestion, text: e.target.value })
            }
          />
          {newQuestion.options.map((option, idx) => (
            <div key={idx} className="option-input">
              <input 
                className="jay2"
                type="text"
                placeholder={`Option ${idx + 1}`}
                value={option.text}
                onChange={(e) => {
                  const updatedOptions = [...newQuestion.options];
                  updatedOptions[idx].text = e.target.value;
                  setNewQuestion({ ...newQuestion, options: updatedOptions });
                }}
              />
              <input
                type="radio"
                name="correctOption"
                checked={option.isCorrect}
                onChange={() => handleCorrectChange(idx)}
              />
              Correct
            </div>
          ))}
        
          <button onClick={addQuestion}>
            {editingQuestion ? "Save Changes" : "Add Question"}
          </button>
          {editingQuestion && (
            <button onClick={resetForm}>Cancel Editing</button>

          )}

          <h3>Existing Questions</h3>
          <ul>
            {questions.map((question, index) => (
              <li key={index}>
                <p>{question.text}</p>
                <div id="jay">
                  <button onClick={() => handleEdit(question)}>Edit</button>
                  <button onClick={() => deleteQuestion(question.id)}>
                    Delete
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

export default App;
