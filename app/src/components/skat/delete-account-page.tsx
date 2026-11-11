import { SignInButton, useClerk } from '@clerk/tanstack-react-start'
import * as stylex from '@stylexjs/stylex'
import { useEffect, useState } from 'react'
import { Btn, Modal, Panel } from './ui'
import { LEGAL_OPERATOR } from '~/lib/legal'
import { useAccount } from '~/lib/use-account'
import { m } from '~/paraglide/messages'
import { bp } from '../../theme/breakpoints.stylex'
import { color } from '../../theme/color.stylex'
import { border, space } from '../../theme/scale.stylex'
import { dims } from '../../theme/shape.stylex'
import { typography } from '../../theme/type'

// Deleting an account (SKATGO-185): the page the settings lead to and the address Google Play is given. Everyone reads
// what goes and what stays; the account signed in deletes itself from here, asked once more; whoever is signed out is
// shown how. After the deletion the page comes back signed out, saying it is done (`?deleted`).

const DONE = 'deleted'

export function DeleteAccountPage() {
  const account = useAccount()
  const clerk = useClerk()
  const [asking, setAsking] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [failed, setFailed] = useState(false)
  const [done, setDone] = useState(false)
  useEffect(() => setDone(new URLSearchParams(window.location.search).has(DONE)), [])

  async function remove() {
    setDeleting(true)
    setFailed(false)
    const ok = await fetch('/api/account/delete', { method: 'POST', headers: { 'content-type': 'application/json' }, body: '{}' })
      .then((r) => r.ok)
      .catch(() => false)
    if (!ok) {
      setDeleting(false)
      setFailed(true)
      return
    }
    // The account is gone at Clerk; its session in this browser goes with it. The page comes back signed out, from the
    // server, saying it is done.
    const back = `${window.location.pathname}?${DONE}`
    if (clerk.user) await clerk.signOut({ redirectUrl: back }).catch(() => {})
    window.location.replace(back)
  }

  return (
    <article data-testid="delete-account" {...stylex.props(styles.column)}>
      {done && !account ? (
        <Panel tone="good" pad>
          <div data-testid="delete-account-done" {...stylex.props(styles.stack)}>
            <h2 {...stylex.props(typography.dialogTitle, styles.title)}>{m.delete_done_title()}</h2>
            <p {...stylex.props(typography.body, styles.text)}>{m.delete_done_text()}</p>
          </div>
        </Panel>
      ) : null}
      <header {...stylex.props(styles.stack)}>
        <h1 {...stylex.props(typography.landingHeading, styles.title)}>{m.delete_title()}</h1>
        <p {...stylex.props(typography.body, styles.text)}>{m.delete_intro()}</p>
      </header>
      <section aria-labelledby="delete-gone" {...stylex.props(styles.stack)}>
        <h2 id="delete-gone" {...stylex.props(typography.dialogTitle, styles.title)}>{m.delete_gone_title()}</h2>
        <ul {...stylex.props(styles.list)}>
          {[m.delete_gone_account(), m.delete_gone_name(), m.delete_gone_games(), m.delete_gone_practice()].map((item) => (
            <li key={item} {...stylex.props(typography.body, styles.text)}>{item}</li>
          ))}
        </ul>
      </section>
      <section aria-labelledby="delete-kept" {...stylex.props(styles.stack)}>
        <h2 id="delete-kept" {...stylex.props(typography.dialogTitle, styles.title)}>{m.delete_kept_title()}</h2>
        <ul {...stylex.props(styles.list)}>
          {[m.delete_kept_forum(), m.delete_kept_device()].map((item) => (
            <li key={item} {...stylex.props(typography.body, styles.text)}>{item}</li>
          ))}
        </ul>
      </section>
      <section aria-labelledby="delete-how" {...stylex.props(styles.stack)}>
        <h2 id="delete-how" {...stylex.props(typography.dialogTitle, styles.title)}>{m.delete_how_title()}</h2>
        {account ? (
          <>
            <p {...stylex.props(typography.body, styles.text)}>{m.delete_how_signed_in()}</p>
            <div>
              <Btn tone="stop" size="lg" testId="delete-account-open" onClick={() => setAsking(true)}>{m.delete_button()}</Btn>
            </div>
          </>
        ) : (
          <>
            <p {...stylex.props(typography.body, styles.text)}>{m.delete_how_signed_out()}</p>
            <div>
              <SignInButton mode="modal">
                <Btn tone="quiet" size="lg" testId="delete-account-sign-in">{m.auth_sign_in()}</Btn>
              </SignInButton>
            </div>
          </>
        )}
        <p {...stylex.props(typography.body, styles.text)}>
          {m.delete_by_mail()}{' '}
          <a href={`mailto:${LEGAL_OPERATOR.email}`} {...stylex.props(typography.link, styles.link)}>{LEGAL_OPERATOR.email}</a>
        </p>
      </section>
      {asking ? (
        <Modal title={m.delete_confirm_title()} testId="delete-account-confirm" onClose={() => { if (!deleting) setAsking(false) }}>
          <div {...stylex.props(styles.stack)}>
            <p {...stylex.props(typography.body, styles.text)}>{m.delete_confirm_text()}</p>
            {failed ? <p role="alert" data-testid="delete-account-failed" {...stylex.props(typography.small, styles.failed)}>{m.delete_failed()}</p> : null}
            <div {...stylex.props(styles.actions)}>
              <Btn tone="stop" testId="delete-account-yes" disabled={deleting} onClick={() => void remove()}>{m.delete_confirm_yes()}</Btn>
              <Btn tone="quiet" testId="delete-account-no" disabled={deleting} onClick={() => setAsking(false)}>{m.delete_confirm_no()}</Btn>
            </div>
          </div>
        </Modal>
      ) : null}
    </article>
  )
}

const styles = stylex.create({
  column: {
    display: 'flex',
    flexDirection: 'column',
    gap: space.x32,
    width: '100%',
    maxWidth: dims.readingColumn,
    marginInline: 'auto',
    paddingBlock: { default: space.x32, [bp.phone]: space.x24 },
    paddingInline: { default: space.x24, [bp.phone]: space.x16 },
    boxSizing: 'border-box',
    overflowWrap: 'anywhere',
  },
  stack: { display: 'flex', flexDirection: 'column', gap: space.x12 },
  title: { margin: 0, color: color.navy },
  text: { margin: 0, color: color.text },
  list: { margin: 0, paddingInlineStart: space.x24, display: 'flex', flexDirection: 'column', gap: space.x8, listStyleType: 'disc' },
  failed: { margin: 0, color: color.bad },
  actions: { display: 'flex', flexWrap: 'wrap', gap: space.x12 },
  link: {
    color: color.info,
    textDecoration: { default: 'underline', ':hover': 'none' },
    outlineStyle: { default: 'none', ':focus-visible': 'solid' },
    outlineWidth: border.focus,
    outlineColor: color.info,
    outlineOffset: border.focusOffset,
  },
})
