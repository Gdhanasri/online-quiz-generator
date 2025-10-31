import React, { useState } from 'react'

export default function App() {
  const [name, setName] = useState('')
  const [started, setStarted] = useState(false)
  const [inputText, setInputText] = useState('')
  const [questions, setQuestions] = useState([])
  const [loading, setLoading] = useState(false)
  const [current, setCurrent] = useState(0)
  const [score, setScore] = useState(0)
  const [finished, setFinished] = useState(false)

  const start = () => {
    if (!name.trim()) return alert('Enter your name')
    setStarted(true)
  }

  const generateQuiz = async () => {
    if (!inputText.trim()) return alert('Paste a topic / paragraph first')
    setLoading(true)
    setQuestions([])
    setCurrent(0)
    setScore(0)
    setFinished(false)
    try {
      const n = 5
      // Simple prompt for OpenAI
      const system = "You are a helpful assistant that creates clear multiple-choice quiz questions (4 options) from the given text/topic. Reply with a JSON array named questions where each item is {question, options, answer}."
      const userPrompt = `Create ${n} multiple-choice questions (with exactly 4 options each) based on this content. Output only valid JSON. Content:\n\n${inputText}`
      const resp = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer ' + import.meta.env.VITE_OPENAI_API_KEY
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages: [
            {role: 'system', content: system},
            {role: 'user', content: userPrompt}
          ],
          temperature: 0.3,
          max_tokens: 700
        })
      })
      if (!resp.ok) {
        const txt = await resp.text()
        throw new Error('OpenAI error: ' + resp.status + ' — ' + txt)
      }
      const data = await resp.json()
      const text = data.choices?.[0]?.message?.content ?? ''
      // Try to extract JSON from the model output
      const startIdx = text.indexOf('[')
      const jsonText = startIdx === -1 ? text : text.slice(startIdx)
      const parsed = JSON.parse(jsonText)
      // Validate parsed format
      if (!Array.isArray(parsed) || parsed.length === 0) throw new Error('Invalid questions format from model.')
      setQuestions(parsed)
    } catch (err) {
      alert('Failed to generate quiz: ' + err.message)
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const useSample = () => {
    const sample = [
      {question: "What does HTML stand for?", options: ["HyperText Markup Language","HighText Machine Language","HyperTransfer Markup Language","None of the above"], answer: "HyperText Markup Language"},
      {question: "Which company created JavaScript?", options: ["Netscape","Microsoft","Sun Microsystems","IBM"], answer: "Netscape"},
      {question: "Which tag links a CSS file?", options: ["<css>","<link>","<style>","<script>"], answer: "<link>"},
      {question: "React is mainly used for building?", options: ["Database","Connectivity","User Interface","Server"], answer: "User Interface"},
      {question: "Which hook is for state in React?", options: ["useEffect","useState","useMemo","useRef"], answer: "useState"},
    ]
    setQuestions(sample)
  }

  const answer = (opt) => {
    if (!questions.length) return
    if (opt === questions[current].answer) setScore(s => s + 1)
    if (current + 1 < questions.length) {
      setCurrent(c => c + 1)
    } else {
      setFinished(true)
    }
  }

  if (!started) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="w-full max-w-md p-6 bg-white rounded shadow">
          <h1 className="text-2xl font-bold mb-4">QuizForge AI — React Quiz Generator</h1>
          <input value={name} onChange={e => setName(e.target.value)} placeholder="Enter your name" className="w-full p-2 border rounded mb-3"/>
          <button onClick={start} className="w-full py-2 bg-blue-600 text-white rounded">Start Quiz</button>
        </div>
      </div>
    )
  }

  if (!questions.length && !finished) {
    return (
      <div className="min-h-screen flex items-start justify-center bg-gray-50 py-12">
        <div className="w-full max-w-2xl p-6 bg-white rounded shadow">
          <h2 className="text-xl font-semibold mb-3">Hello {name} — paste text/topic below to auto-generate a quiz</h2>
          <textarea value={inputText} onChange={e => setInputText(e.target.value)} rows={6} className="w-full p-3 border rounded mb-3" placeholder="Paste article paragraph or topic here..."></textarea>
          <div className="flex gap-3">
            <button onClick={generateQuiz} disabled={loading} className="px-4 py-2 bg-green-600 text-white rounded">{loading ? 'Generating...' : 'Generate Quiz'}</button>
            <button onClick={useSample} className="px-4 py-2 bg-gray-600 text-white rounded">Use Sample Quiz</button>
          </div>
          <p className="text-sm text-gray-500 mt-3">Note: create a <code>.env</code> with <code>VITE_OPENAI_API_KEY=sk-...</code> in the project root.</p>
        </div>
      </div>
    )
  }

  if (!finished) {
    const q = questions[current]
    return (
      <div className="min-h-screen flex items-start justify-center bg-gray-50 py-12">
        <div className="w-full max-w-2xl p-6 bg-white rounded shadow">
          <h3 className="text-lg font-semibold mb-2">Question {current+1}/{questions.length}</h3>
          <p className="mb-4">{q.question}</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {q.options.map((opt, i) => (
              <button key={i} onClick={() => answer(opt)} className="p-3 border rounded text-left">{opt}</button>
            ))}
          </div>
        </div>
      </div>
    )
  }

  // finished
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="w-full max-w-md p-6 bg-white rounded shadow text-center">
        <h2 className="text-2xl font-bold mb-4">Quiz Finished!</h2>
        <p className="mb-4">{name}, your score is {score}/{questions.length}</p>
        <div className="flex gap-3 justify-center">
          <button onClick={() => { setQuestions([]); setFinished(false); setInputText('') }} className="px-4 py-2 bg-gray-600 text-white rounded">Make New Quiz</button>
          <button onClick={() => { window.location.reload() }} className="px-4 py-2 bg-blue-600 text-white rounded">Restart App</button>
        </div>
      </div>
    </div>
  )
}
