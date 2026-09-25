'use client'

import { useState } from 'react'
import { SpotlightProvider, SpotlightTour } from 'react-tourlight'
import { TourChecklist, TourLauncher, type GuideItem } from 'react-tourlight/guidance'
import 'react-tourlight/styles.css'
import 'react-tourlight/guidance.css'

const projectSteps = [
  {
    target: '[data-guide="project-name"]',
    title: 'Every project starts with a name',
    content:
      'Give your project a name below. You can type into the actual field while the guide is open.',
    interactive: true,
    placement: 'bottom' as const,
  },
  {
    target: '[data-guide="create-project"]',
    title: 'Make your idea a project',
    content:
      'Select Create project to save it in this sample workspace. The guide will continue when you do.',
    advanceOn: { event: 'click' },
    placement: 'top' as const,
  },
  {
    target: '[data-guide="project-result"]',
    title: 'A good beginning',
    content:
      'Your project exists now. The checklist follows that application state, independently of whether you finish this guide.',
    placement: 'bottom' as const,
  },
]
const reminderSteps = [
  {
    target: '[data-guide="reminder"]',
    title: 'A rhythm that works for you',
    content:
      'Use this switch to turn your weekly reminder on. It only changes this demo; no notification is sent.',
    interactive: true,
    advanceOn: { event: 'change' },
    placement: 'bottom' as const,
  },
  {
    target: '[data-guide="reminder-status"]',
    title: 'You’re all set',
    content:
      'The checklist reads the current reminder preference. You can change it again whenever you like.',
    placement: 'top' as const,
  },
]

function DemoWorkspace() {
  const [projectName, setProjectName] = useState('')
  const [createdProject, setCreatedProject] = useState('')
  const [reminder, setReminder] = useState(false)
  const items: GuideItem[] = [
    {
      id: 'project',
      tourId: 'create-project-demo',
      title: 'Create your first project',
      description: 'Make a home for your next idea.',
      completed: Boolean(createdProject),
    },
    {
      id: 'reminder',
      tourId: 'reminder-demo',
      title: 'Set a weekly reminder',
      description: 'Find a rhythm that works for you.',
      completed: reminder,
    },
  ]

  return (
    <div className="tl-container tl-guidance-demo-grid">
      <SpotlightTour id="create-project-demo" steps={projectSteps} />
      <SpotlightTour id="reminder-demo" steps={reminderSteps} />
      <aside className="tl-guidance-demo-sidebar" aria-label="Onboarding and help">
        <TourChecklist
          items={items}
          title="A good place to begin"
          description="Two small tasks. A workspace that feels like yours."
        />
        <TourLauncher
          items={items}
          title="Find your next step"
          placeholder="Search projects, reminders…"
        />
      </aside>
      <section className="tl-guidance-workspace" aria-label="Sample workspace">
        <div className="tl-guidance-workspace-heading">
          <span className="tl-sample-logo">
            morrow<span>sample workspace</span>
          </span>
          <span className="tl-avatar">AL</span>
        </div>
        <div className="tl-guidance-workspace-content">
          <span className="tl-eyebrow">YOUR SPACE TO MAKE THINGS</span>
          <h2>
            Make yourself
            <br />
            <em>at home.</em>
          </h2>
          <p>
            Create something small. Set your own pace. The guides are there whenever you need a
            hand.
          </p>
          <section className="tl-demo-task" aria-labelledby="project-task-title">
            <span className="tl-role">01 / A HOME FOR YOUR IDEA</span>
            <h3 id="project-task-title">Your first project</h3>
            <form
              onSubmit={(event) => {
                event.preventDefault()
                if (projectName.trim()) setCreatedProject(projectName.trim())
              }}
            >
              <label htmlFor="guidance-project-name">Project name</label>
              <div className="tl-demo-form-row">
                <input
                  id="guidance-project-name"
                  data-guide="project-name"
                  value={projectName}
                  onChange={(event) => setProjectName(event.target.value)}
                  placeholder="Something worth making"
                  maxLength={80}
                  required
                />
                <button type="submit" data-guide="create-project" disabled={!projectName.trim()}>
                  Create project ↗
                </button>
              </div>
            </form>
            {createdProject ? (
              <div className="tl-demo-success" data-guide="project-result" role="status">
                <span aria-hidden="true">✓</span>
                <div>
                  <strong>{createdProject}</strong>
                  <span>Your project is ready. Make something good.</span>
                </div>
              </div>
            ) : null}
          </section>
          <section className="tl-demo-task" aria-labelledby="reminder-task-title">
            <span className="tl-role">02 / A LITTLE MOMENTUM</span>
            <h3 id="reminder-task-title">Your weekly rhythm</h3>
            <label className="tl-demo-toggle" data-guide="reminder">
              <span>
                <strong>A weekly reminder</strong>
                <span>A moment to come back to your ideas.</span>
              </span>
              <input
                type="checkbox"
                checked={reminder}
                onChange={(event) => setReminder(event.target.checked)}
              />
              <span aria-hidden="true" className="tl-demo-toggle-track" />
            </label>
            <p className="tl-demo-setting-status" data-guide="reminder-status" role="status">
              {reminder
                ? 'Weekly reminder enabled in this demo.'
                : 'Weekly reminder is off. You set the pace.'}
            </p>
          </section>
          <button
            type="button"
            className="tl-demo-reset"
            onClick={() => {
              setProjectName('')
              setCreatedProject('')
              setReminder(false)
            }}
          >
            Reset the sample workspace ↺
          </button>
        </div>
      </section>
    </div>
  )
}

export function GuidanceDemo() {
  return (
    <SpotlightProvider theme="light">
      <DemoWorkspace />
    </SpotlightProvider>
  )
}
