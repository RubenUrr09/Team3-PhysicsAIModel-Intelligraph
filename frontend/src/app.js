import React, { useState } from "react";
import axios from "axios";

function App() {
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");

  const handleSubmit = async () => {
    if (!question.trim()) return;
    
    const response = await axios.post("http://127.0.0.1:5000/predict", { question });
    setAnswer(response.data.answer);
  };

  return (
    <div className="container">
      <h1>Physics AI Solver</h1>
      <textarea 
        value={question} 
        onChange={(e) => setQuestion(e.target.value)} 
        placeholder="Enter a torque problem..." 
      />
      <button onClick={handleSubmit}>Solve</button>
      {answer && <div><strong> AI Answer:</strong> {answer}</div>}
    </div>
  );
}

export default App;