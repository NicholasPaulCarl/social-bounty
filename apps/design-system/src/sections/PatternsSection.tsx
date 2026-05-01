export function PatternsSection() {
  return (
    <section id="patterns">
      <h2 className="text-2xl font-heading font-bold mb-6">Patterns</h2>

      {/* Tables */}
      <h4 className="text-lg font-heading font-semibold mb-4">Table</h4>
      <div className="card p-0 mb-10 overflow-hidden">
        <div className="table-toolbar">
          <span className="font-heading font-semibold">Submissions</span>
        </div>
        <table className="table">
          <thead>
            <tr>
              <th>Hunter</th>
              <th>Bounty</th>
              <th>Status</th>
              <th>Submitted</th>
            </tr>
          </thead>
          <tbody>
            {[
              ['Alice M.', 'Instagram Reel', 'Verified', '2 hours ago'],
              ['Bob K.', 'TikTok Video', 'Pending', '5 hours ago'],
              ['Carol S.', 'Facebook Post', 'Failed', '1 day ago'],
            ].map(([hunter, bounty, status, time], i) => (
              <tr key={i}>
                <td>{hunter}</td>
                <td>{bounty}</td>
                <td>
                  <span className={`badge badge-${status === 'Verified' ? 'success' : status === 'Pending' ? 'warning' : 'danger'}`}>
                    {status}
                  </span>
                </td>
                <td className="text-text-muted">{time}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="pagination">
          <button className="page-btn" disabled>Prev</button>
          <button className="page-btn" aria-current="page">1</button>
          <button className="page-btn">2</button>
          <button className="page-btn">3</button>
          <button className="page-btn">Next</button>
        </div>
      </div>

      {/* Activity Feed */}
      <h4 className="text-lg font-heading font-semibold mb-4">Activity Feed</h4>
      <div className="card p-6 mb-10">
        <div className="feed">
          {[
            { dot: 'bg-green-500', body: 'Submission approved', time: '2 min ago' },
            { dot: 'bg-pink-500', body: 'New bounty created', time: '1 hour ago' },
            { dot: 'bg-blue-500', body: 'Payout initiated', time: '3 hours ago' },
            { dot: 'bg-slate-400', body: 'Profile updated', time: 'Yesterday' },
          ].map((item, i) => (
            <div key={i} className="feed-item">
              <div className={`feed-dot ${item.dot}`} />
              <div className="feed-body">{item.body}</div>
              <div className="feed-time">{item.time}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Receipt */}
      <h4 className="text-lg font-heading font-semibold mb-4">Receipt / Payout Breakdown</h4>
      <div className="card p-6 mb-10 max-w-sm">
        <div className="receipt">
          <div className="receipt-head">Payout Summary</div>
          <div className="receipt-line">
            <span>Bounty reward</span>
            <span>R 500.00</span>
          </div>
          <div className="receipt-line">
            <span>Platform fee (20%)</span>
            <span>-R 100.00</span>
          </div>
          <div className="receipt-line">
            <span>Transaction fee (3.5%)</span>
            <span>-R 17.50</span>
          </div>
          <div className="receipt-total">
            <span>You receive</span>
            <span>R 382.50</span>
          </div>
        </div>
      </div>

      {/* Progress */}
      <h4 className="text-lg font-heading font-semibold mb-4">Progress Bar</h4>
      <div className="card p-6 mb-10 space-y-4 max-w-md">
        <div className="progress">
          <div className="progress-bar" style={{ width: '75%' }} />
        </div>
        <div className="progress">
          <div className="progress-bar" style={{ width: '30%' }} />
        </div>
        <div className="progress-indet" />
      </div>

      {/* Tooltip & Popover */}
      <h4 className="text-lg font-heading font-semibold mb-4">Tooltip</h4>
      <div className="card p-6 mb-10">
        <div className="flex gap-8 items-center">
          <div className="relative inline-block">
            <button className="btn btn-secondary">Hover me</button>
            <div className="tooltip tooltip-top" style={{ visibility: 'visible', opacity: 1 }}>
              Tooltip on top
            </div>
          </div>
          <div className="relative inline-block">
            <button className="btn btn-secondary">Hover me</button>
            <div className="tooltip tooltip-bottom" style={{ visibility: 'visible', opacity: 1 }}>
              Tooltip on bottom
            </div>
          </div>
        </div>
      </div>

      {/* Forms */}
      <h4 className="text-lg font-heading font-semibold mb-4">Form Controls</h4>
      <div className="card p-6 mb-10 max-w-md space-y-4">
        <div className="field">
          <label>Email address</label>
          <input className="input" type="email" placeholder="you@example.com" />
          <span className="field-hint">We'll never share your email.</span>
        </div>
        <div className="field">
          <label>Password</label>
          <input className="input input-error" type="password" placeholder="********" />
          <span className="field-error">Password must be at least 8 characters.</span>
        </div>
        <div className="field">
          <label>Description</label>
          <textarea className="textarea" rows={3} placeholder="Tell us about your bounty..." />
        </div>
        <div className="field">
          <label>Category</label>
          <select className="select">
            <option>Select a category</option>
            <option>Social Media</option>
            <option>Content Creation</option>
            <option>Review</option>
          </select>
        </div>
      </div>

      {/* Avatars */}
      <h4 className="text-lg font-heading font-semibold mb-4">Avatars</h4>
      <div className="card p-6 mb-10">
        <div className="flex items-center gap-4 mb-4">
          <div className="avatar avatar-sm" style={{ background: 'var(--pink-200)', color: 'var(--pink-700)' }}>
            SM
          </div>
          <div className="avatar" style={{ background: 'var(--pink-200)', color: 'var(--pink-700)' }}>MD</div>
          <div className="avatar avatar-lg" style={{ background: 'var(--pink-200)', color: 'var(--pink-700)' }}>
            LG
          </div>
          <div className="avatar avatar-xl" style={{ background: 'var(--pink-200)', color: 'var(--pink-700)' }}>
            XL
          </div>
        </div>
        <p className="eyebrow mb-2 mt-4">Avatar Group</p>
        <div className="avatar-group">
          {['AB', 'CD', 'EF', 'GH'].map((initials) => (
            <div key={initials} className="avatar" style={{ background: 'var(--pink-200)', color: 'var(--pink-700)' }}>
              {initials}
            </div>
          ))}
        </div>
      </div>

      {/* Divider */}
      <h4 className="text-lg font-heading font-semibold mb-4">Divider</h4>
      <div className="card p-6 mb-10">
        <p className="body-sm">Content above</p>
        <div className="divider" />
        <p className="body-sm">Content below</p>
      </div>

      {/* Bottom Nav */}
      <h4 className="text-lg font-heading font-semibold mb-4">Mobile Bottom Nav</h4>
      <div className="card p-0 mb-10 overflow-hidden max-w-sm mx-auto">
        <div className="bottom-nav" style={{ position: 'relative' }}>
          <a className="bottom-nav-item is-active" href="#">Home</a>
          <a className="bottom-nav-item" href="#">Bounties</a>
          <a className="bottom-nav-item" href="#">Inbox</a>
          <a className="bottom-nav-item" href="#">Profile</a>
        </div>
      </div>
    </section>
  );
}
