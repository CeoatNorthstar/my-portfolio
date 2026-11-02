// Order emails through Amazon SES, from books@naol.me: the reader's confirmation and shipping
// notice, and notes to the store owner. Each email goes out once per order (recorded as an
// order event), and a failure to send is logged without ever holding up the order.
import { AwsClient } from 'aws4fetch';
import { LEVELS } from './lulu.js';
import { now, uuid } from './util.js';

const FROM = 'Naol Demisse <books@naol.me>';
const region = (env) => env.SES_REGION || 'us-east-2';
const shopUrl = (env) => env.SHOP_URL || 'https://shop.naol.me';
const ownerEmail = (env) => env.STORE_CONTACT_EMAIL || env.CONTACT_TO_EMAIL;
export const mailConfigured = (env) => !!(env.SES_ACCESS_KEY_ID && env.SES_SECRET_ACCESS_KEY);

const sendEmail = async (env, { to, subject, html, text, replyTo }) => {
  const aws = new AwsClient({
    accessKeyId: env.SES_ACCESS_KEY_ID,
    secretAccessKey: env.SES_SECRET_ACCESS_KEY,
    service: 'ses',
    region: region(env),
  });
  const res = await aws.fetch(`https://email.${region(env)}.amazonaws.com/v2/email/outbound-emails`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      FromEmailAddress: FROM,
      Destination: { ToAddresses: [to] },
      ReplyToAddresses: replyTo ? [replyTo] : [],
      Content: {
        Simple: {
          Subject: { Data: subject, Charset: 'UTF-8' },
          Body: { Html: { Data: html, Charset: 'UTF-8' }, Text: { Data: text, Charset: 'UTF-8' } },
        },
      },
    }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.message || data.Message || `SES returned ${res.status}`);
  return data.MessageId;
};

// ── Templates: one quiet layout, in the site's colours ──

const esc = (s) => String(s == null ? '' : s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);
const money = (cents) => `$${((cents || 0) / 100).toFixed(2)}`;
const SANS = "-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif";

const layout = (title, body) => `<!doctype html>
<html><body style="margin:0;padding:32px 16px;background:#f7f6f3;color:#252421;font-family:Georgia,'Times New Roman',serif">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td align="center">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;background:#ffffff;border:1px solid #eae9e5;border-radius:10px">
<tr><td style="padding:32px 32px 28px">
<p style="margin:0 0 22px;font:11px/1 ${SANS};letter-spacing:.1em;text-transform:uppercase;color:#787774">Naol Demisse · Books</p>
<h1 style="margin:0 0 14px;font-weight:normal;font-size:30px;line-height:1.1;letter-spacing:-.01em">${esc(title)}</h1>
${body}
</td></tr></table>
<p style="margin:18px 0 0;font:12px/1.5 ${SANS};color:#a5a39e"><a href="https://shop.naol.me" style="color:#a5a39e">shop.naol.me</a></p>
</td></tr></table></body></html>`;

const para = (html) => `<p style="margin:0 0 14px;font:15px/1.6 ${SANS};color:#252421">${html}</p>`;
const button = (href, label) =>
  `<p style="margin:22px 0 4px"><a href="${esc(href)}" style="display:inline-block;padding:11px 18px;border-radius:6px;background:#252421;color:#ffffff;text-decoration:none;font:14px/1 ${SANS}">${esc(label)}</a></p>`;

const receipt = (o, items) => {
  const row = (label, value, strong) =>
    `<tr><td style="padding:6px 0;font:14px/1.4 ${SANS};color:${strong ? '#252421' : '#787774'}">${label}</td><td align="right" style="padding:6px 0;font:14px/1.4 ui-monospace,Menlo,monospace;color:#252421">${value}</td></tr>`;
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:18px 0 6px;border-top:1px solid #eae9e5;border-bottom:1px solid #eae9e5">
${items.map((i) => row(`${esc(i.title)} &times; ${i.qty}`, money(i.qty * i.unit_cents), true)).join('')}
${row(esc(LEVELS[o.shipping_level] || o.shipping_level), money(o.shipping_cents))}
${o.tax_cents ? row('Sales tax', money(o.tax_cents)) : ''}
${row('<strong style="font-weight:600">Total paid</strong>', money(o.total_cents), true)}
</table>`;
};

const receiptText = (o, items) =>
  [
    ...items.map((i) => `${i.title} x ${i.qty}  ${money(i.qty * i.unit_cents)}`),
    `${LEVELS[o.shipping_level] || o.shipping_level}  ${money(o.shipping_cents)}`,
    ...(o.tax_cents ? [`Sales tax  ${money(o.tax_cents)}`] : []),
    `Total paid  ${money(o.total_cents)}`,
  ].join('\n');

const orderLink = (env, o) => `${shopUrl(env)}/order/${o.id}?t=${o.token}`;

const confirmation = (env, o) => {
  const items = JSON.parse(o.items_json);
  const a = JSON.parse(o.address_json);
  const link = orderLink(env, o);
  return {
    to: o.email,
    replyTo: ownerEmail(env),
    subject: `Your order ${o.id}`,
    html: layout(
      'Thank you.',
      para(`Your order <strong>${esc(o.id)}</strong> is on its way to the printer. Each copy is printed for you, which takes a few days, and I will write again when it ships, with tracking.`) +
        receipt(o, items) +
        para(`<span style="color:#787774">Shipping to ${esc(a.name)}, ${esc(a.city)}, ${esc(a.country)}.</span>`) +
        button(link, 'Follow your order')
    ),
    text: `Thank you.\n\nYour order ${o.id} is on its way to the printer. Each copy is printed for you, which takes a few days, and I will write again when it ships, with tracking.\n\n${receiptText(o, items)}\n\nShipping to ${a.name}, ${a.city}, ${a.country}.\n\nFollow your order: ${link}\n`,
  };
};

const shipped = (env, o) => {
  const tracking = o.tracking_json ? JSON.parse(o.tracking_json) : [];
  const link = orderLink(env, o);
  const lines = tracking
    .map((t) => `${esc(t.carrier || 'Courier')} ${esc(t.id)}${t.urls && t.urls[0] ? ` &middot; <a href="${esc(t.urls[0])}" style="color:#252421">track the parcel</a>` : ''}`)
    .join('<br>');
  return {
    to: o.email,
    replyTo: ownerEmail(env),
    subject: `Your books have shipped (${o.id})`,
    html: layout(
      'On its way.',
      para(`Your order <strong>${esc(o.id)}</strong> has left the printer.`) +
        (lines ? para(lines) : '') +
        button(link, 'Follow your order')
    ),
    text: `On its way.\n\nYour order ${o.id} has left the printer.\n${tracking
      .map((t) => `${t.carrier || 'Courier'} ${t.id} ${(t.urls && t.urls[0]) || ''}`)
      .join('\n')}\n\nFollow your order: ${link}\n`,
  };
};

const ownerNew = (env, o) => {
  const items = JSON.parse(o.items_json);
  const a = JSON.parse(o.address_json);
  const details = [
    `${o.name} <${o.email}>${o.marketing_opt_in ? ' · wants news of the next book' : ''}`,
    `${a.street1}${a.street2 ? `, ${a.street2}` : ''}, ${a.city} ${a.state} ${a.postcode}, ${a.country} · ${a.phone}`,
    `Lulu's cost, about ${money(o.lulu_cost_cents)} · Lulu job ${o.lulu_job_id || 'not created yet'}`,
  ];
  return {
    to: ownerEmail(env),
    subject: `New order ${o.id}: ${money(o.total_cents)}`,
    html: layout(
      `New order ${o.id}`,
      receipt(o, items) + para(details.map(esc).join('<br>')) + button('https://eda.naol.me/admin/orders', 'Open the Orders tab')
    ),
    text: `New order ${o.id}\n\n${receiptText(o, items)}\n\n${details.join('\n')}\n\nhttps://eda.naol.me/admin/orders\n`,
  };
};

const ownerProblem = (env, o, problem) => ({
  to: ownerEmail(env),
  subject: `Order ${o.id} needs attention`,
  html: layout(
    `Order ${o.id} needs attention`,
    para(esc(problem)) + para(`${esc(o.name)} &lt;${esc(o.email)}&gt; paid ${money(o.total_cents)}.`) + button('https://eda.naol.me/admin/orders', 'Open the Orders tab')
  ),
  text: `Order ${o.id} needs attention\n\n${problem}\n\n${o.name} <${o.email}> paid ${money(o.total_cents)}.\n\nhttps://eda.naol.me/admin/orders\n`,
});

const TEMPLATES = { confirmation, shipped, owner_new: ownerNew };

// Send one kind of email for an order, unless it already went out.
export const sendOrderEmail = async (env, order, kind, problem) => {
  if (!mailConfigured(env)) return;
  const db = env.DB;
  const key = problem ? `${kind}:${problem.slice(0, 60)}` : kind;
  const sent = await db
    .prepare("SELECT 1 FROM store_events WHERE order_id = ? AND kind = 'email' AND detail LIKE ? LIMIT 1")
    .bind(order.id, `${key} sent%`)
    .first();
  if (sent) return;
  const message = kind === 'owner_problem' ? ownerProblem(env, order, problem) : TEMPLATES[kind](env, order);
  if (!message.to) return;
  try {
    const id = await sendEmail(env, message);
    await db
      .prepare('INSERT INTO store_events (id, order_id, kind, detail, created_at) VALUES (?, ?, ?, ?, ?)')
      .bind(uuid(), order.id, 'email', `${key} sent to ${message.to} (${id})`, now())
      .run();
  } catch (err) {
    await db
      .prepare('INSERT INTO store_events (id, order_id, kind, detail, created_at) VALUES (?, ?, ?, ?, ?)')
      .bind(uuid(), order.id, 'error', `Email ${kind} to ${message.to} failed: ${err.message}`.slice(0, 2000), now())
      .run();
  }
};
