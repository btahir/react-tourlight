'use client'

import { useState } from 'react'
import { SpotlightProvider, SpotlightTour, useSpotlight } from 'react-tourlight'
import 'react-tourlight/styles.css'

const initialSteps = [
  {
    target: '[data-landing-tour="project"]',
    title: 'A home for your next idea',
    content:
      'Create a project to bring your work together. Give it a name that makes you want to get started.',
    placement: 'bottom' as const,
  },
  {
    target: '[data-landing-tour="team"]',
    title: 'Better with good company',
    content:
      'Invite the people you want to build with. A shared workspace keeps everyone on the same page.',
    placement: 'left' as const,
  },
  {
    target: '[data-landing-tour="progress"]',
    title: 'Make a little progress',
    content: 'Small steps add up. Your setup checklist makes the next one easy to find.',
    placement: 'top' as const,
  },
]

function PlaygroundContent() {
  const [steps, setSteps] = useState(initialSteps)
  const [selected, setSelected] = useState(0)
  const [projects, setProjects] = useState(2)
  const [invited, setInvited] = useState(false)
  const [completed, setCompleted] = useState(false)
  const { start, stop, isActive } = useSpotlight()
  const step = steps[selected]

  function update(field: 'title' | 'content', value: string) {
    setSteps((previous) =>
      previous.map((item, index) => (index === selected ? { ...item, [field]: value } : item)),
    )
  }

  return (
    <div className="tl-playground" aria-label="Editable tour demonstration">
      <SpotlightTour id="landing-playground" steps={steps} />
      <div className="tl-playground-toolbar">
        <div>
          <span className="tl-demo-mark" aria-hidden="true">
            ✳
          </span>
          <strong>A guide, in the making.</strong>
          <span className="tl-live-label">LIVE DEMO</span>
        </div>
        <button
          type="button"
          className="tl-preview-button"
          onClick={() => (isActive ? stop() : start('landing-playground'))}
        >
          {isActive ? 'Stop preview' : '▶ Preview your guide'}
        </button>
      </div>
      <div className="tl-playground-body">
        <div className="tl-step-rail">
          <span className="tl-panel-label">
            YOUR GUIDE <span>3 STEPS</span>
          </span>
          <div className="tl-step-list">
            {steps.map((item, index) => (
              <button
                key={item.target}
                type="button"
                aria-pressed={index === selected}
                onClick={() => setSelected(index)}
              >
                <span className="tl-step-index">0{index + 1}</span>
                <span>{item.title}</span>
                <span aria-hidden="true">↗</span>
              </button>
            ))}
          </div>
          <div className="tl-rail-note">
            <span aria-hidden="true">↳</span> Pick a step.
            <br />
            Make the words yours.
            <br />
            Then give it a try.
          </div>
        </div>
        <div className="tl-sample-app">
          <div className="tl-sample-topbar">
            <span className="tl-sample-logo">
              morrow<span>workspace</span>
            </span>
            <span className="tl-avatar">AL</span>
          </div>
          <div className="tl-sample-content">
            <div className="tl-sample-greeting">
              <span className="tl-panel-label">YOUR SPACE TO MAKE THINGS</span>
              <h3>Good things start here.</h3>
              <p>A little more room for your next big idea.</p>
            </div>
            <div className="tl-project-row">
              <div>
                <strong>Projects</strong>
                <span>{projects} in your workspace</span>
              </div>
              <button
                type="button"
                data-landing-tour="project"
                onClick={() => setProjects((count) => count + 1)}
              >
                + New project
              </button>
            </div>
            <div className="tl-project-samples">
              <div>
                <span className="tl-project-art tl-project-art-one" aria-hidden="true">
                  <i />
                  <i />
                  <i />
                </span>
                <strong>The next chapter</strong>
                <span>Brand exploration</span>
              </div>
              <div>
                <span className="tl-project-art tl-project-art-two" aria-hidden="true">
                  <i />
                  <i />
                </span>
                <strong>A brighter tomorrow</strong>
                <span>Product ideas</span>
              </div>
            </div>
            <div className="tl-sample-bottom">
              <div data-landing-tour="progress" className="tl-setup">
                <span className="tl-panel-label">MAKE YOURSELF AT HOME</span>
                <label>
                  <input
                    type="checkbox"
                    checked={completed}
                    onChange={(event) => setCompleted(event.target.checked)}
                  />
                  <span>
                    {completed ? 'First project, ready to go' : 'Set up your first project'}
                  </span>
                </label>
              </div>
              <button
                type="button"
                data-landing-tour="team"
                className="tl-invite"
                onClick={() => setInvited((value) => !value)}
              >
                <span aria-hidden="true">{invited ? '✓' : '+'}</span>
                {invited ? 'Invite ready' : 'Invite a teammate'}
              </button>
            </div>
            <span className="tl-sample-feedback" role="status">
              {projects > 2
                ? `Project ${projects} created in this demo.`
                : invited
                  ? 'Demo invitation ready. No email is sent.'
                  : 'A working sample app. Click around.'}
            </span>
          </div>
        </div>
        <div className="tl-step-editor">
          <div className="tl-panel-label">
            EDIT STEP <span>0{selected + 1}</span>
          </div>
          <div className="tl-target-label">
            <span className="tl-status-dot" /> Target connected
          </div>
          <label htmlFor="demo-step-title">Headline</label>
          <input
            id="demo-step-title"
            value={step.title}
            onChange={(event) => update('title', event.target.value)}
            maxLength={100}
          />
          <label htmlFor="demo-step-content">A little guidance</label>
          <textarea
            id="demo-step-content"
            value={step.content}
            onChange={(event) => update('content', event.target.value)}
            rows={5}
            maxLength={400}
          />
          <p className="tl-editor-hint">
            These are real edits. Preview plays your words using the Tourlight runtime.
          </p>
          <button
            className="tl-reset-demo"
            type="button"
            onClick={() => {
              stop()
              setSteps(initialSteps)
              setSelected(0)
              setProjects(2)
              setInvited(false)
              setCompleted(false)
            }}
          >
            Reset demo <span aria-hidden="true">↺</span>
          </button>
        </div>
      </div>
      <div className="tl-playground-footer">
        <span>
          <span className="tl-status-dot" /> Runs in your browser
        </span>
        <span>
          This little demo is just the beginning. <a href="/studio">Open the full Studio ↗</a>
        </span>
      </div>
    </div>
  )
}

export function GuidePlayground() {
  return (
    <SpotlightProvider theme="light">
      <PlaygroundContent />
    </SpotlightProvider>
  )
}
