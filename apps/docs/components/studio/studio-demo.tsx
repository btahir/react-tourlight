'use client'

import { useState } from 'react'
import { TourStudio } from 'react-tourlight/studio'
import type { TourDocument } from 'react-tourlight/document'

const guide: TourDocument = {
  schemaVersion: 1,
  id: 'fieldnotes-welcome',
  name: 'A good place to start',
  description: 'A short introduction to the Fieldnotes sample workspace.',
  steps: [
    { id: 'welcome', target: '[data-tour="workspace-overview"]', title: 'Room for your next idea', content: 'This is your workspace. Keep your projects, people, and next steps together.', placement: 'bottom' },
    { id: 'create-project', target: '[data-tour="new-project"]', title: 'Make something happen', content: 'Create your first project. Give it a name that makes you want to get started.', placement: 'bottom', advanceOn: { event: 'click' } },
    { id: 'project-name', target: '[data-tour="project-name"]', title: 'Start with a name', content: 'Try “Autumn launch”. This is a real input — you can type while the guide is open.', placement: 'bottom', interactive: true },
    { id: 'create', target: '[data-tour="create-project"]', title: 'Your idea has a home', content: 'Create the project to add it to your workspace. Your work stays in this playground.', placement: 'left', advanceOn: { event: 'click' } },
  ],
}

export function StudioDemo() {
  const [projects, setProjects] = useState(['Brand refresh', 'Customer stories', 'Autumn collection'])
  const [dialog, setDialog] = useState(false)
  const [name, setName] = useState('')
  const [view, setView] = useState('Overview')
  const [announcement, setAnnouncement] = useState('')
  return <TourStudio defaultValue={guide} storageKey="tourlight-studio-demo-v1">
    <div className="fieldnotes">
      <header className="fieldnotes-nav"><span className="fieldnotes-logo">f<span>fieldnotes</span></span><span className="fieldnotes-avatar" aria-label="Alex Morgan">AM</span></header>
      <nav className="fieldnotes-tabs" aria-label="Sample app views">{['Overview', 'Projects', 'People'].map((tab) => <button key={tab} type="button" aria-current={view === tab ? 'page' : undefined} onClick={() => setView(tab)}>{tab}</button>)}</nav>
      <div className="fieldnotes-content">
        <div className="fieldnotes-heading" data-tour="workspace-overview"><div><p>YOUR WORK, A LITTLE MORE ORGANIZED</p><h2>{view === 'People' ? 'Good company.' : 'Good morning, Alex.'}</h2><span>{view === 'People' ? 'Great things happen together.' : 'A fresh page. A few good ideas. Let’s begin.'}</span></div><div className="fieldnotes-sun" aria-hidden="true">✳</div></div>
        {view === 'People' ? <div className="fieldnotes-person"><span className="fieldnotes-avatar">AM</span><div><strong>Alex Morgan</strong><small>Workspace owner</small></div><button type="button" data-tour="invite-member" onClick={() => setAnnouncement('Invitation copied in this demo. No message was sent.')}>Invite someone</button></div> : <>
          <div className="fieldnotes-section-heading"><h3>Your projects <span>{projects.length}</span></h3><button type="button" data-tour="new-project" onClick={() => setDialog(true)}>＋ New project</button></div>
          <div className="fieldnotes-projects">{projects.map((project, index) => <button type="button" key={`${project}-${index}`} className="fieldnotes-project" data-tour={index === 0 ? 'first-project' : undefined} onClick={() => setAnnouncement(`${project} selected.`)}><span className={`fieldnotes-project-icon fieldnotes-color-${index % 3}`}>{['◒', '▧', '✳'][index % 3]}</span><strong>{project}</strong><small>{index === 0 ? '12 tasks · 4 people' : index === 1 ? '8 tasks · 2 people' : 'A space to make progress'}</small><span className="fieldnotes-project-bottom"><span className="fieldnotes-mini-avatar">AM</span><span>↗</span></span></button>)}</div>
          <div className="fieldnotes-note" data-tour="workspace-note"><span aria-hidden="true">✎</span><div><strong>A small start is still a start.</strong><p>Create a project, invite your people, and make room for the work that matters.</p></div></div>
        </>}
        <div className="fieldnotes-announcement" role="status">{announcement}</div>
      </div>
      {dialog ? <div className="fieldnotes-dialog-backdrop"><div className="fieldnotes-dialog" role="dialog" aria-modal="false" aria-labelledby="project-dialog-title"><div className="fieldnotes-dialog-heading"><span className="fieldnotes-project-icon fieldnotes-color-0">✳</span><button type="button" aria-label="Close project dialog" onClick={() => setDialog(false)}>×</button></div><h3 id="project-dialog-title">A new beginning.</h3><p>Give your next project a place to grow.</p><form onSubmit={(e) => { e.preventDefault(); const title = name.trim() || 'Untitled project'; setProjects((items) => [...items, title]); setDialog(false); setName(''); setAnnouncement(`Created ${title}.`) }}><label>Project name<input data-tour="project-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Autumn launch" /></label><button type="submit" data-tour="create-project">Create project ↗</button></form></div></div> : null}
    </div>
  </TourStudio>
}
