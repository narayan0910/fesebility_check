import React, { useEffect, useRef, useState } from 'react';
import './index.css';

const API_BASE = import.meta.env.VITE_API_BASE || 'http://127.0.0.1:8000/api';

const navItems = ['Spotlights', 'AI Tools', 'Testimonials', 'For Schools'];
const communityLinks = ['Home', 'Communities', 'Trending', 'Journal', 'Saved'];

const spotlightCards = [
  {
    title: 'Spark Wall',
    subtitle: 'Featured founders',
    body: 'Live founder highlights will surface here as your program starts shipping stronger ideas.',
  },
  {
    title: 'Trending Communities',
    subtitle: 'Builder circles',
    body: 'Lessons & Missions, Order of FutureX, and AI Builder tracks stay visible across the workspace.',
  },
];

function App() {
  const [step, setStep] = useState('initial');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [history, setHistory] = useState([]);
  const [formData, setFormData] = useState(() => {
    const savedId = localStorage.getItem('feasibility_author_id');
    const authorId = savedId || `user_${Math.random().toString(36).substr(2, 9)}`;

    if (!savedId) {
      localStorage.setItem('feasibility_author_id', authorId);
    }

    return {
      idea: '',
      user_name: '',
      ideal_customer: '',
      problem_solved: '',
      authorId,
      conversation_id: null,
    };
  });
  const [clarifyingQuestion, setClarifyingQuestion] = useState('');
  const [report, setReport] = useState(null);
  const [qaMessages, setQaMessages] = useState([]);
  const [currentQuestion, setCurrentQuestion] = useState('');
  const [qaLoading, setQaLoading] = useState(false);
  const [polarizingAnswer, setPolarizingAnswer] = useState('');

  const chatEndRef = useRef(null);

  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [qaMessages]);

  const refreshHistory = async (authorId) => {
    try {
      const res = await fetch(`${API_BASE}/history?author_id=${authorId}`);
      const data = await res.json();
      setHistory(data);
    } catch (err) {
      console.error('Failed to fetch history', err);
    }
  };

  useEffect(() => {
    const loadHistory = async () => {
      try {
        const res = await fetch(`${API_BASE}/history?author_id=${formData.authorId}`);
        const data = await res.json();
        setHistory(data);
      } catch (err) {
        console.error('Failed to fetch history', err);
      }
    };

    loadHistory();
  }, [formData.authorId]);

  const handleInputChange = (event) => {
    const { name, value } = event.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const safeParseJson = (value) => {
    if (typeof value !== 'string') return value;

    try {
      const cleanJson = value.replace(/```json/g, '').replace(/```/g, '').trim();
      return JSON.parse(cleanJson);
    } catch (parseError) {
      console.error('JSON parse failed', parseError);
      return value;
    }
  };

  const startNewAnalysis = () => {
    setStep('initial');
    setFormData({
      idea: '',
      user_name: formData.user_name,
      ideal_customer: '',
      problem_solved: '',
      authorId: formData.authorId,
      conversation_id: null,
    });
    setReport(null);
    setClarifyingQuestion('');
    setPolarizingAnswer('');
    setQaMessages([]);
    setError(null);
  };

  const startAnalysis = async (event) => {
    event.preventDefault();
    setLoading(true);
    setError(null);
    setStep('loading');

    try {
      const response = await fetch(`${API_BASE}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...formData, conversation_id: null }),
      });

      if (!response.ok) {
        throw new Error(`Server Error: ${response.status}`);
      }

      const data = await response.json();

      if (data.conversation_id) {
        setFormData((prev) => ({ ...prev, conversation_id: data.conversation_id }));

        if (data.analysis && data.response !== 'Analysis Complete') {
          setClarifyingQuestion(data.analysis);
          setStep('clarification');
        } else {
          const parsedReport = safeParseJson(data.analysis);
          setReport(parsedReport);
          setStep('report');
        }

        refreshHistory(formData.authorId);
      }
    } catch (err) {
      setError(err.message || 'Failed to connect to the backend.');
      setStep('initial');
    } finally {
      setLoading(false);
    }
  };

  const submitClarification = async (event) => {
    event.preventDefault();
    setLoading(true);
    setError(null);
    setStep('loading');

    try {
      const response = await fetch(`${API_BASE}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          idea: polarizingAnswer,
        }),
      });

      if (!response.ok) {
        throw new Error(`Server Error: ${response.status}`);
      }

      const data = await response.json();
      const parsedReport = safeParseJson(data.analysis);
      setReport(parsedReport);
      setStep('report');
    } catch (err) {
      setError(err.message || 'Analysis failed.');
      setStep('clarification');
    } finally {
      setLoading(false);
    }
  };

  const selectHistoryItem = async (conversationId) => {
    setLoading(true);
    setStep('loading');

    try {
      const res = await fetch(`${API_BASE}/history/${conversationId}`);
      const data = await res.json();

      setFormData({
        idea: data.idea,
        user_name: data.user_name,
        ideal_customer: data.ideal_customer,
        problem_solved: data.problem_solved,
        authorId: formData.authorId,
        conversation_id: data.conversation_id,
      });

      setReport(safeParseJson(data.analysis));
      setQaMessages(
        data.qa_history
          .map((message) => [
            { role: 'user', text: message.q },
            { role: 'ai', text: message.a },
          ])
          .flat()
      );
      setStep('report');
    } catch {
      setError('Failed to load history item.');
      setStep('initial');
    } finally {
      setLoading(false);
    }
  };

  const submitQa = async (event) => {
    event.preventDefault();

    if (!currentQuestion.trim()) {
      return;
    }

    const userMsg = { role: 'user', text: currentQuestion };
    setQaMessages((prev) => [...prev, userMsg]);
    const questionToSubmit = currentQuestion;
    setCurrentQuestion('');
    setQaLoading(true);

    try {
      const response = await fetch(`${API_BASE}/qa`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          conversation_id: formData.conversation_id,
          question: questionToSubmit,
        }),
      });

      const data = await response.json();
      setQaMessages((prev) => [...prev, { role: 'ai', text: data.answer }]);
    } catch {
      setQaMessages((prev) => [...prev, { role: 'ai', text: 'Sorry, I had trouble answering.' }]);
    } finally {
      setQaLoading(false);
    }
  };

  const renderWorkbench = () => {
    if (step === 'loading') {
      return (
        <section className="surface-panel workbench-panel loading-panel">
          <div className="orb-spinner" />
          <p className="eyebrow">Analysis In Motion</p>
          <h2>Mapping market pull, founder fit, and competitive tension.</h2>
          <p className="muted-copy">The workspace is reviewing your idea, clustering the problem space, and preparing the next strategic move.</p>
        </section>
      );
    }

    if (step === 'clarification') {
      return (
        <section className="surface-panel workbench-panel">
          <div className="panel-heading">
            <div>
              <p className="eyebrow">Founder Prompt</p>
              <h2>Clarification Needed</h2>
            </div>
            <span className="status-pill">High signal request</span>
          </div>

          <div className="prompt-card">
            <p>{clarifyingQuestion}</p>
          </div>

          <form className="analysis-form" onSubmit={submitClarification}>
            <label htmlFor="clarification">Your response</label>
            <textarea
              id="clarification"
              value={polarizingAnswer}
              onChange={(event) => setPolarizingAnswer(event.target.value)}
              placeholder="Add the sharper angle, founder belief, or customer behavior that makes this idea polarizing."
              required
            />
            <div className="form-actions">
              <button type="submit" className="primary-button">
                Continue Analysis
              </button>
            </div>
          </form>
        </section>
      );
    }

    if (step === 'report' && report) {
      return (
        <section className="report-layout">
          <div className="report-grid report-grid-top">
            <article className="surface-panel report-card report-score">
              <p className="eyebrow">Feasibility Score</p>
              <div className="score-value">{report.score || '-'}</div>
              <p className="muted-copy">A quick read on viability, timing, and founder-market fit for this concept.</p>
            </article>

            <article className="surface-panel report-card">
              <p className="eyebrow">Idea Fit</p>
              <h3>Founder resonance and problem conviction</h3>
              <p>{report.idea_fit}</p>
            </article>
          </div>

          <article className="surface-panel report-card">
            <p className="eyebrow">Market Opportunity</p>
            <h3>Where the opening looks strongest</h3>
            <p>{report.opportunity}</p>
          </article>

          <div className="report-grid">
            <article className="surface-panel report-card">
              <p className="eyebrow">Competitors</p>
              <h3>Who already owns attention</h3>
              <p className="preformatted-copy">{report.competitors}</p>
            </article>

            <article className="surface-panel report-card">
              <p className="eyebrow">Targeting</p>
              <h3>Who to win first</h3>
              <p>{report.targeting}</p>
            </article>
          </div>

          <article className="surface-panel report-card next-step-card">
            <div>
              <p className="eyebrow">Next Step</p>
              <h3>What to validate next</h3>
            </div>
            <p>{report.next_step}</p>
          </article>

          <section className="surface-panel report-card qa-panel">
            <div className="panel-heading">
              <div>
                <p className="eyebrow">Research Thread</p>
                <h3>Market Q&A</h3>
              </div>
              <span className="status-pill">Conversation linked</span>
            </div>

            <div className="qa-stream">
              {qaMessages.length === 0 && <p className="empty-note">Ask about customer pain, competitor positioning, or launch wedges.</p>}
              {qaMessages.map((msg, index) => (
                <div key={index} className={`message-bubble ${msg.role}`}>
                  {msg.text}
                </div>
              ))}
              {qaLoading && <div className="message-bubble ai">Searching the saved research context...</div>}
              <div ref={chatEndRef} />
            </div>

            <form className="chat-input-area" onSubmit={submitQa}>
              <input
                className="chat-input"
                value={currentQuestion}
                onChange={(event) => setCurrentQuestion(event.target.value)}
                placeholder="Ask a follow-up about the analysis..."
                disabled={qaLoading}
              />
              <button type="submit" className="primary-button" disabled={qaLoading || !currentQuestion.trim()}>
                Ask
              </button>
            </form>
          </section>
        </section>
      );
    }

    return (
      <section className="surface-panel workbench-panel">
        <div className="panel-heading">
          <div>
            <p className="eyebrow">Founder Intake</p>
            <h2>Run a sharper feasibility review</h2>
          </div>
          <span className="status-pill">Live workspace</span>
        </div>

        <form className="analysis-form" onSubmit={startAnalysis}>
          <div className="field-grid">
            <div className="field-block">
              <label htmlFor="user_name">Founder Name</label>
              <input
                id="user_name"
                name="user_name"
                value={formData.user_name}
                onChange={handleInputChange}
                placeholder="e.g. Shruti"
                required
              />
            </div>

            <div className="field-block">
              <label htmlFor="ideal_customer">Ideal Customer</label>
              <input
                id="ideal_customer"
                name="ideal_customer"
                value={formData.ideal_customer}
                onChange={handleInputChange}
                placeholder="e.g. Indian high-school founders"
                required
              />
            </div>
          </div>

          <div className="field-block">
            <label htmlFor="idea">Startup Idea</label>
            <textarea
              id="idea"
              name="idea"
              value={formData.idea}
              onChange={handleInputChange}
              placeholder="Describe the concept, why it matters now, and what behavior you expect to change."
              required
            />
          </div>

          <div className="field-block">
            <label htmlFor="problem_solved">Problem Statement</label>
            <textarea
              id="problem_solved"
              name="problem_solved"
              value={formData.problem_solved}
              onChange={handleInputChange}
              placeholder="Explain the pain, current workaround, and why existing options still feel weak."
              required
            />
          </div>

          <div className="form-actions">
            <button type="submit" className="primary-button">
              Generate Feasibility Report
            </button>
            <button type="button" className="secondary-button" onClick={startNewAnalysis}>
              Reset Workspace
            </button>
          </div>
        </form>
      </section>
    );
  };

  return (
    <div className="app-shell">
      <aside className="left-rail">
        <div className="brand-block">
          <div className="brand-mark">F</div>
          <div>
            <p className="brand-name">FutureX</p>
            <p className="brand-subtitle">Founder Workspace</p>
          </div>
        </div>

        <button className="announcement-card" type="button">
          <span className="announcement-icon">◌</span>
          <span>Announcements</span>
        </button>

        <div className="rail-group">
          <p className="rail-label">General</p>
          <div className="nav-list">
            {communityLinks.map((item, index) => (
              <button key={item} type="button" className={`nav-item ${index === 0 ? 'active' : ''}`}>
                <span className="nav-dot" />
                <span>{item}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="rail-group">
          <div className="section-row">
            <p className="rail-label">Your Research</p>
            <button type="button" className="mini-button" onClick={startNewAnalysis}>
              +
            </button>
          </div>

          <div className="history-list">
            {history.length === 0 && <p className="empty-note">No saved analyses yet. Your next run will appear here.</p>}
            {history.map((item) => (
              <button
                key={item.conversation_id}
                type="button"
                className={`history-item ${formData.conversation_id === item.conversation_id ? 'active' : ''}`}
                onClick={() => selectHistoryItem(item.conversation_id)}
                title={item.idea}
              >
                <span className="history-badge">{item.idea.slice(0, 1).toUpperCase()}</span>
                <span>{item.idea}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="rail-footer">
          <p>Research ID</p>
          <strong>{formData.authorId.split('_')[1]}</strong>
        </div>
      </aside>

      <main className="app-main">
        <section className="hero-section">
          <header className="topbar">
            <div className="topbar-search">
              <span>⌕</span>
              <input type="text" value="" readOnly placeholder="Search posts by topic..." aria-label="Search posts by topic" />
            </div>

            <nav className="hero-nav" aria-label="Primary">
              {navItems.map((item) => (
                <a key={item} href="/">
                  {item}
                </a>
              ))}
            </nav>

            <button type="button" className="signin-button">
              Sign In
            </button>
          </header>

          <div className="hero-grid">
            <div className="hero-copy">
              <p className="eyebrow eyebrow-hero">International FutureX Fellowship • Since 2023</p>
              <h1>
                <span>International</span>
                <strong>FutureX</strong>
                <span>Feasibility Lab</span>
              </h1>
              <p className="hero-description">
                Where student founders pressure-test real venture ideas with faster market insight, sharper founder prompts, and a community-ready research workflow.
              </p>

              <div className="hero-actions">
                <button type="button" className="primary-button" onClick={startNewAnalysis}>
                  Request a School Demo
                </button>
                <div className="hero-statline">
                  <div>
                    <strong>38</strong>
                    <span>Impacted schools</span>
                  </div>
                  <div>
                    <strong>6,000+</strong>
                    <span>Students engaged</span>
                  </div>
                  <div>
                    <strong>MIT Sloan</strong>
                    <span>Inspired learning principles</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="hero-orbit" aria-hidden="true">
              <div className="orbit-ring orbit-ring-one" />
              <div className="orbit-ring orbit-ring-two" />
              <div className="globe-core">
                <span className="orbit-node orbit-node-a" />
                <span className="orbit-node orbit-node-b" />
                <span className="orbit-node orbit-node-c" />
              </div>
            </div>
          </div>
        </section>

        {error && (
          <div className="error-banner">
            <strong>Connection issue.</strong> {error}
          </div>
        )}

        <section className="workspace-grid">
          <div className="workspace-main">{renderWorkbench()}</div>

          <aside className="workspace-side">
            {spotlightCards.map((card, index) => (
              <article key={card.title} className={`surface-panel side-card ${index === 0 ? 'highlight-card' : ''}`}>
                <div className="panel-heading">
                  <div>
                    <p className="eyebrow">{card.title}</p>
                    <h3>{card.subtitle}</h3>
                  </div>
                  {index === 0 && <span className="status-pill live-pill">Live</span>}
                </div>
                <div className="placeholder-founders">
                  <div className="placeholder-bolt">⚡</div>
                  <p>{card.body}</p>
                </div>
              </article>
            ))}

            <article className="surface-panel side-card">
              <p className="eyebrow">Program Lens</p>
              <h3>Current workspace state</h3>
              <div className="metric-list">
                <div className="metric-row">
                  <span>Mode</span>
                  <strong>{step === 'report' ? 'Report Ready' : step === 'clarification' ? 'Awaiting Input' : loading ? 'Processing' : 'Intake'}</strong>
                </div>
                <div className="metric-row">
                  <span>Saved runs</span>
                  <strong>{history.length}</strong>
                </div>
                <div className="metric-row">
                  <span>Q&A messages</span>
                  <strong>{qaMessages.length}</strong>
                </div>
              </div>
            </article>
          </aside>
        </section>
      </main>
    </div>
  );
}

export default App;
